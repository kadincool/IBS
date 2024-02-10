import {drawTile, getTile} from "./terrain.js";

export var posX = 0;
export var posY = 0;
var crouched = false;
var right = false;

var keys = {};
var inputs = {};
var bindings = {
  up: ["KeyW"],
  down: ["KeyS"],
  right: ["KeyD"],
  left: ["KeyA"],
}

export var inventory = new Array(8).fill(0);

export function drawPlayer() {
  let head = {color1: "#f00", color2: "#0000", pattern: 0xcc00}
  let body = {color1: "#39f", color2: "#0000", pattern: 0x0013}

  drawTile(body, posX-1, posY+1, false, false);
  drawTile(body, posX, posY+1, true, false);
  drawTile(body, posX-1, posY, false, true);
  drawTile(body, posX, posY, true, true);

  let headX = posX;
  let headY = posY;
  if (crouched) {
    if (right) {
      headX-=2;
    } else {
      headX+=2;
    }
  } else {
    headY+=2;
  }
  
  drawTile(head, headX-1, headY+1, false, false);
  drawTile(head, headX, headY+1, true, false);
  drawTile(head, headX-1, headY, false, true);
  drawTile(head, headX, headY, true, true);
}

export function movePlayer() {
  updateInputs();
}

document.addEventListener("keydown", (e) => {keys[e.code] = true});
document.addEventListener("keyup", (e) => {keys[e.code] = false});
function updateInputs() {
  for (let i in inputs) inputs[i] = false;
  for (let i in keys) if (keys[i]) for (let j in bindings) if (bindings[j].includes(i)) inputs[j]=true;
}