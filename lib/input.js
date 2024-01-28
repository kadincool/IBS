input = {
  bindings: {
    up: ["KeyW"],
    down: ["KeyS"],
    left: ["KeyA"],
    right: ["keyD"],
    jump: ["Space"],
    crouch: ["ShiftLeft"],
  },
  keys: {},
  update: function() {
    for (let i in input.bindings) input[i]=false;
    for (let i in input.keys) if (input.keys[i]) for (let j in input.bindings) if (input.bindings[j].includes(i)) input[i] = true;
  }
}

function updateInputs() {
  for (i in input.bindings) input[i]=false;
}
/*function setInput(input, value) {
  for (i in input.bindings) {

  }
}*/

document.addEventListener("keydown", (event) => {
  input.keys[event.code] = true;
});
document.addEventListener("keyup", (event) => {
  input.keys[event.code] = false;
});
//document.addEventListener("mousedown", (event) => {console.log(event)});
//document.addEventListener("mouseup", (event) => {console.log(event)});
//document.addEventListener("mousemove", (event) => {console.log(event)});

/* 
  what does input need to achive?
  1. rebinds
  2. not mess with integer values
  3. multiple input modes
*/