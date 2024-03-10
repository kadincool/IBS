
// const canvas2d = document.getElementById("canvas2d");
// const ctx = canvas2d.getContext("2d");

const canvasgl = document.getElementById("canvasgl");
canvasgl.width = window.innerWidth;
canvasgl.height = window.innerHeight;
const gl = canvasgl.getContext("webgl");

const vShader = `
attribute vec4 position;
void main() {
  gl_Position = position;

  gl_PointSize = 10.0;
}
`;

const fShader = `
#define PI 3.1415926535897932384626433832795
precision mediump float;
uniform vec2 screenSize;
uniform vec3 camPos;
uniform int rayDist;

//boolean decides wether to round up or down
float ceilFloor(float number, bool toCeil) {
  return (toCeil ? ceil(number) : floor(number));
}

//seeded spatial hash function
float halfHash(float value) {
  return fract(sin(value * 1024.0));
}
float hash(float seed, vec3 pos) {
  float value = 0.0;
  value = halfHash(pos.x + seed);
  value = halfHash(value + pos.y + seed);
  value = halfHash(value + pos.z + seed);
  return value;
}

//Sine intERPolation
float serp(float v1, float v2, float pos) {
  return (sin((pos-0.5)*PI)/2.0+0.5)*(v2-v1)+v1;
}
float serp2d(float v1, float v2, float v3, float v4, vec2 pos) {
  return serp(serp(v1, v2, pos.x), serp(v3, v4, pos.x), pos.y);
}
float serp3d(float v1, float v2, float v3, float v4, float v5, float v6, float v7, float v8, vec3 pos) {
  return serp(serp(serp(v1, v2, pos.x), serp(v3, v4, pos.x), pos.y), serp(serp(v5, v6, pos.x), serp(v7, v8, pos.x), pos.y), pos.z);
}

float perlinStep3d(vec3 pos, float seed, float scale) {
  return serp3d(
    hash(seed, vec3(floor(pos.x/scale)*scale, floor(pos.y/scale)*scale, floor(pos.z/scale)*scale)),
    hash(seed, vec3(ceil(pos.x/scale)*scale, floor(pos.y/scale)*scale, floor(pos.z/scale)*scale)),
    hash(seed, vec3(floor(pos.x/scale)*scale, ceil(pos.y/scale)*scale, floor(pos.z/scale)*scale)),
    hash(seed, vec3(ceil(pos.x/scale)*scale, ceil(pos.y/scale)*scale, floor(pos.z/scale)*scale)),
    hash(seed, vec3(floor(pos.x/scale)*scale, floor(pos.y/scale)*scale, ceil(pos.z/scale)*scale)),
    hash(seed, vec3(ceil(pos.x/scale)*scale, floor(pos.y/scale)*scale, ceil(pos.z/scale)*scale)),
    hash(seed, vec3(floor(pos.x/scale)*scale, ceil(pos.y/scale)*scale, ceil(pos.z/scale)*scale)),
    hash(seed, vec3(ceil(pos.x/scale)*scale, ceil(pos.y/scale)*scale, ceil(pos.z/scale)*scale)),
    vec3(fract(pos.x/scale), fract(pos.y/scale), fract(pos.z/scale))
  );
}
float perlin3d(vec3 pos, float seed, float startScale, float endScale) {
  float scale = pow(2.0, startScale);
  float endS = pow(2.0, endScale);
  float max=0.0;
  float curr=0.0;
  for (int i=0; i<256; i++) {
    max+=scale;
    curr+=perlinStep3d(pos, seed, scale) * scale;
    if (scale >= endS) {
      return curr/max;
    }
    scale = scale*2.0;
  }
  return 0.0;
}

//see if intersected anything
bool checkTile(vec3 pos) {
  //return pos == vec3(0, 0, 1);
  //return pos.y == -3.0;
  return perlin3d(pos, 0.0, 3.0, 5.0) > 0.7;
}

//raycast, returns hit (or fade out) position as XYZ and distance as W
vec4 raycast(vec3 start, vec3 end) {
  vec3 offset = end - start;
  mat3 slopes = mat3(
    offset.x / offset.x, offset.y / offset.x, offset.z / offset.x,
    offset.x / offset.y, offset.y / offset.y, offset.z / offset.y,
    offset.x / offset.z, offset.y / offset.z, offset.z / offset.z
  );
  vec3 travelDist = vec3(
    length(slopes[0]),
    length(slopes[1]),
    length(slopes[2])
  );
  vec3 rayPos = start;
  if (offset == vec3(0.0, 0.0, 0.0)) {
    return vec4(rayPos, 0);
  }
  for (int i=0; i<32768; i++) {
    vec3 tileAt = vec3(
      floor(rayPos.x) - float(offset.x < 0.0 && fract(rayPos.x)==0.0),
      floor(rayPos.y) - float(offset.y < 0.0 && fract(rayPos.y)==0.0),
      floor(rayPos.z) - float(offset.z < 0.0 && fract(rayPos.z)==0.0)
    );
    if (checkTile(tileAt)) {
      return vec4(rayPos, distance(start, rayPos));
    }
    vec3 off = vec3(
      ceilFloor(rayPos.x + sign(offset.x), offset.x < 0.0) - rayPos.x,
      ceilFloor(rayPos.y + sign(offset.y), offset.y < 0.0) - rayPos.y,
      ceilFloor(rayPos.z + sign(offset.z), offset.z < 0.0) - rayPos.z
    );
    vec3 dist = vec3(abs(off * travelDist));
    int travelAxis = -1;
    float axisTravelDist = 1.0/0.0; //set to Infinity
    //find closest axis
    if (offset.x != 0.0 && dist.x < axisTravelDist) {
      travelAxis = 0;
      axisTravelDist = dist.x;
    }
    if (offset.y != 0.0 && dist.y < axisTravelDist) {
      travelAxis = 1;
      axisTravelDist = dist.y;
    }
    if (offset.z != 0.0 && dist.z < axisTravelDist) {
      travelAxis = 2;
      axisTravelDist = dist.z;
    }
    if (travelAxis == 0) {
      rayPos += slopes[0] * off.x;
    } else if (travelAxis == 1) {
      rayPos += slopes[1] * off.y;
    } else if (travelAxis == 2) {
      rayPos += slopes[2] * off.z;
    }
    if (distance(start, rayPos) > float(rayDist)) {
      return vec4(vec3(0.0, 0.0, 0.0), rayDist);
    }
  }
  return vec4(rayPos, distance(start, rayPos));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - screenSize) / screenSize.xx;
  vec4 rCast = raycast(camPos, vec3(uv, 1.0)+camPos);
  //float perlin = perlin3d(vec3(gl_FragCoord.xy, 0.0), 0.0, 1.0, 5.0);
  gl_FragColor = vec4(1.0 - rCast.www/float(rayDist), 1.0);
  //gl_FragColor = vec4(perlin, perlin, perlin, 1.0);
  //gl_FragColor = vec4(uv, perlin3d(vec3(gl_FragCoord.xy, 0.0), 0.0, 3.0, 5.0), 1.0);
}
`;
//make compiled versions of the shader
const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, vShader);
gl.compileShader(vs);

