
const canvas = document.getElementById("gamecanvas");
const can2d = canvas.getContext("2d");

var camera = {x: 0, y: 0}

function draw() {
  let scale = 32;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  can2d.fillStyle = "#4bf";//"hsl("+Date.now()/100+", 100%, 50%)";
  can2d.globalAlpha = 1;
  //camera.x += 1
  can2d.fillRect(0, 0, canvas.width, canvas.height);
  let tcam = {x: camera.x-fdiv(canvas.width, 2*scale), y: camera.y-fdiv(canvas.height, 2*scale)}
  can2d.scale(scale,-scale)
  can2d.translate(-tcam.x, -tcam.y-(canvas.height/scale));
  //*
  for (let i=fdiv(tcam.x, 8); i<canvas.width/(scale*8)+tcam.x/8; i++) {
    for (let j=fdiv(tcam.y, 8); j<canvas.height/(scale*8)+tcam.y/8; j++) {
      drawChunk(chunks[getChunk(i, j)], i*8, j*8);
    }
  }//*/
  drawPlayer(0,0);
  /*
  let size = 32;
  let time = fdiv(Date.now(), 100)/10//Date.now()/100
  let step = perlinChunkStep2d(time,0,size,size,0,4);
  //console.log("draw")
  //console.log(step);
  for (let i=0; i<size**2; i++) {
    can2d.fillStyle = "red"
    //can2d.fillText(time%4,0,0);
    can2d.fillStyle = "hsl(0,0%,"+(step[i]*100)+"%)"
    can2d.fillRect(pmod(i,size)*8,fdiv(i,size)*8,8,8);
    can2d.fillStyle = "red"
    can2d.fillStyle = "hsl(0,0%,"+(perlinStep2d(pmod(i, size)+time, fdiv(i, size), 0, 4)*100)+"%)"
    can2d.fillRect(pmod(i,size)*8-size*8,fdiv(i,size)*8-size*8,8,8);
  }//*/
  /*
  can2d.fillStyle = "white";
  let seed = Date.now()
  for (let i=0; i<canvas.width; i+=scale) {
    for (let j=0; j<canvas.height; j+=scale) {
      //*
      let red = perlin2d(i,j,0,2,8)*256;
      let green = perlin2d(i,j,1,2,8)*256;
      let blue = perlin2d(i,j,2,2,8)*256;
      //let color = perlin2d(i,j,0,1,6)*256;
      can2d.fillStyle = "rgb("+red+", "+green+", "+blue+")";//*
      //can2d.globalAlpha = serp2d(0,1,1,0,i/(canvas.width/scale),j/(canvas.height/scale))
      //can2d.globalAlpha = perlin2d(i,j,0,1,5)
      //can2d.globalAlpha = 0.5
      can2d.fillRect(i, j, scale, scale);
    }
  }//*/
  //drawTile(tiles[1],0,0,scale)
}

function drawChunk(data, x, y) {
  for (let i=0; i<data.length; i++) {
    //can2d.fillStyle = tiles[data[i]].color1;
    //can2d.fillRect(x+pmod(i,8)*scale, y+fdiv(i,8)*scale, scale, scale);
    drawTile(tiles[data[i]],x+pmod(i,8), y+fdiv(i,8))
  }
}

function drawTile(tile, x, y) {
  //scale/=4;
  for (let i=0; i<16; i++) {
    if (getBit(tile.pattern, i)) {
      can2d.fillStyle = tile.color2;
    } else {
      can2d.fillStyle = tile.color1;
    }
    can2d.fillRect(x+pmod(i,4)/4,y+(4-fdiv(i,4))/4,1/4,1/4);
  }
}

function drawPlayer(x,y) {
  drawTile({"color1":"#f00","color2":"#0000","pattern":"0xcc00","name":"ph0"},x-1,y+3);
  drawTile({"color1":"#f00","color2":"#0000","pattern":"0x3300","name":"ph1"},x,y+3);
  drawTile({"color1":"#f00","color2":"#0000","pattern":"0xcc","name":"ph2"},x-1,y+2);
  drawTile({"color1":"#f00","color2":"#0000","pattern":"0x33","name":"ph3"},x,y+2);
  drawTile({"color1":"#08f","color2":"#0000","pattern":"0x13","name":"pb0"},x-1,y+1);
  drawTile({"color1":"#08f","color2":"#0000","pattern":"0x8c","name":"pb1"},x,y+1);
  drawTile({"color1":"#08f","color2":"#0000","pattern":"0x3100","name":"pb2"},x-1,y);
  drawTile({"color1":"#08f","color2":"#0000","pattern":"0xc800","name":"pb3"},x,y);
}