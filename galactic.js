  /* TODO:
  - add more consistent pulsing for stars
  - implement different types of main sequence stars with different colors and lens flare (using inheritance?)
  - implement limited star lifetimes
  - add novas, white dwarfs, neutron stars, and black holes(?) for dying stars
  */
  
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
    
    render(t) {
      let coords = this.getOrbitState(t);
      let x = (width/2) + coords.x;
      let y = (height/2) + coords.y;
      
      let centerY = width/2;
      let mouseVal = (mouseY - centerY)/centerY; //between -1 and 1, determines viewing angle of galaxy
      y = centerY + ((y-centerY) * mouseVal); //projected y coordinate after mouse rotation
      
      strokeWeight(0);
      fill(color(random(0,255),random(0,255),random(0,255)));  
      circle(x,y,random(3,10));
    }
    
    getLifetime() {
      return 
    }
  }
  
  let t = 0; //time tracker
  let tStep = 10; //timestep increment, default 10
  let stars = []; //stores all star instances
  let starFormationTime = 0; //timesteps till next star is spawned
  
  function setup() {
    createCanvas(800, 800);
    background(0);
  }
  
  function draw() {
    clear();
    if (starFormationTime <= 0) {
      stars.push(new Star(random(50,250), random(0.05,0.9), random(0,TWO_PI)));
      starFormationTime = random(10,100);
    }
    for (let i = 0; i < stars.length; ++i) {
      stars[i].render(t);  
    }
    let innerGlow = color(255,255,255,200);
    let outerGlow = color(255,240,70,10);
    for (let i = 0; i < 20; ++i) { //add central glow
      fill(255, 255 - i, 255 - i*10, 50 - i*3);
      circle(width/2, height/2, i*20 + 5);
    }
    tStep = mouseX/4;
    
    t += tStep;
    starFormationTime -= tStep;
  }