const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, fShader);
gl.compileShader(fs);

//link shaders to program
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program); 
gl.useProgram(program);

//log errors
console.log("Vertex Shader:", gl.getShaderInfoLog(vs));
console.log("Fragment Shader:", gl.getShaderInfoLog(fs));
console.log("Program:", gl.getProgramInfoLog(program));

//get and set screenSize uniform
var screenSize = gl.getUniformLocation(program, "screenSize");
gl.uniform2f(screenSize, canvasgl.width, canvasgl.height);

//get and set the camera position
var cameraPosition = gl.getUniformLocation(program, "camPos");
gl.uniform3f(cameraPosition, 0.0, 0.0, 0.0);
var cameraRotation = gl.getUniformLocation(program, "camRot");
gl.uniform3f(cameraRotation, 0.0, 0.0, 0.0);

//get and set rayDist
var rayDist = gl.getUniformLocation(program, "rayDist");
gl.uniform1i(rayDist, 256);

//make 2 triangles that fill up the screen
var position = gl.getAttribLocation(program, "position"); //get point shader value
var vertices = new Float32Array([ //positons to make 2 triangles in oppisite corners
  -1, -1,
  -1, 1,
  1, -1,
  -1, 1,
  1, -1,
  1, 1
]);
var posBuffer = gl.createBuffer(); //make a buffer to feed in the verticies
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer); //make the posBuffer use the array buffer
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); //feed the vertices into the array buffer
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0); //points the buffer as vector2 floats that are un-normalized with auto stride and offset
gl.enableVertexAttribArray(posBuffer); //enables the array

//set clear color
gl.clearColor(0.0, 0.0, 0.0, 1.0);

//clear
gl.clear(gl.COLOR_BUFFER_BIT);

//drawPoints
gl.drawArrays(gl.TRIANGLES, 0, 6);

//canvas2d
function pmod(a,b) {return (a%b+b)%b}
function ceilFloor(number, ceil) {return (ceil ? Math.ceil(number) : Math.floor(number))}
function flip(a, flip) {return (flip ? 1 - a : a)}

const scale = 10;
const castDist = 8;

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
  return y == -3
  //return y < x/2-8-z; //sloped terrain
  //return y==0 && z==1;//X pole
  //return x==0 && z==1;//Y pole
  //return x==1 && y==0;//Z pole
  //return x==0 && y==0 && z==1; //block
  //return perlin3d(x, y, z, 0, 3, 5) > 0.7;
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
  gl.uniform3f(cameraPosition, camPos.x, camPos.y, camPos.z);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  // clear();
  // const vWid = canvas2d.width / scale;
  // const vHei = canvas2d.height / scale
  // for (let i = 0; i < vWid; i++) {
  //   for (let j = 0; j < vHei; j++) {
  //     let uv = {x: (i * 2 - vWid) / vWid, y: (j * 2 - vHei) / -vWid};
  //     ctx.fillStyle = "white";
  //     let cast = raycast(camPos, {x: camPos.x + uv.x, y: camPos.y + uv.y, z: camPos.z + 1});
  //     // let cast = raycast(camPos, {x: camPos.x + uv.x + 1, y: camPos.y + uv.y, z: camPos.z + uv.x + 1});
  //     //console.log(cast);
  //     ctx.globalAlpha = Math.max((castDist - cast)/castDist, 0);
  //     plotTile(i, j)
  //   }
  // }
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
    case("KeyE"):
      camPos.y+=0.1;
      break;
    case("KeyQ"):
      camPos.y-=0.1;
      break;
  }
  frame()
})
