
var debug = false;

var boardDim = 360;
var start = 20;
var squareSize = boardDim / 10;
var pegSize = 8;
var numSquares = 10;
var ships = [];
var shipSizes = [5, 4, 3, 3, 2];
var shipHeight = squareSize / 2;

var EMPTY = "rgb(30,144,255)";
var HIT = "rgb(255, 0, 0)";
var MISS = "rgb(255, 255, 255)";

var boards = [[], []];

var selectedShip = -1;

function width() {
  return squareSize * this.size - squareSize / 2;
}

function height() {
  return shipHeight;
}

function contains(x, y) {
  if (x >= this.x && x <= this.x + this.width() &&
      y >= this.y && y <= this.y + shipHeight) {
      
    return true;
  }
  return false;
}

function ship(size) {
  this.size = size;
  this.x = 0;
  this.y = 0;
  this.width = width;
  this.height = height;
  this.contains = contains;
  this.selectable = true;
}

for (var i = 0; i < shipSizes.length; i++) {
  var s = new ship(shipSizes[i]);
  ships.push(s);
}

function getSquare(x, y) {
  if ((x > boardDim + start && x < boardDim + start + start) || 
      x < start || y < start || 
      y > start + boardDim || x > boardDim * 2 + start * 2)
    return {column:-1, row:-1, board:-1};

  if (x >= boardDim + start)
    x -= start * 2;
  else
    x -= start;
  y -= start;
  
  var column = Math.floor(x / squareSize)
  var row = Math.floor(y / squareSize);
  var board = 0;
  
  if (column > 9) {
    board = 1;
    column = column - 10;
  }
  
  return {column:column, row:row, board:board};
}

function mouseCallback(event) {  
  // FIXME: does not work in Firefox
  var x = event.offsetX;
  var y = event.offsetY;
  var square = getSquare(x, y);
  
  if (debug) {
    var mouseCoords = document.getElementById('mouseCoords');
    var rowColumn = document.getElementById('rowColumn');
    mouseCoords.innerHTML = 'Coords: ' + x + ',' + y;
    rowColumn.innerHTML = 'Board: ' + square.board + ' Square: ' + square.column + ', ' + square.row;
  }
  
  for (var i = 0; i < ships.length; i++) {
    if (ships[i].selectable && ships[i].contains(x,y)) {
      if (debug)
        mouseCoords.innerHTML = 'Ship: ' + i + ' selected.';
      selectedShip = i;
      break;
    }
  }
  
  if (square.column < 0 || square.row < 0)
    return;
  
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var squareIndex = square.column * numSquares + square.row;

  if (selectedShip != -1) {
    var s = ships[selectedShip];
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(s.x, s.y, s.width(), s.height());
    selectedShip = -1;
    s.selectable = false;
    s.x = square.column * squareSize + start + squareSize / 4;
    s.y = square.row * squareSize + start + squareSize / 4;
    ctx.fillStyle = "rgb(112,138,144)";
    ctx.fillRect(s.x, s.y, s.width(), s.height());
  }
  else {
    var currentState = boards[square.board][squareIndex];
    var newState;
    
    if (currentState == EMPTY)
      newState = MISS;
    else if (currentState == MISS)
      newState = HIT;
    else
      newState = EMPTY;
    
    boards[square.board][squareIndex] = newState;
    drawPeg(ctx, square, newState);
  }
}

function drawPeg(ctx, square, pegColor) {
  ctx.fillStyle = pegColor;
  var x = square.column * squareSize + start + squareSize / 2 - pegSize / 2;
  var y = square.row * squareSize + start + squareSize / 2 - pegSize / 2;
  
  if (square.board == 1) {
    x += boardDim + start;
  }
  ctx.fillRect(x, y, pegSize, pegSize);
}

function draw() {
  var canvas = document.getElementById('game');
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    drawBoard(ctx);
  }
  
  for (var i = 0; i < numSquares * numSquares; i++) {
    boards[0][i] = EMPTY;
    boards[1][i] = EMPTY;
  }
  
  canvas.addEventListener('click', mouseCallback, false);
}

function drawBoard(ctx) {
  ctx.fillStyle = "rgb(30,144,255)";  
  ctx.fillRect(start, start, boardDim, boardDim);    
  ctx.fillRect(boardDim + (start * 2), start, boardDim, boardDim);
  drawGrid(ctx);  
  drawShips(ctx);
}

function drawGrid(ctx) {
  ctx.beginPath();
  var offset = boardDim + (start * 2);
  for (i = boardDim / 10; i < boardDim; i = i + boardDim / 10) {
    ctx.moveTo(i + start, start);
    ctx.lineTo(i + start, boardDim + start);
    ctx.moveTo(i + offset, start);
    ctx.lineTo(i + offset, boardDim + start);
  }
  for (i = boardDim / 10; i < boardDim; i = i + boardDim / 10) {
    ctx.moveTo(start, i + start);
    ctx.lineTo(boardDim + start, i + start);
    ctx.moveTo(offset, i + start);
    ctx.lineTo(boardDim + offset, i + start);
  }
  ctx.stroke();
  drawCharacters(ctx);
}

function drawCharacters(ctx) {
  ctx.fillStyle = "rgb(0,0,0)";
  var number = 1;
  for (i = boardDim / 10; i <= boardDim; i = i + boardDim / 10) {
    ctx.fillText(number, i - 3, 15);
    number++;
  }
  var number = 1;
  for (i = boardDim / 10; i <= boardDim; i = i + boardDim / 10) {
    ctx.fillText(number, boardDim + start + i - 3, 15);
    number++;
  }
  var letter = "A";
  for (i = boardDim / 10; i <= boardDim; i = i + boardDim / 10) {
    ctx.fillText(letter, 5, i + 3);
    letter = String.fromCharCode(letter.charCodeAt() + 1);
  }
  var letter = "A";
  for (i = boardDim / 10; i <= boardDim; i = i + boardDim / 10) {
    ctx.fillText(letter, 5 + (boardDim * 2) + (start * 2), i + 3);
    letter = String.fromCharCode(letter.charCodeAt() + 1);
  }
}

function drawShips(ctx) {
  ctx.fillStyle = "rgb(112,138,144)";
  
  for (var i = 0; i < ships.length; i++) {
    var x = boardDim * 2 + start * 3;
    var y = start + squareSize * i;
    ships[i].x = x;
    ships[i].y = y;
    ctx.fillRect(x, y, ships[i].width(), ships[i].height());
  }
}

