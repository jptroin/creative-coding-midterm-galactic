let centerGM = 1; // standard gravitational parameter of center (gravity strength)

class Star {
  constructor(iSma, iEcc, iOmega) {
    this.sma = iSma; // semi major axis (distance between lowest and highest point in orbit, in pixels)
    this.ecc = iEcc; // eccentricity (roundness of orbit, between 0 and 1)
    this.meanM = (centerGM / this.sma**3) ** 0.5 // mean motion (average angular speed of orbiting body)
   this.omega = iOmega; // starting position angle from canvas center
  }
  
  //use Newton's method to solve Kepler's equations (M = E - e*sin(E))
  solveKepler(M, iterations=6) { 
    let E = M; // eccentric anomaly (radially projected angular position from center)  
    
    //rearranged Kepler's equation: f(E) = E - esin(E) - M
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

   // console.log("drawing at ", x, y);
   strokeWeight(0);
    fill(color(255,255,255));  
    circle(x,y,5);
  }
}

let t = 0; //time tracker
let tStep = 10; //time step increment
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
  t += tStep;
  starFormationTime -= tStep;
}
