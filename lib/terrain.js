let chunks = [];
let chunkIndex = [];

function genChunk(chunkX,chunkY) {
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

function getChunk(chunkX, chunkY) {
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

function getTile(tileX, tileY) {
  return chunks[getChunk(fdiv(tileX, 8), fdiv(tileY, 8))][pmod(tileX, 8) + pmod(tileY, 8) * 8];
}

function setTile(tileX, tileY, set) {
  chunks[getChunk(fdiv(tileX, 8), fdiv(tileY, 8))][pmod(tileX, 8) + pmod(tileY, 8) * 8] = set;
}

let tiles = [
  {"color1":"#0000","color2":"#eee1","pattern":"0x342","name":"air"},
  {"color1":"#fff","color2":"#ddd","pattern":"0x3c0","name":"aether"},
  {"color1":"#8f0","color2":"#b60","pattern":"0xfd80","name":"grass"},
  {"color1":"#b60","color2":"#d82","pattern":"0x4020","name":"dirt"},
  {"color1":"#b52","color2":"#a41","pattern":"0x2a8","name":"wood"},
  {"color1":"#080","color2":"#0000","pattern":"0x2942","name":"wood"},
  {"color1":"#48f8","color2":"#2488","pattern":"0x60c","name":"water"},
];
