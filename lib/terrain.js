import {pmod, fdiv} from "./lib.js";
import * as lib from "./lib.js";

export var chunks = [];
export var chunkIndex = [];

export function genChunk(chunkX, chunkY) {
  let chunkDat = new Array(64).fill(0);
  for (let i=0; i<chunkDat.length; i++) {
    let x = chunkX * 8 + pmod(i, 8);
    let y = chunkY * 8 + fdiv(i, 8);
    let val = perlin2d(x, y, 0, 3, 5);
    //if (val > 0.5) chunkDat[i] = Math.floor(hash(x,y,0)*(tiles.length-1))+1;
    if (val > 0.5) chunkDat[i] = 1;
    //chunkDat[i] = 1;
  }
  return chunkDat;
}

export function getChunk(chunkX, chunkY) {
  let currIndex = chunkIndex.findIndex((elem) => {if (elem[0]==chunkY) {return elem[1] >= chunkX} else {return elem[0] >= chunkY}});
  if (chunkIndex[currIndex] && chunkIndex[currIndex][0]==chunkX && chunkIndex[currIndex][1]==chunkY) {
    return chunkIndex[currIndex][2];
  } else {
    if (currIndex < 0) currIndex = chunkIndex.length; //If it cant find it, it returns -1. set it to add to the end of the array instead.
    chunkIndex.splice(currIndex, 0, [chunkX, chunkY, chunks.length]);
    chunks.push(genChunk(chunkX, chunkY));
    return chunks.length-1;
  }
}

export function getTile(tileX, tileY) {
  return chunks[getChunk(fdiv(tileX, 8), fdiv(tileY, 8))][pmod(tileX, 8) + pmod(tileY, 8) * 8];
}

export function setTile(tileX, tileY, set) {
  chunks[getChunk(fdiv(tileX, 8), fdiv(tileY, 8))][pmod(tileX, 8) + pmod(tileY, 8) * 8] = set;
}

export function drawChunk(chunkX, chunkY, x, y) {
  const data = chunks[getChunk(chunkX, chunkY)];
  for (let i=0; i<data.length; i++) {
    //can2d.fillStyle = tiles[data[i]].color1;
    //can2d.fillRect(x+pmod(i,8)*scale, y+fdiv(i,8)*scale, scale, scale);
    drawTile(tiles[data[i]], x+pmod(i,8), y+fdiv(i,8));
  }
}

export function drawTile(tile, x, y, flipX, flipY) {
  //scale/=4;
  if (lib.graphics.mono) {
    lib.can2d.fillStyle = tile.color1;
    lib.can2d.fillRect(x, y, 1, 1);
  } else {
    for (let i=0; i<16; i++) {
      if (lib.getBit(tile.pattern, i)) {
        lib.can2d.fillStyle = tile.color2;
      } else {
        lib.can2d.fillStyle = tile.color1;
      }
      let pixelX = pmod(i,4);
      if (flipX) pixelX = 3-pixelX;
      let pixelY = 3-fdiv(i,4);
      if (flipY) pixelY = 3-pixelY;
      lib.can2d.fillRect(x+pixelX/4,y+pixelY/4,1/4,1/4);
    }
  }
}

//generation funcs

function serp(x1, x2, a) {return (Math.sin((a-0.5)*Math.PI)/2+0.5)*(x2-x1)+x1}//{return a*(x2-x1)+x1}//
function serp2d(x1, x2, x3, x4, px, py) {return serp(serp(x1, x2, px), serp(x3, x4, px), py)}
function serp3d(x1, x2, x3, x4, x5, x6, x7, x8, px, py, pz) {return serp(serp2d(x1, x2, x3, x4, px, py), serp2d(x5, x6, x7, x8, px, py), pz)}

function perlinStep2d(x,y,seed,scale) {
  return serp2d(
    lib.hash(Math.floor(x/scale)*scale, Math.floor(y/scale)*scale, seed),
    lib.hash(Math.ceil(x/scale)*scale, Math.floor(y/scale)*scale, seed),
    lib.hash(Math.floor(x/scale)*scale, Math.ceil(y/scale)*scale, seed),
    lib.hash(Math.ceil(x/scale)*scale, Math.ceil(y/scale)*scale, seed),
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
    ff = lib.hash(Math.floor(x/scale)*scale, Math.floor(py/scale)*scale, seed);
    if (pmod(x,scale)==0) cf = ff; else cf = lib.hash(Math.ceil(x/scale)*scale, Math.floor(py/scale)*scale, seed);
    if (pmod(py,scale)==0) fc = ff; else fc = lib.hash(Math.floor(x/scale)*scale, Math.ceil(py/scale)*scale, seed);
    if (pmod(x,scale)==0) cc = fc; else cc = lib.hash(Math.ceil(x/scale)*scale, Math.ceil(py/scale)*scale, seed);
    for (let k=0; k<width; k++) {
      let px = x+k; // ==; <- hammer
      //*
      if (pmod(px,scale)<1) { //problem child
        ff=cf;
        fc=cc;
        cf=lib.hash(Math.ceil(px/scale)*scale+scale, Math.floor(py/scale)*scale, seed);
        if (pmod(py,scale)==0) cc = cf; else cc = lib.hash(Math.ceil(px/scale)*scale+scale, Math.ceil(py/scale)*scale, seed);
      }//*/
      //out[k+j*width] = ff;
      out[k+j*width] = serp2d(ff,cf,fc,cc,pmod(px,scale)/scale,pmod(py,scale)/scale);
    }
  }
  return out;
}

function perlinChunk2d(x, y, width, height, seed, startScale, endScale) {
  
}

export const tiles = [
  {color1: "#0000", color2: "#eee1", pattern:0x342, name: "air"},
  {color1: "#fff" ,color2: "#ddd", pattern:0x3c0, name: "aether"},
  {color1: "#8f0", color2: "#b60", pattern:0xfd80, name: "grass"},
  {color1: "#b60", color2: "#d82", pattern:0x4020, name: "dirt"},
  {color1: "#b52", color2: "#a41", pattern:0x2a8, name: "wood"},
  {color1: "#080", color2: "#0000", pattern:0x2942, name: "leaves"},
  {color1: "#48f8", color2: "#2488", pattern:0x60c, name: "water"},
];
