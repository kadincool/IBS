export function pmod(a,b) {return (a%b+b)%b}
export function fdiv(a,b) {return Math.floor(a/b)}

export const canvas = document.getElementById("gamecanvas");
export const can2d = canvas.getContext("2d");

export var graphics = {
  mono: false,
  scale: 32,
}

function halfHash(value) {
  return pmod(Math.sin(value) * 1024, 1);
}

export function hash() {
  //return pmod((arguments[0]+arguments[1])/10,1)
  //method by my friend Thumbtack that I was too stubborn to use in my first version
  //console.log(arguments);
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
