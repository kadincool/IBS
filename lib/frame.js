import * as terrain from "./terrain.js";
import * as lib from "./lib.js";

const canvas = document.getElementById("gamecanvas");
const can2d = canvas.getContext("2d");

export function update() {

}

export function draw() {
  let graphics = {mono: false};
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  can2d.resetTransform();
  can2d.fillStyle = "red";
  can2d.fillRect(0,0,canvas.clientWidth, canvas.height);
  can2d.translate(lib.fdiv(canvas.width,2), lib.fdiv(canvas.height,2));
  can2d.scale(16,-16)
  console.log(terrain.tiles);
  terrain.drawTile(terrain.tiles[6], 0, 0, can2d, false);
}