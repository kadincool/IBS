import {drawTile, getTile, setTile} from "./terrain.js";
//idea: what if the player could split into 4 players for multiplayer
export var pos = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  crouched: false,
  left: false,
}

export var stats = {
  inventory: new Array(8).fill(0),
  currentInv: 0,
  jump: 0,
  maxJump: 3,
  hover: 0,
  maxHover: 4,
  fallen: 0,
  health: 8,
  maxHealth: 16,
  energy: 8,
  maxEnergy: 16,
  energyAdd: 1,
};

export var keys = {};
export var currentGamepad = null;
export var inputs = {};
export var bindings = {
  up: ["KeyW", "axis1-", "button12"],
  down: ["KeyS", "axis1+", "button13"],
  left: ["KeyA", "axis0-", "button14"],
  right: ["KeyD", "axis0+", "button15"],
  jump: ["Space", "button0", "button6"],
  crouch: ["ShiftLeft", "button2", "button7"],
  sup: ["ArrowUp", "axis3-"],
  sdown: ["ArrowDown", "axis3+"],
  sleft: ["ArrowLeft", "axis2-"],
  sright: ["ArrowRight", "axis2+"],
  sreset: ["KeyR", "button10"],
  grab: ["KeyF", "button1"],
  hbprev: ["KeyQ", "button4"],
  hbnext: ["KeyE", "button5"],
};

window.addEventListener("gamepadconnected", (e) => {if (currentGamepad == null) currentGamepad = e.gamepad.index});
window.addEventListener("gamepaddisconnected", (e) => {if (currentGamepad == e.gamepad.index) currentGamepad = null});

export function resetPlayer() {
  pos.x = 0;
  pos.y = 0;
  if (!attemptMove(0, 0, pos.crouched, pos.left, false)) {
    for (let i = 0; i < 128; i++) {
      pos.y+=1;
      if (attemptMove(0, 0, pos.crouched, pos.left, false)) break;
    }
  }
  if (attemptMove(0, -1, pos.crouched, pos.left, false)) {
    for (let i = 0; i < 128; i++) {
      pos.y-=1;
      if (!attemptMove(0, -1, pos.crouched, pos.left, false)) break;
    }
  }
  //while (attemptMove(0, -1)) {}
}
resetPlayer();

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

export function movePlayer() { //this whole system has many flaws but frick it, we ball
  updateInputs();

  let sideMove = false;
  let climbMove = false;
  //left-right
  let xAdd = inputs.right - inputs.left;
  //climbing
  if (inputs.jump && stats.energy >= 1) { 
    if (xAdd && !inputs.down && !attemptMove(xAdd, 0, pos.crouched, pos.left, false) && !climbMove) { //moving to the side (climbing wall)
      if (attemptMove(0, 1)) {
        climbMove = true;
        stats.energy-=1;
      } else if (inputs.up && !sideMove && attemptMove(-xAdd, 1)) {
        climbMove = true;
        sideMove = true;
        stats.energy-=1;
      } else if (inputs.down && !sideMove && attemptMove(xAdd, -1)) {
        climbMove = true;
        sideMove = true;
        //stats.energy-=1;
      } else {
        climbMove = true;
        stats.energy-=1;
      }
      if (stats.jump > 0) stats.jump-=1;
    } else if (!climbMove && !attemptMove(0, 1, pos.crouched, pos.left, false)) { //inputs.up && 
      if (xAdd && inputs.up && !sideMove && attemptMove(xAdd, 1)) {
        sideMove = true;
        stats.energy-=1;
      } else if (xAdd && inputs.down && !sideMove && !attemptMove(xAdd, 0, stats.crouched, stats.left, false) && attemptMove(xAdd, -1)) {
        sideMove = true;
      } else {
        stats.energy-=1;
      }
      climbMove = true;
      if (stats.jump > 0) stats.jump-=1;
    }
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
  if (xAdd && pos.left != inputs.left) { //inputs.right ^ inputs.left
    if (pos.crouched && attemptMove(0, 0, false, inputs.left, false)) {
      if (attemptMove(0, 0, true, inputs.left) || attemptMove(-xAdd, 0, true, inputs.left) || attemptMove(-2 * xAdd, 0, true, inputs.left)) sideMove = true;
    } else if (!pos.crouched) {
      attemptMove(0, 0, false, inputs.left);
    }
  }
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
  if (!inputs.crouch && pos.crouched && !attemptMove(0, 0, false)) {
    if (attemptMove(0, -1, false) || attemptMove(0, -2, false)) climbMove = true; // down
    else if (attemptMove((pos.left ? -1 : 1), 0, false) || attemptMove((pos.left ? -2 : 2), 0, false)) sideMove = true; // side
    else if (attemptMove((pos.left ? -1 : 1), -1, false) || attemptMove((pos.left ? -1 : 1), -2, false) || attemptMove((pos.left ? -2 : 2), -1, false) || attemptMove((pos.left ? -2 : 2), -2, false)) sideMove = true; // side & down
  }
  //reset if on floor
  if (!attemptMove(0, -1, pos.crouched, pos.left, false)) {
    if (stats.jump < stats.maxJump) stats.jump = stats.maxJump;
    if (stats.hover < stats.maxHover) stats.hover = stats.maxHover;
    //if (stats.energy < stats.maxEnergy) stats.energy += 1;
    stats.energy = Math.min(stats.energy + stats.energyAdd, stats.maxEnergy)
    stats.fallen = 0;

  }
  pos.targetX += inputs.sright - inputs.sleft;
  pos.targetY += inputs.sup - inputs.sdown;
  if (inputs.sreset) {
    pos.targetX = 0;
    pos.targetY = 0;
  }
  pos.targetX = lib.clamp(pos.targetX, -6, 5);
  pos.targetY = lib.clamp(pos.targetY, -5, 8);
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
      if (getTile(rangeX+i,posY+j)!=0) {
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
function testBinding(input) {
  for (let i in bindings) {
    if (bindings[i].includes(input)) {
      inputs[i]=true;
    }
  }
}

export function updateInputs() {
  for (let i in bindings) {
    inputs[i] = false;
  }
  for (let i in keys) {
    if (keys[i]) {
      testBinding(i);
    }
  }
  if (currentGamepad != null) {
    let gamepad = navigator.getGamepads()[currentGamepad];
    for (let i = 0; i < gamepad.buttons.length; i++) {
      if (gamepad.buttons[i].value > 0.3) {
        testBinding("button"+i);
      }
    }
    for (let i = 0; i < gamepad.axes.length; i++) {
      if (gamepad.axes[i] > 0.3) {
        testBinding("axis"+i+"+");
      } else if (gamepad.axes[i] < -0.3) {
        testBinding("axis"+i+"-");
      }
    }
  }
}