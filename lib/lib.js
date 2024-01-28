function pmod(a,b) {return (a%b+b)%b}
function fdiv(a,b) {return Math.floor(a/b)}

function halfHash(value) {
  return pmod(Math.sin(value) * 1024, 1);
}

function hash() {
  //return pmod((arguments[0]+arguments[1])/10,1)
  //method by my friend Thumbtack that I was too stubborn to use in my first version
  //console.log(arguments);
  let value = 0;
  for (let i=0; i<arguments.length; i++) value = halfHash(value + arguments[i]);
  return value;
}

function serp(x1, x2, a) {return (Math.sin((a-0.5)*Math.PI)/2+0.5)*(x2-x1)+x1}//{return a*(x2-x1)+x1}//
function serp2d(x1, x2, x3, x4, px, py) {return serp(serp(x1, x2, px), serp(x3, x4, px), py)}
function serp3d(x1, x2, x3, x4, x5, x6, x7, x8, px, py, pz) {return serp(serp2d(x1, x2, x3, x4, px, py), serp2d(x5, x6, x7, x8, px, py), pz)}

function perlinStep2d(x,y,seed,scale) {
  return serp2d(
    hash(Math.floor(x/scale)*scale, Math.floor(y/scale)*scale, seed),
    hash(Math.ceil(x/scale)*scale, Math.floor(y/scale)*scale, seed),
    hash(Math.floor(x/scale)*scale, Math.ceil(y/scale)*scale, seed),
    hash(Math.ceil(x/scale)*scale, Math.ceil(y/scale)*scale, seed),
    pmod(x/scale, 1),
    pmod(y/scale, 1)
  );
}

function perlin2d(x, y, seed, startScale, endScale) {
  startScale=2**startScale;
  endScale=2**endScale;
  let max=0;
  let curr=0;
  for (let i=startScale; i<endScale; i*=2) {
    max+=i;
    curr+=perlinStep2d(x, y, seed, i) * i;
  }
  
  return curr/max;
}

function perlinChunkStep2d(x, y, width, height, seed, scale) {
  let out = new Array(width*height);
  x=Math.floor(x)
  y=Math.floor(y)
  let ff;
  let cf;
  let fc;
  let cc;
  for (let j=0; j<height; j++) {
    let py = y+j;
    ff = hash(Math.floor(x/scale)*scale, Math.floor(py/scale)*scale, seed);
    if (pmod(x,scale)==0) cf = ff; else cf = hash(Math.ceil(x/scale)*scale, Math.floor(py/scale)*scale, seed);
    if (pmod(py,scale)==0) fc = ff; else fc = hash(Math.floor(x/scale)*scale, Math.ceil(py/scale)*scale, seed);
    if (pmod(x,scale)==0) cc = fc; else cc = hash(Math.ceil(x/scale)*scale, Math.ceil(py/scale)*scale, seed);
    for (let k=0; k<width; k++) {
      let px = x+k; // ==; <- hammer
      //*
      if (pmod(px,scale)<1) { //problem child
        ff=cf;
        fc=cc;
        cf=hash(Math.ceil(px/scale)*scale+scale, Math.floor(py/scale)*scale, seed);
        if (pmod(py,scale)==0) cc = cf; else cc = hash(Math.ceil(px/scale)*scale+scale, Math.ceil(py/scale)*scale, seed);
      }//*/
      //out[k+j*width] = ff;
      out[k+j*width] = serp2d(ff,cf,fc,cc,pmod(px,scale)/scale,pmod(py,scale)/scale);
    }
  }
  return out;
}

//function perlinChunkStep2d(x, y, ) {

//}

/*function perlinChunkStep2d(x, y, width, height, seed, scale) {
  let out = new Array(width*height);
  for (let j=0; j<height; j++) {
    let py = j;
    for (let k=0; k<width; k++) {
      let px = k;
      out[k+j*width] = hash(j,k);
    }
  }
  return out;
}*/

function perlinChunk2d(x, y, width, height, seed, startScale, endScale) {
  
}

function getBit(value, bit) {
  return (value >> bit) % 2 == 1;
}

function toggleBit(value, bit) {
  let set = 0b1 << bit;
  return value ^ set;
}

function reverseString(string) {
  let reversed = "";
  for (let i = string.length-1; i>=0; i--) {
      reversed+=string[i];
  }
  return reversed;
}
