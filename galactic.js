  
  let centerGM = 1; // standard gravitational parameter of center (gravity strength)
  
  class Star {
    constructor(iSma, iEcc, iOmega, t0) {
      this.sma = iSma; // semi major axis (distance between lowest and highest point in orbit, in pixels)
      this.ecc = iEcc; // eccentricity (roundness of orbit, between 0 and 1)
      this.meanM = (centerGM / this.sma**3) ** 0.5 // mean motion (average angular speed of orbiting body)
      this.omega = iOmega; // starting position angle from canvas center
      
      this.t0 = t0; //store initialization time for lifetime calculation
    }
    
    //use Newton's method to solve Kepler's equation (M = E - e*sin(E))
    solveKepler(M, iterations=6) { 
      let E = M; // eccentric anomaly (radially projected angular position from center)  
      
      //rearranged Kepler's equation: f(E) = E - e*sin(E) - M
      for (let i = 0; i < iterations; ++i) {
          let f = E - this.ecc * sin(E) - M; // f(E), numerator
          let fp = 1 - this.ecc * cos(E); // (dE/df)f(E), denominator
          E = E - f / fp; // iterative numerical solving step
     }
      return E;
    }
    
    // Return orbital position and velocity in 2D
    // t  = current time
    // t0 = reference start time
    getOrbitState(t, t0 = 0) {
      let M = this.meanM * (t - t0); // mean anomaly (how far along orbital period)
    
      // wrap 0<M<2PI to prevent overflow
      M = M % TWO_PI;
      if (M < 0) M += TWO_PI;
    
      let E = this.solveKepler(M); // find eccentric anomaly with Kepler equation solver
    
      // Position in orbital plane
      let x = this.sma * (cos(E) - this.ecc);
      let y = this.sma * sqrt(1 - this.ecc**2) * sin(E);
    
      // rotate orbit based on omega
      let xr = x * cos(this.omega) - y * sin(this.omega);
      let yr = x * sin(this.omega) + y * cos(this.omega);
  
      return { x: xr, y: yr }; //return as map
    }

	 // returns screen coordinates and radial distance from center
    getScreenState(t) {
      let coords = this.getOrbitState(t);
      let sX = (width/2) + coords.x;
      let sY = (height/2) + coords.y;
      
      let centerY = width/2;
      let mouseVal = (mouseY - centerY)/centerY; //between -1 and 1, determines viewing angle of galaxy
      sY = centerY + ((sY-centerY) * mouseVal); //projected y coordinate after mouse rotation
		
		let sR = sqrt((sX-(width/2))**2 + (sY-(height/2))**2); //calculate radial distance from screen center
		
		return {x: sX, y: sY, r: sR};
    }
    
    getLifetime(t) { //returns timesteps since initiation
      return t-this.t0;
    }
  }

  class TypeO extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 1000;
		  this.iColor = color(50, 50, 255, 255);
		  this.fColor = color(255, 50, 50, 255); 
		  this.iRSize = 10; // initial physical radius
		  this.fRSize = 20; // final physical radius
	  }

	  render(t) {
		  let s; // physical size of rendered star
		  let c; // color of rendered star
		  let screenState = this.getScreenState(t);
		  let lifeStage = (this.lifetime - this.getLifetime(t))/this.lifetime; //stage of life from 1 (new) to 0 (dying)
		  if (lifeStage > 0.25) { // normal for 75% of lifetime
			  s = this.iRSize;
			  c = this.iColor
		  } else if (lifeStage > 0.1) { // transitions to red supergiant
			  let transitionStep = (lifeStage - 0.1) / 0.15; // value from 1 (starting transition) to 0 (ending transition) 
			  let r = red(this.fColor) + ((red(this.iColor) - red(this.fColor)) * transitionStep);
			  let g = green(this.fColor) + ((green(this.iColor) - green(this.fColor)) * transitionStep);
			  let b = blue(this.fColor) + ((blue(this.iColor) - blue(this.fColor)) * transitionStep);
			  s = this.fRSize + ((this.iRSize - this.fRSize) * transitionStep);
			  c = color(r,g,b, 255)
		  } else if (lifeStage > 0) { // stays red supergiant for last 10% of lifetime
			  s = this.fRSize;
			  c = this.fColor;
		  } else if (lifeStage > -0.1) { //supernova
			  let transitionStep = abs(lifeStage) / 0.1; // value from 0 (starting transition) to 1 (ending transition)
			  s = this.fRSize + (((this.fRSize * 5) - this.fRSize) * transitionStep);
			  let a = (1 - transitionStep) * 255; //fading out the supernova
			  c = color(255,255,255, a);
		  } else {
			  return 1; // signals end of life, set to null for garbage collection
		  }
		  fill(c);
		  circle(screenState.x, screenState.y, s);
		  fill(0,0,0,0);
		  //add 20 layers of glow effect
		  for (let i = 0; i < 20; ++i) {
			  s += 2;
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), blue(c), green(c), alpha(c)*0.8);
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }
  
  let t = 0; //time tracker
  let tStep = 10; //timestep increment, default 10
  let stars = []; //stores all star instances
  let starFormationTime = 0; //timesteps till next star is spawned
  
  function setup() {
    createCanvas(800, 800);
	 stroke(0,0,0,0);
	 strokeWeight(2);
    background(0);
  }
  
  function draw() {
    clear();
    if (starFormationTime <= 0) {
      stars.push(new TypeO(random(40,250), random(0.05,0.9), random(0,TWO_PI), t));
      starFormationTime = random(10,100);
    }
    for (let i = 0; i < stars.length; ++i) {
      if (stars[i].render(t)) { // returning 1 signals end of life
		  stars.splice(i,1);
	   }
    }
    
    tStep = mouseX/4;
    
    t += tStep;
    starFormationTime -= tStep;
  }
