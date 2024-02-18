import * as terrain from "./terrain.js";
import {can2d, canvas, camera} from "./lib.js";
import * as lib from "./lib.js";
import * as player from "./player.js";

window.terrain = terrain;
window.lib = lib;
window.player = player;

var lastMove = Date.now();

export function update() {
  const frameTime = 100;
  while (Date.now()-lastMove>=frameTime) {
    player.movePlayer();
    camera.x = player.pos.x;
    camera.y = player.pos.y;
    lastMove+=frameTime;
  }
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
  can2d.translate(-camera.x, -camera.y)
  for (let i=Math.floor(-canvas.width/lib.graphics.scale/16+camera.x/8); i<Math.ceil(canvas.width/lib.graphics.scale/16+camera.x/8); i++) {
    for (let j=Math.floor(-canvas.height/lib.graphics.scale/16+camera.y/8); j<Math.ceil(canvas.height/lib.graphics.scale/16+camera.y/8); j++) {
      terrain.drawChunk(i,j,i*8,j*8);
    }
  }
  player.drawPlayer();
  terrain.drawTile({color1: "#0001", color2: "#fff", pattern: 0x9009}, player.pos.x + player.pos.targetX, player.pos.y + player.pos.targetY)
  can2d.fillStyle = "maroon";
  can2d.fillRect(camera.x-10, camera.y+10, Math.ceil(player.stats.maxHealth/4), 1);
  can2d.fillStyle = "red";
  can2d.fillRect(camera.x-10, camera.y+10, Math.ceil(player.stats.health/4), 1);
  can2d.fillStyle = "green";
  can2d.fillRect(camera.x-10, camera.y+9, Math.ceil(player.stats.maxEnergy/4), 1);
  can2d.fillStyle = "lime";
  can2d.fillRect(camera.x-10, camera.y+9, Math.ceil(player.stats.energy/4), 1);
  can2d.fillStyle = "black";
  can2d.fillRect(camera.x-10, camera.y+8, player.stats.inventory.length, 1);
  for (let i = 0; i < player.stats.inventory.length; i++) {
    terrain.drawTile(terrain.tiles[player.stats.inventory[i]],camera.x-10+i, camera.y+8);
  }
}