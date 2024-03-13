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
uniform mat4 camRot;
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

//perlin noise 3d
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
  //return pos.y < pos.x / 4.0 - pos.z - 5.0;
  if (pos.y < sin(pos.x/10.0) * 15.0 - 5.0) return true;
  if (perlin3d(pos, 0.0, 3.0, 5.0) > 0.7) return true;
}

//raycast, returns hit (or fade out) position as XYZ and distance as W
mat3 raycast(vec3 start, vec3 end) {
  //make ray data
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
    return mat3(
      rayPos, 
      vec3(0.0, 0.0, 0.0),
      normalize(vec3(0.0, 1.0, 0.0))
    );
  }
  //basically a while true
  for (int i=0; i<32768; i++) {
    //check current tile
    vec3 tileAt = vec3(
      floor(rayPos.x) - float(offset.x < 0.0 && fract(rayPos.x)==0.0),
      floor(rayPos.y) - float(offset.y < 0.0 && fract(rayPos.y)==0.0),
      floor(rayPos.z) - float(offset.z < 0.0 && fract(rayPos.z)==0.0)
    );
    if (checkTile(tileAt)) {
      //return vec4(rayPos, distance(start, rayPos));
      return mat3(
        rayPos,
        //vec3(1.0, 1.0, 1.0),
        rayPos-tileAt,
        normalize(vec3(
          float(fract(rayPos.x)==0.0) * -sign(offset.x), 
          float(fract(rayPos.y)==0.0) * -sign(offset.y), 
          float(fract(rayPos.z)==0.0) * -sign(offset.z)
        ))
      );
    }
    //get offset and distance to nearest directiom
    vec3 off = vec3(
      ceilFloor(rayPos.x + sign(offset.x), offset.x < 0.0) - rayPos.x,
      ceilFloor(rayPos.y + sign(offset.y), offset.y < 0.0) - rayPos.y,
      ceilFloor(rayPos.z + sign(offset.z), offset.z < 0.0) - rayPos.z
    );
    vec3 dist = vec3(abs(off * travelDist));
    //choose an axis
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
    //travel along axis
    if (travelAxis == 0) {
      rayPos += slopes[0] * off.x;
    } else if (travelAxis == 1) {
      rayPos += slopes[1] * off.y;
    } else if (travelAxis == 2) {
      rayPos += slopes[2] * off.z;
    }
    //if too far return 0 and max dist
    if (distance(start, rayPos) > float(rayDist)) {
      return mat3(
        normalize(rayPos-start)*float(rayDist)+start, 
        vec3(0.0, 0.0, 0.0),
        normalize(-offset)
      );
    }
  }
  //pos, UV, normal
  return mat3(
    normalize(rayPos-start)*float(rayDist)+start, 
    vec3(0.0, 0.0, 0.0),
    normalize(-offset)
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - screenSize) / screenSize.xx;
  vec3 castDir = vec3(uv, 1.0);
  vec3 lightDir = normalize(vec3(1.0, 3.0, 2.0));
  castDir = (vec4(castDir, 1.0) * camRot).xyz;
  mat3 rCast = raycast(camPos, castDir+camPos);
  float dist = distance(camPos, rCast[0]);
  // gl_FragColor = vec4(rCast[1]*max(dot(lightDir, rCast[2]), 0.1)*(1.0-dist/float(rayDist)), 1.0);
  gl_FragColor = vec4(vec3(1.0, 1.0, 1.0)*max(dot(lightDir, rCast[2]), 0.1)*(1.0-dist/float(rayDist)), 1.0);
  // gl_FragColor = vec4(rCast[1]*(1.0-dist/float(rayDist)), 1.0);
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

//get uniforms
var screenSize = gl.getUniformLocation(program, "screenSize");
var cameraPosition = gl.getUniformLocation(program, "camPos");
var cameraRotation = gl.getUniformLocation(program, "camRot");

//get and set rayDist
var rayDist = gl.getUniformLocation(program, "rayDist");

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

var scale = 1;
const castDist = 256;
const moveSpeed = 0.25;
const rotSpeed = 2.5;
var keys = {};

var camPos = {x: 0, y: 0, z: 0}; //github keeps refusing to update
var camRot = {x: 0, y: 0, z: 0};

function frame() {
  let camMatrix = new DOMMatrix();
  // camMatrix.rotateSelf(camRot.x, camRot.y, camRot.z);
  camMatrix.rotateSelf(camRot.x, 0, 0);
  camMatrix.rotateSelf(0, camRot.y, 0);
  camMatrix.rotateSelf(0, 0, camRot.z);

  //move
  if (keys.KeyW) {
    camPos.x += camMatrix.m13 * moveSpeed;
    camPos.y += camMatrix.m23 * moveSpeed;
    camPos.z += camMatrix.m33 * moveSpeed;
  };
  if (keys.KeyS) {
    camPos.x -= camMatrix.m13 * moveSpeed;
    camPos.y -= camMatrix.m23 * moveSpeed;
    camPos.z -= camMatrix.m33 * moveSpeed;
  };
  if (keys.KeyD) {
    camPos.x += camMatrix.m11 * moveSpeed;
    camPos.y += camMatrix.m21 * moveSpeed;
    camPos.z += camMatrix.m31 * moveSpeed;
  };
  if (keys.KeyA) {
    camPos.x -= camMatrix.m11 * moveSpeed;
    camPos.y -= camMatrix.m21 * moveSpeed;
    camPos.z -= camMatrix.m31 * moveSpeed;
  };
  if (keys.KeyE) {
    camPos.x += camMatrix.m12 * moveSpeed;
    camPos.y += camMatrix.m22 * moveSpeed;
    camPos.z += camMatrix.m32 * moveSpeed;
  };
  if (keys.KeyQ) {
    camPos.x -= camMatrix.m12 * moveSpeed;
    camPos.y -= camMatrix.m22 * moveSpeed;
    camPos.z -= camMatrix.m32 * moveSpeed;
  };
  // if (keys.KeyD) camPos.x += 0.2;
  // if (keys.KeyA) camPos.x -= 0.2;
  // if (keys.KeyE) camPos.y += moveSpeed;
  // if (keys.KeyQ) camPos.y -= moveSpeed;

  if (keys.ArrowLeft) camRot.y += rotSpeed;
  if (keys.ArrowRight) camRot.y -= rotSpeed;
  if (keys.ArrowUp) camRot.x += rotSpeed;
  if (keys.ArrowDown) camRot.x -= rotSpeed;

  //render
  let renderStart = performance.now();
  canvasgl.width = Math.ceil(window.innerWidth/scale);
  canvasgl.height = Math.ceil(window.innerHeight/scale);
  gl.uniform3f(cameraPosition, camPos.x, camPos.y, camPos.z);
  gl.uniformMatrix4fv(cameraRotation, false, camMatrix.toFloat32Array());
  gl.uniform2f(screenSize, canvasgl.width, canvasgl.height);
  gl.uniform1i(rayDist, castDist);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.finish();
  console.log(performance.now()-renderStart);
  requestAnimationFrame(frame);
}
frame();
console.log(new DOMMatrix().rotateSelf(0, 45, 0));

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
})