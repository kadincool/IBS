function frame() {
  update();
  draw();
  requestAnimationFrame(frame);
}
frame();
