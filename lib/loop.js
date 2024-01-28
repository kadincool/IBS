function frame() {
  draw();
  requestAnimationFrame(frame);
}
frame();
