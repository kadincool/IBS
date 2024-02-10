import {drawTile, getTile} from "./terrain.js";

export var pos = {
  x: 0,
  y: 0,
  crouched: false,
  right: false,
}

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

  drawTile(body, pos.x-1, pos.y+1, false, false);
  drawTile(body, pos.x, pos.y+1, true, false);
  drawTile(body, pos.x-1, pos.y, false, true);
  drawTile(body, pos.x, pos.y, true, true);

  let headX = pos.x;
  let headY = pos.y;
  if (pos.crouched) {
    if (pos.right) {
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
  attemptMove(pos.x, pos.y-1, pos.crouched, pos.right);
}

function attemptMove(posX, posY, crouched, right) {
  let rangeX = posX-1;
  let rangeY = posY-3;
  let rangeWidth = 2;
  let rangeHeight = 4;
  if (crouched) {
    if (right) {
      rangeX = posX-3;
    }
    rangeY = posY-1;
    rangeWidth = 4;
    rangeHeight = 2;
  }
  //test range
  let canMove = true;
  for (let i=0; i<rangeWidth; i++) {
    for (let j=0; j<rangeHeight; j++) {
      if (getTile(posX+i,posY+j).name!="air") {
        canMove=false;
        break;
      }
    }
    if (!canMove) break;
  }
  console.log(canMove)
  if (canMove) {
    pos.x = posX;
    pos.y = posY;
    pos.crouched = crouched;
    pos.right = right;
  }
}

document.addEventListener("keydown", (e) => {keys[e.code] = true});
document.addEventListener("keyup", (e) => {keys[e.code] = false});
function updateInputs() {
  for (let i in inputs) inputs[i] = false;
  for (let i in keys) if (keys[i]) for (let j in bindings) if (bindings[j].includes(i)) inputs[j]=true;
}