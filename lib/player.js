import {drawTile, getTile} from "./terrain.js";
//idea: what if the player could split into 4 players for multiplayer
export var pos = {
  x: 18,
  y: 10,
  crouched: false,
  left: false,
}

export var stats = {
  inventory: new Array(8).fill(0),
  jump: 0,
  maxJump: 3,
  hover: 0,
  maxHover: 4,
  fallen: 0,
  health: 8,
  maxHealth: 20,
  energy: 12,
  maxEnergy: 20,
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
    if (pos.left) {
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

  let sideMove = false;
  let climbMove = false;
  //left-right
  let xAdd = inputs.right - inputs.left;
  if (inputs.right ^ inputs.left && pos.left != inputs.left) { //todo: add more logic
    if (pos.crouched && attemptMove(0, 0, false, inputs.left, false)) {
      if (attemptMove(0, 0, true, inputs.left) || attemptMove(-xAdd, 0, true, inputs.left) || attemptMove(-2 * xAdd, 0, true, inputs.left)) sideMove = true;
    } else if (!pos.crouched) {
      attemptMove(0, 0, false, inputs.left);
    }
  }
  // if (inputs.right && !inputs.left && pos.left) { //todo: add more logic
  //   if (pos.crouched && attemptMove(0, 0, false, false, false)) attemptMove(0, 0, true, false);
  //   else if (!pos.crouched) pos.left = false; 
  // } else if (inputs.left && !inputs.right && !pos.left) {
  //   if (pos.crouched && attemptMove(0, 0, false, true, false)) attemptMove(0, 0, true, true);
  //   else if (!pos.crouched) pos.left = true; 
  // }
  if (xAdd && !sideMove && attemptMove(xAdd)) {
    sideMove = true;
  }
  //step
  if (xAdd && inputs.up && !sideMove && !climbMove && attemptMove(xAdd, 1)) {
    sideMove = true;
    climbMove = false;
  }
  //crouch
  if (inputs.crouch && !pos.crouched) {
    //sorta jank way of doing it but cant think of another way
    if (attemptMove(0, 0, true)) {} //regular
    else if (!climbMove && inputs.up && attemptMove(0, 1, true)) {climbMove = true} //push up
    else if (!climbMove && !sideMove && inputs.up && attemptMove((pos.left ? 1 : -1), 1, true)) {climbMove = true; sideMove = true} //push up and side
    else if (!climbMove && inputs.up && attemptMove(0, 2, true)) {climbMove = true}
    else if (!climbMove && !sideMove && inputs.up && attemptMove((pos.left ? 1 : -1), 2, true)) {climbMove = true; sideMove = true}
    else if (!sideMove && attemptMove((pos.left ? 1 : -1), 0, true)) {sideMove = true} //push back
    else if (!sideMove && attemptMove((pos.left ? 2 : -2), 0, true)) {sideMove = true}
  }
  if (!inputs.crouch && pos.crouched) attemptMove(0, 0, false); //todo: add more logic
  //reset if on floor
  if (!attemptMove(0, -1, pos.crouched, pos.left, false)) {
    if (stats.jump < stats.maxJump) stats.jump = stats.maxJump;
    if (stats.hover < stats.maxHover) stats.hover = stats.maxHover;
    stats.fallen = 0;
  }
  //jump arc
  if (inputs.jump && stats.jump > 0 && !climbMove && attemptMove(0, 1)) { //jump up
    stats.jump-=1;
  } else if (inputs.jump && stats.hover > 0) { // hover
    stats.hover-=1;
  } else if (!climbMove && attemptMove(0, -1)) { // fall/not trying
    stats.fallen+=1;
    if (stats.jump > 0) stats.jump -= 1;
  }

  // if (inputs.right && !inputs.left && !sideMove && attemptMove(1)) sideMove = true;
  // if (inputs.left && !inputs.right && !sideMove && attemptMove(-1)) sideMove = true;
}

function attemptMove(deltaX=0, deltaY=0, crouched=pos.crouched, left=pos.left, move=true) {
  let posX = pos.x + deltaX;
  let posY = pos.y + deltaY;
  
  let rangeX = posX-1;
  let rangeWidth = 2;
  let rangeHeight = 4;
  if (crouched) {
    if (left) {
      rangeX = posX-3;
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
    pos.left = left;
  }
  return canMove;
}

document.addEventListener("keydown", (e) => {keys[e.code] = true});
document.addEventListener("keyup", (e) => {keys[e.code] = false});
function updateInputs() {
  for (let i in bindings) inputs[i] = false;
  for (let i in keys) if (keys[i]) for (let j in bindings) if (bindings[j].includes(i)) inputs[j]=true;
}