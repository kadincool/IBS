import {drawTile, getTile} from "./terrain.js";
//idea: what if the player could split into 4 players for multiplayer
export var pos = {
  x: 0,
  y: 0,
  lastX: 0,
  lastY: 0,
  crouched: false,
  right: false,
}

export var stats = {
  inventory: new Array(8).fill(0),
  jump: 3,
  hover: 4,
  fallen: 0,
};

var keys = {};
var inputs = {};
var bindings = {
  up: ["KeyW"],
  down: ["KeyS"],
  right: ["KeyD"],
  left: ["KeyA"],
  jump: ["Space"],
  crouch: ["ShiftLeft"],
};

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
  pos.lastX = pos.x; //maybe remove these if proove unnecessary
  pos.lastY = pos.y;

  let sideMove = false;
  let climbMove = false;

  let xAdd = inputs.right - inputs.left;
  if (xAdd && !sideMove && attemptMove(xAdd)) {
    sideMove = true;
  }
  if (xAdd && inputs.up && !sideMove && !climbMove && attemptMove(xAdd, 1)) {
    sideMove = true;
    climbMove = false;
  }
  if (!attemptMove(0, -1, pos.crouched, pos.right, false)) {
    stats.jump = 3;
    stats.hover = 4;
    stats.fallen = 0;
  }
  if (inputs.jump && stats.jump > 0 && !climbMove && attemptMove(0, 1)) {
    stats.jump-=1;
  } else if (inputs.jump && stats.hover > 0) {
    stats.hover-=1;
  } else if (!climbMove && attemptMove(0, -1)) {
    stats.fallen+=1;
    if (stats.jump > 0) stats.jump -= 1;
  }

  // if (inputs.right && !inputs.left && !sideMove && attemptMove(1)) sideMove = true;
  // if (inputs.left && !inputs.right && !sideMove && attemptMove(-1)) sideMove = true;
}

function attemptMove(deltaX=0, deltaY=0, crouched=pos.crouched, right=pos.right, move=true) {
  let posX = pos.x + deltaX;
  let posY = pos.y + deltaY;
  
  let rangeX = posX-1;
  let rangeWidth = 2;
  let rangeHeight = 4;
  if (crouched) {
    if (right) {
      rangeX = posX+3;
    }
    rangeWidth = 4;
    rangeHeight = 2;
  }
  //test range
  let canMove = true;
  //let canMove = Math.abs(posX-pos.lastX)<=2 && Math.abs(posY-pos.lastY)<=2;
  for (let i=0; i<rangeWidth; i++) {
    for (let j=0; j<rangeHeight; j++) {
      if (getTile(rangeX+i,posY+j).name!="air") {
        canMove=false;
        break;
      }
    }
    if (!canMove) break;
  }
  if (canMove && move) {
    pos.x = posX;
    pos.y = posY;
    pos.crouched = crouched;
    pos.right = right;
  }
  return canMove;
}

document.addEventListener("keydown", (e) => {keys[e.code] = true});
document.addEventListener("keyup", (e) => {keys[e.code] = false});
function updateInputs() {
  for (let i in bindings) inputs[i] = false;
  for (let i in keys) if (keys[i]) for (let j in bindings) if (bindings[j].includes(i)) inputs[j]=true;
}