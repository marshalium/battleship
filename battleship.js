
var debug = true;

var boardDim = 360;
var start = 20;
var squareSize = boardDim / 10;
var pegSize = 8;
var numSquares = 10;
var shipSizes = [5, 4, 3, 3, 2];
var shipHeight = squareSize / 2;

var HIT_PEG_COLOR = "rgb(255,0,0)";
var MISS_PEG_COLOR = "rgb(255,255,255)";
var SHIP_COLOR = "rgb(112,138,144)";
var SHIP_SELECTED_COLOR = "rgb(56,69,72)";
var BACKGROUND_COLOR = "rgb(255,255,255)";
var TEXT_COLOR = "rgb(0,0,0)";
var BOARD_COLOR = "rgb(30,144,255)";

var HIT = HIT_PEG_COLOR;
var MISS = MISS_PEG_COLOR;
var EMPTY = BOARD_COLOR;

var boards = [[], []];
var ships = [];
var selectedShip = -1;
var canvas = null;
var ctx = null;

function ship(size) {
  this.size = size;
  this.x = 0;
  this.y = 0;
  this.selectable = true;
  this.width = function() { return squareSize * this.size - squareSize / 2; };
  this.height = function() { return shipHeight; };
  this.contains = function(x,y) {
                    if (x >= this.x && x <= this.x + this.width() &&
                        y >= this.y && y <= this.y + shipHeight)
                      return true; 
                    else 
                      return false;
                  };
}

function initGame() {
  canvas = document.getElementById('game');
  if (!canvas.getContext) {
    var errorMsg = document.createElement('p');
    errorMsg.innerHTML = 'The canvas tag is not supported by this browser. ' +
                         'Try <a href="http://www.google.com/chrome">Chrome</a>!';
    document.getElementById('content').insertBefore(errorMsg, canvas);
    return;
  }
  ctx = canvas.getContext('2d');
  
  for (var i = 0; i < numSquares * numSquares; i++) {
    boards[0][i] = EMPTY;
    boards[1][i] = EMPTY;
  }
  
  for (var i = 0; i < shipSizes.length; i++) {
    var s = new ship(shipSizes[i]);
    ships.push(s);
  }
  
  if (debug) {
    var element = document.createElement('p');
    element.setAttribute('id', 'mouseDebug');
    document.getElementById('footer').appendChild(element);
  }
  
  drawBoard();
  
  canvas.addEventListener('click', mouseCallback, false);
}

function drawBoard() {
  ctx.fillStyle = BOARD_COLOR;  
  ctx.fillRect(start, start, boardDim, boardDim);    
  ctx.fillRect(boardDim + (start * 2), start, boardDim, boardDim);
  drawGrid();  
  drawShips();
}

function drawGrid() {
  ctx.beginPath();
  var offset = boardDim + (start * 2);
  for (var i = boardDim / numSquares; i < boardDim; i += boardDim / numSquares) {
    ctx.moveTo(i + start, start);
    ctx.lineTo(i + start, boardDim + start);
    ctx.moveTo(i + offset, start);
    ctx.lineTo(i + offset, boardDim + start);
  }
  for (var i = boardDim / numSquares; i < boardDim; i += boardDim / numSquares) {
    ctx.moveTo(start, i + start);
    ctx.lineTo(boardDim + start, i + start);
    ctx.moveTo(offset, i + start);
    ctx.lineTo(boardDim + offset, i + start);
  }
  ctx.stroke();
  drawCharacters();
}

function drawCharacters() {
  ctx.fillStyle = TEXT_COLOR;
  drawNumbers(0);
  drawNumbers(boardDim + start);
  drawLetters(5);
  drawLetters(5 + boardDim * 2 + start * 2);
}

function drawNumbers(x) {
  var number = 1;
  for (var i = boardDim / numSquares; i <= boardDim; i += boardDim / numSquares) {
    ctx.fillText(number, i - 3 + x, 15);
    number++;
  }
}

function drawLetters(x) {
  var letter = "A";
  for (var i = boardDim / numSquares; i <= boardDim; i += boardDim / numSquares) {
    ctx.fillText(letter, x, i + 3);
    letter = String.fromCharCode(letter.charCodeAt() + 1);
  }
}

function drawShips() {
  ctx.fillStyle = SHIP_COLOR;
  var x = boardDim * 2 + start * 3;
  var y = start;
  for (var i = 0; i < ships.length; i++) {
    ships[i].x = x;
    ships[i].y = y;
    ctx.fillRect(x, y, ships[i].width(), ships[i].height());
    y += squareSize;
  }
}

function mouseCallback(event) {  
  // FIXME: does not work in Firefox
  var x = event.offsetX;
  var y = event.offsetY;
  var square = getSquare(x, y);
  
  if (debug) {
    var mouseDebug = document.getElementById('mouseDebug');
    mouseDebug.innerHTML = '';
    mouseDebug.innerHTML += 'Coords: ' + x + ',' + y + '<br />';
    mouseDebug.innerHTML += 'Board: ' + square.board + ' Square: ' + 
                            square.row + ', ' + square.column + '<br />';
  }
  
  for (var i = 0; i < ships.length; i++) {
    if (ships[i].selectable && ships[i].contains(x,y)) {
      if (debug)
        mouseDebug.innerHTML += 'Ship: ' + i + ' selected.<br />';
      if (i != selectedShip) {
        if (selectedShip != -1) {
          var s = ships[selectedShip];
          ctx.fillStyle = SHIP_COLOR;
          ctx.fillRect(s.x, s.y, s.width(), s.height());
        }
        selectedShip = i;
        var s = ships[selectedShip];
        ctx.fillStyle = SHIP_SELECTED_COLOR;
        ctx.fillRect(s.x, s.y, s.width(), s.height());
      }
      break;
    }
  }
  
  if (square.column < 0 || square.row < 0)
    return;
    
  var squareIndex = square.column * numSquares + square.row;

  if (selectedShip != -1) {
    var s = ships[selectedShip];
    if (square.column + s.size <= numSquares && square.board == 0) {
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(s.x, s.y, s.width(), s.height());
      selectedShip = -1;
      s.selectable = false;
      s.x = square.column * squareSize + start + squareSize / 4;
      s.y = square.row * squareSize + start + squareSize / 4;
      ctx.fillStyle = SHIP_COLOR;
      ctx.fillRect(s.x, s.y, s.width(), s.height());
    }
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
    drawPeg(square, newState);
  }
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

function drawPeg(square, pegColor) {
  ctx.fillStyle = pegColor;
  var pegOffset = squareSize / 2 - pegSize / 2;
  var x = square.column * squareSize + start + pegOffset;
  var y = square.row * squareSize + start + pegOffset;
  
  if (ctx.fillStyle == EMPTY) {
    var imageData = ctx.getImageData(x - 1, y - 1, 1, 1);
    var rgbValues = [];
    for (var i = 0; i < 3; i++)
      rgbValues[i] = imageData.data[i];
    var surroundingColor = 'rgb(' + rgbValues.join(',') + ')';
    
    ctx.fillStyle = surroundingColor;
  }
  
  if (square.board == 1)
    x += boardDim + start;
    
  ctx.fillRect(x, y, pegSize, pegSize);
}

