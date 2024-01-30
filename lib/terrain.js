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

export function drawChunk(data, x, y) {
  for (let i=0; i<data.length; i++) {
    //can2d.fillStyle = tiles[data[i]].color1;
    //can2d.fillRect(x+pmod(i,8)*scale, y+fdiv(i,8)*scale, scale, scale);
    drawTile(tiles[data[i]],x+pmod(i,8), y+fdiv(i,8))
  }
}

export function drawTile(tile, x, y) {
  //scale/=4;
  if (graphics.mono) {
    can2d.fillStyle = tile.color1;
    can2d.fillRect(x,y,1,1);
  } else {
    for (let i=0; i<16; i++) {
      if (getBit(tile.pattern, i)) {
        can2d.fillStyle = tile.color2;
      } else {
        can2d.fillStyle = tile.color1;
      }
      can2d.fillRect(x+pmod(i,4)/4,y+(fdiv(i,4))/4,1/4,1/4);
    }
  }
}

const tiles = [
  {"color1":"#0000","color2":"#eee1","pattern":"0x342","name":"air"},
  {"color1":"#fff","color2":"#ddd","pattern":"0x3c0","name":"aether"},
  {"color1":"#8f0","color2":"#b60","pattern":"0xfd80","name":"grass"},
  {"color1":"#b60","color2":"#d82","pattern":"0x4020","name":"dirt"},
  {"color1":"#b52","color2":"#a41","pattern":"0x2a8","name":"wood"},
  {"color1":"#080","color2":"#0000","pattern":"0x2942","name":"wood"},
  {"color1":"#48f8","color2":"#2488","pattern":"0x60c","name":"water"},
];
