export function pmod(a,b) {return (a%b+b)%b}
export function fdiv(a,b) {return Math.floor(a/b)}

export function clamp(x, min, max) {return Math.min(Math.max(x, min), max)}

export const canvas = document.getElementById("gamecanvas");
export const can2d = canvas.getContext("2d");

export var camera = {
  x: 0,
  y: 0,
}

export var graphics = {
  mono: false,
  scale: 24,
}

function halfHash(value) {
  return pmod(Math.sin(value) * 1024, 1);
}

export function hash() {
  //method by my friend Thumbtack that I was too stubborn to use in my first version
  let value = 0;
  for (let i=0; i<arguments.length; i++) value = halfHash(value + arguments[i]);
  return value;
}

export function getBit(value, bit) {
  return (value >> bit) % 2 == 1;
}

export function toggleBit(value, bit) {
  let set = 0b1 << bit;
  return value ^ set;
}

export function reverseString(string) {
  let reversed = "";
  for (let i = string.length-1; i>=0; i--) {
      reversed+=string[i];
  }
  return reversed;
}
