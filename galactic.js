  
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
		  this.iColor = color(100, 100, 255, 255);
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
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 3;
		  } else if (screenState.r < 200) {
			  glowWeight = 2;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }

  class TypeB extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 10000;
		  this.iColor = color(150, 150, 255, 255);
		  this.fColor = color(255, 100, 50, 255); 
		  this.iRSize = 8; // initial physical radius
		  this.fRSize = 15; // final physical radius
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
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 3;
		  } else if (screenState.r < 200) {
			  glowWeight = 2;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }

  class TypeA extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 25000;
		  this.iColor = color(255, 255, 255, 255);
		  this.fColor = color(255, 200, 100, 255); 
		  this.iRSize = 5; // initial physical radius
		  this.fRSize = 10; // final physical radius
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
		  } else if (lifeStage > -0.1) { // turns into white dwarf
			  let transitionStep = abs(lifeStage) / 0.1; // value from 0 (starting transition) to 1 (ending transition)
			  s = this.fRSize + (((this.fRSize / 5) - this.fRSize) * transitionStep);
			  c = color(255,255,255,255);
		  } else if (lifeStage > -1) { // white dwarf stays for lifecycle duration
			  s = 1;
			  c = color(255,255,255,255);
		  } else {
			  return 1; // signals dead star
		  }
		  fill(c);
		  circle(screenState.x, screenState.y, s);
		  fill(0,0,0,0);
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 3;
		  } else if (screenState.r < 200) {
			  glowWeight = 2;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }

  class TypeF extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 50000;
		  this.iColor = color(255, 255, 150, 255);
		  this.fColor = color(255, 200, 50, 255); 
		  this.iRSize = 4; // initial physical radius
		  this.fRSize = 8; // final physical radius
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
		  } else if (lifeStage > -0.1) { // turns into white dwarf
			  let transitionStep = abs(lifeStage) / 0.1; // value from 0 (starting transition) to 1 (ending transition)
			  s = this.fRSize + (((this.fRSize / 5) - this.fRSize) * transitionStep);
			  c = color(255,255,255, 255);
		  } else if (lifeStage > -1) { // white dwarf stays for lifecycle duration
			  s = 1;
			  c = color(255,255,255,255);
		  } else {
			  return 1; // signals dead star
		  }
		  fill(c);
		  circle(screenState.x, screenState.y, s);
		  fill(0,0,0,0);
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 3;
		  } else if (screenState.r < 200) {
			  glowWeight = 2;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }

  class TypeG extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 100000;
		  this.iColor = color(255, 200, 100, 255);
		  this.fColor = color(255, 150, 50, 255); 
		  this.iRSize = 3; // initial physical radius
		  this.fRSize = 6; // final physical radius
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
		  } else if (lifeStage > -0.1) { // turns into white dwarf
			  let transitionStep = abs(lifeStage) / 0.1; // value from 0 (starting transition) to 1 (ending transition)
			  s = this.fRSize + (((this.fRSize / 5) - this.fRSize) * transitionStep);
			  c = color(255,255,255, 255);
		  } else if (lifeStage > -1) { // white dwarf stays for lifecycle duration
			  s = 1;
			  c = color(255,255,255,255);
		  } else {
			  return 1; // signals dead star
		  }
		  fill(c);
		  circle(screenState.x, screenState.y, s);
		  fill(0,0,0,0);
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 3;
		  } else if (screenState.r < 200) {
			  glowWeight = 2;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }

  class TypeK extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 200000;
		  this.iColor = color(255, 150, 0, 255);
		  this.fColor = color(255, 100, 0, 255); 
		  this.iRSize = 2; // initial physical radius
		  this.fRSize = 4; // final physical radius
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
		  } else if (lifeStage > -0.1) { // turns into white dwarf
			  let transitionStep = abs(lifeStage) / 0.1; // value from 0 (starting transition) to 1 (ending transition)
			  s = this.fRSize + (((this.fRSize / 5) - this.fRSize) * transitionStep);
			  c = color(255,255,255, 255);
		  } else if (lifeStage > -1) { // white dwarf stays for lifecycle duration
			  s = 1;
			  c = color(255,255,255,255);
		  } else {
			  return 1; // signals dead star
		  }
		  fill(c);
		  circle(screenState.x, screenState.y, s);
		  fill(0,0,0,0);
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 2;
		  } else if (screenState.r < 200) {
			  glowWeight = 2;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
		  }
		  stroke(0,0,0,0);
		  
		  return 0; // signals that the star is still alive
	  }
  }

  class TypeM extends Star {
	  constructor(iSma, iEcc, iOmega, t0) {
	     super(iSma, iEcc, iOmega, t0);
		  this.lifetime = 500000;
		  this.iColor = color(255, 0, 0, 255);
		  this.fColor = color(100, 100, 255, 255); 
		  this.iRSize = 2; // initial physical radius
		  this.fRSize = 3; // final physical radius
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
		  } else if (lifeStage > -0.1) { // turns into white dwarf
			  let transitionStep = abs(lifeStage) / 0.1; // value from 0 (starting transition) to 1 (ending transition)
			  s = this.fRSize + (((this.fRSize / 5) - this.fRSize) * transitionStep);
			  c = color(255,255,255, 255);
		  } else if (lifeStage > -1) { // white dwarf stays for lifecycle duration
			  s = 1;
			  c = color(255,255,255,255);
		  } else {
			  return 1; // signals dead star
		  }
		  fill(c);
		  circle(screenState.x, screenState.y, s);
		  fill(0,0,0,0);
		  
		  //add 20 layers of glow effect with differing size depending on distance to center
		  let glowWeight;
		  if (screenState.r < 100) {
			  glowWeight = 2;
		  } else if (screenState.r < 200) {
			  glowWeight = 1;
		  } else {
			  glowWeight = 1;
		  }
		  for (let i = 0; i < 20; ++i) {
			  s += glowWeight;
			  strokeWeight(glowWeight);
			  stroke(c); //only tracing outlines to prevent washing out colors from multiple layers
			  circle(screenState.x, screenState.y, s);
			  c = color(red(c), green(c), blue(c), alpha(c)*0.8); // reduce alpha by 20% for each subsequent glow layer
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
    if (starFormationTime <= 0 && stars.length < 200) {
		let r = int(random(0,7));
		let s; // type of star to be added
		if (r == 0) {
			s = new TypeO(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		} else if (r == 1) {
			s = new TypeB(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		} else if (r == 2) {
			s = new TypeA(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		} else if (r == 3) {
			s = new TypeF(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		} else if (r == 4) {
			s = new TypeG(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		} else if (r == 5) {
			s = new TypeK(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		} else {
			s = new TypeM(random(40,250), random(0.05,0.9), random(0,TWO_PI), t);
		}
      stars.push(s);
      starFormationTime = random(10,100);
    }
    for (let i = 0; i < stars.length; ++i) {
      if (stars[i].render(t)) { // returning 1 signals end of life
		  stars.splice(i,1); // remove dead star from list
	   }
    }
    
    tStep = mouseX/4;
    
    t += tStep;
    starFormationTime -= tStep;
  }
