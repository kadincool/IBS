import * as terrain from "./terrain.js";
import {can2d, canvas} from "./lib.js";
import * as lib from "./lib.js";
import * as player from "./player.js";

//const canvas = document.getElementById("gamecanvas");
//const can2d = canvas.getContext("2d");

export function update() {
  player.movePlayer();
  requestAnimationFrame(update);
  draw();
}

export async function draw() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  can2d.resetTransform();
  can2d.fillStyle = "#4bf";
  can2d.fillRect(0,0,canvas.width, canvas.height);
  can2d.translate(lib.fdiv(canvas.width,2), lib.fdiv(canvas.height,2));
  can2d.scale(lib.graphics.scale, -lib.graphics.scale);
  //console.log(terrain.tiles);
  //terrain.drawTile(terrain.tiles[6], 0, 0, can2d, false);
  for (let i=Math.floor(-canvas.width/lib.graphics.scale/8/2); i<Math.ceil(canvas.width/lib.graphics.scale/8/2); i++) {
    for (let j=Math.floor(-canvas.height/lib.graphics.scale/16); j<Math.ceil(canvas.height/lib.graphics.scale/16); j++) {
      terrain.drawChunk(i,j,i*8,j*8);
    }
  }
  player.drawPlayer();
  // terrain.drawChunk(0,0,0,0, can2d, false);
  //requestAnimationFrame(draw);
}