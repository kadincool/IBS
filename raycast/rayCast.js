
const canvas2d = document.getElementById("canvas2d");
const ctx = canvas2d.getContext("2d");

const canvasgl = document.getElementById("canvasgl");
const gl = canvas2d.getContext("webgl");

const vShader = `
void main() {
gl_Position = vec4(0.0, 0.0, 0.0, 1.0);

gl_PointSize = 10.0;
}
`;

const fShader = `
precision mediump float;
void main() {
gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

function pmod(a,b) {return (a%b+b)%b}
function ceilFloor(number, ceil) {return (ceil ? Math.ceil(number) : Math.floor(number))}
function flip(a, flip) {return (flip ? 1 - a : a)}

const scale = 10;
const castDist = 16;

var camPos = {x: 0, y: 0, z: 0}

function strokeLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function graphPoint(x, y) {
  ctx.fillRect(x-0.15, y-0.15, 0.3, 0.3);
}
function plotTile(x, y) {
  ctx.fillRect(x, y, 1, 1);
}

function clear() {
  ctx.resetTransform();
  ctx.fillStyle = "black";
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
  ctx.scale(scale, scale);
}

function halfHash(value) {
  return pmod(Math.sin(value) * 1024, 1);
}

function hash() {
  //method by my friend Thumbtack that I was too stubborn to use in my first version
  let value = 0;
  for (let i=0; i<arguments.length; i++) value = halfHash(value + arguments[i]);
  return value;
}

function serp(x1, x2, a) {return (Math.sin((a-0.5)*Math.PI)/2+0.5)*(x2-x1)+x1}
function serp2d(x1, x2, x3, x4, px, py) {return serp(serp(x1, x2, px), serp(x3, x4, px), py)}
function serp3d(x1, x2, x3, x4, x5, x6, x7, x8, px, py, pz) {return serp(serp2d(x1, x2, x3, x4, px, py), serp2d(x5, x6, x7, x8, px, py), pz)}

function perlinStep3d(x, y, z, seed, scale) {
  return serp3d(
    hash(Math.floor(x/scale)*scale, Math.floor(y/scale)*scale, Math.floor(z/scale), seed),
    hash(Math.ceil(x/scale)*scale, Math.floor(y/scale)*scale, Math.floor(z/scale), seed),
    hash(Math.floor(x/scale)*scale, Math.ceil(y/scale)*scale, Math.floor(z/scale), seed),
    hash(Math.ceil(x/scale)*scale, Math.ceil(y/scale)*scale, Math.floor(z/scale), seed),
    hash(Math.floor(x/scale)*scale, Math.floor(y/scale)*scale, Math.ceil(z/scale), seed),
    hash(Math.ceil(x/scale)*scale, Math.floor(y/scale)*scale, Math.ceil(z/scale), seed),
    hash(Math.floor(x/scale)*scale, Math.ceil(y/scale)*scale, Math.ceil(z/scale), seed),
    hash(Math.ceil(x/scale)*scale, Math.ceil(y/scale)*scale, Math.ceil(z/scale), seed),
    pmod(x/scale, 1),
    pmod(y/scale, 1),
    pmod(z/scale, 1)
  );
}

function perlin3d(x, y, z, seed, startScale, endScale) {
  startScale=2**startScale;
  endScale=2**endScale;
  let max=0;
  let curr=0;
  for (let i=startScale; i<endScale; i*=2) {
    max+=i;
    curr+=perlinStep3d(x, y, z, seed, i) * i;
  }
  
  return curr/max;
}

function checkTile(x, y, z) {
  //console.log(x, y, z)
  //return y < x/2-8-z; //sloped terrain
  //return y==0 && z==1;//X pole
  //return x==0 && z==1;//Y pole
  // return x==1 && y==0;//Z pole
  // return x==0 && y==0 && z==1; //block
  return perlin3d(x, y, z, 0, 3, 5) > 0.7;
}

function raycast(start, direction) {
  //ctx.strokeStyle = "red";
  //strokeLine(start.x, start.y, direction.x, direction.y);
  
  let offset = {x: direction.x - start.x, y: direction.y - start.y, z: direction.z - start.z};
  let magnitude = Math.hypot(offset.x, offset.y, offset.z);
  let normalized = {x: offset.x / magnitude, y: offset.y / magnitude, z: offset.z / magnitude};
  
  let slopes = {x: [normalized.y / normalized.x, normalized.z / normalized.x], y: [normalized.x / normalized.y, normalized.z / normalized.y], z: [normalized.x / normalized.z, normalized.y / normalized.z]};
  const maxDist = castDist;
  const travelDist = {
    x: Math.hypot(1, slopes.x[0], slopes.x[1]),
    y: Math.hypot(1, slopes.y[0], slopes.y[1]),
    z: Math.hypot(1, slopes.z[0], slopes.z[1])
  };
  let rayPos = {x: start.x, y: start.y, z: start.z};
  for (let i = 0; i < 2 * maxDist; i++) {
    let tileAt = {x: Math.floor(rayPos.x) - (offset.x < 0 && pmod(rayPos.x, 1) == 0), y: Math.floor(rayPos.y) - (offset.y < 0 && pmod(rayPos.y, 1) == 0), z: Math.floor(rayPos.z) - (offset.z < 0 && pmod(rayPos.z, 1) == 0)}
    // ctx.fillStyle = "yellow";
    // plotTile(tileAt.x, tileAt.y);
    if (checkTile(tileAt.x, tileAt.y, tileAt.z)) {
      return Math.hypot(rayPos.x - start.x, rayPos.y - start.y, rayPos.z - start.z);
    }

    let off = {
      x: ceilFloor(rayPos.x + Math.sign(offset.x), offset.x < 0)-rayPos.x,
      y: ceilFloor(rayPos.y + Math.sign(offset.y), offset.y < 0)-rayPos.y,
      z: ceilFloor(rayPos.z + Math.sign(offset.z), offset.z < 0)-rayPos.z
    };
    let dist = {
      x: Math.abs(off.x * travelDist.x),
      y: Math.abs(off.y * travelDist.y),
      z: Math.abs(off.z * travelDist.z)
    };
    if (isNaN(dist.x)) dist.x = Infinity;
    if (isNaN(dist.y)) dist.y = Infinity;
    if (isNaN(dist.z)) dist.z = Infinity;

    if (dist.x <= dist.y && dist.x <= dist.z) {
      rayPos.x += off.x;
      rayPos.y += slopes.x[0] * off.x;
      rayPos.z += slopes.x[1] * off.x;
    } else if (dist.y <= dist.z) {
      rayPos.x += slopes.y[0] * off.y;
      rayPos.y += off.y;
      rayPos.z += slopes.y[1] * off.y;
    } else {
      rayPos.x += slopes.z[0] * off.z;
      rayPos.y += slopes.z[1] * off.z;
      rayPos.z += off.z;
    }
    // console.log(rayPos);
    if (Math.hypot(rayPos.x - start.x, rayPos.y - start.y, rayPos.z - start.z) > maxDist) {
      return maxDist;
    }
  }
}

function frame() {
  clear();
  const vWid = canvas2d.width / scale;
  const vHei = canvas2d.height / scale
  for (let i = 0; i < vWid; i++) {
    for (let j = 0; j < vHei; j++) {
      let uv = {x: i/vWid-0.5, y: j/vHei-0.5};
      ctx.fillStyle = "white";
      let cast = raycast(camPos, {x: camPos.x + uv.x, y: camPos.y + uv.y, z: camPos.z + 1});
      // let cast = raycast(camPos, {x: camPos.x + uv.x + 1, y: camPos.y + uv.y, z: camPos.z + uv.x + 1});
      //console.log(cast);
      ctx.globalAlpha = Math.max((castDist - cast)/castDist, 0);
      plotTile(i, j)
    }
  }
}
frame();

document.addEventListener("keydown", (e) => {
  switch(e.code) {
    case ("KeyW"):
      camPos.z+=0.1;
      break;
    case("KeyS"):
      camPos.z-=0.1;
      break;
    case("KeyD"):
      camPos.x+=0.1;
      break;
    case("KeyA"):
      camPos.x-=0.1;
      break;
    case("KeyQ"):
      camPos.y+=0.1;
      break;
    case("KeyE"):
      camPos.y-=0.1;
      break;
  }
  frame()
})
