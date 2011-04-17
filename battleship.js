
$(document).ready(function() {

  var BOARD_SIZE = 360;
  var NUM_SQUARES = 10;
  var SQUARE_SIZE = BOARD_SIZE / NUM_SQUARES;
  var PEG_SIZE = SQUARE_SIZE / 5;
  
  var SHIP_SIZES = [5, 4, 3, 3, 2];
  var SHIP_WIDTH = SQUARE_SIZE / 2;

  var placingShips = true;

  // If on a touchscreen device use the touchstart event instead of click
  var gfxClickEvent = ('ontouchstart' in document.documentElement ? 'touchstart' : 'click');

  var paper = Raphael($('#game').get(0), 1000, 400);
  
  var board1 = drawBoard(20, 20, NUM_SQUARES, NUM_SQUARES);  
  var board2 = drawBoard(410, 20, NUM_SQUARES, NUM_SQUARES);
  var scoreBoard = drawBoard(800, 20, 1, SHIP_SIZES.length, false);
  
  var ships = drawShips(board1, 800, 40 + SQUARE_SIZE );
  
  // Stop clicking in the game from selecting text in the page
  $('#game').mousedown(function() {
    return false;
  });
  
  // Hack to fix the iPad's broken label/input association
  $('#state-selector label').bind('click', function() {
    $(this).children('input').attr('selected', true);
  });
  
  $('#state-selector input[value="ships"]').attr('checked', true);
  
  $('#state-selector input').change(function() {
    placingShips = ($(this).val() == 'ships');
    $.each(ships, function() {
      $(this.node).css('pointer-events', (placingShips ? 'auto' : 'none'));
    });
    
    var cursor = placingShips ? 'move' : 'crosshair';
    $.each(ships, function() {
      this.node.style.cursor = (!this.node.onBoard && cursor == 'crosshair') ? 'default' : cursor;
    });
    
    cursor = placingShips ? 'default' : 'crosshair';
    $.each([board1, board2, scoreBoard], function() {
      $.each(this.squares, function() {
        this.node.style.cursor = cursor;
        this.peg.node.style.cursor = cursor;  
      });
    });
  });
  
  function drawBoard(offsetX, offsetY, numRows, numCols, drawLetters) {
    var board = paper.rect(offsetX, offsetY, numCols * SQUARE_SIZE, numRows * SQUARE_SIZE).attr({fill: 'black'});
    
    board.squares = [];
    
    drawLetters = (typeof drawLetters != 'undefined' ? drawLetters : true);

    var y = offsetY;
    
    for (var i = 0; i < numRows; i++) {
      drawRow(y);
      y += SQUARE_SIZE;
    }
    
    function drawRow(y) {
      var x = offsetX;
      for (var i = 0; i < numCols; i++) {
        (function() {
          var square = paper.rect(x, y, SQUARE_SIZE, SQUARE_SIZE).attr('fill', '#1e90ff');
          
          var pegOffset = SQUARE_SIZE / 2;
          var pegX = square.attr('x') + pegOffset;
          var pegY = square.attr('y') + pegOffset;
          
          var peg = paper.circle(pegX, pegY, PEG_SIZE).attr('fill', 'red');
          peg.hide();
          peg.visible = false;
          
          function togglePeg() {
            if (placingShips) {
              return;
            }
            if (!peg.visible) {
              peg.attr('fill', 'white');
              peg.show();
              peg.toFront();
              peg.visible = true;
            } else if (peg.attr('fill') == 'white') {
              peg.attr('fill', 'red');
            } else if (peg.attr('fill') == 'red') {
              peg.hide();
              peg.visible = false;
            }
          }
          
          square.peg = peg;
        
          $(peg.node).bind(gfxClickEvent, togglePeg);
          $(square.node).bind(gfxClickEvent, togglePeg);
          
          board.squares.push(square);          
        })();
        x += SQUARE_SIZE;
      }
    }
    
    if (drawLetters) {
      for (var i = 1, x = offsetX; i <= numCols; i++) {
        paper.text(x + (SQUARE_SIZE / 2), offsetY - 10, i);
        x += SQUARE_SIZE;
      }
      
      var baseCharCode = "A".charCodeAt(0);
      for (var i = 1, y = offsetY; i <= numRows; i++) {
        paper.text(offsetX - 10, y + (SQUARE_SIZE / 2), String.fromCharCode(baseCharCode++));
        y += SQUARE_SIZE;
      }
    }

    return board;
  }
  
  function drawShips(board, offsetX, offsetY) {
  
    var snapTargetsX = [];
    var snapTargetsY = [];
    for (var i = 0; i < NUM_SQUARES; i++) {
      snapTargetsX.push(board.attr('x') + SQUARE_SIZE * i + SQUARE_SIZE / 4);
      snapTargetsY.push(board.attr('y') + SQUARE_SIZE * i + SQUARE_SIZE / 4);
    }
  
    return $.map(SHIP_SIZES, function(size) {
      var length = size * SQUARE_SIZE - SHIP_WIDTH;
      
      var ship = paper.rect(offsetX, offsetY, length, SHIP_WIDTH).attr('fill', 'grey');
    
      var rotatedTargetsX = $.map(snapTargetsX, function(target) {
        return target - length / 2 + SHIP_WIDTH / 2;
      });
      
      var rotatedTargetsY = $.map(snapTargetsY, function(target) {
        return target - length / 2 + SHIP_WIDTH / 2;
      });
    
      ship.node.style.cursor = 'move';
    
      var rotated = false;
      var dblClick = false;
      var timeoutId = null;
      
      $(ship.node).bind(gfxClickEvent, function(event) {
        if (!placingShips) {
          ship.hide();
          var target = document.elementFromPoint(event.clientX, event.clientY);
          ship.show();
          $(target).trigger(gfxClickEvent);
          return;
        }
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() { dblClick = false; }, 300);
        if (dblClick) {
          ship.rotate(90);
          rotated = !rotated;
          ship.attr({
            x: snapX(ship.attr('x')),
            y: snapY(ship.attr('y'))
          });
          dblClick = false;
        } else {
          dblClick = true;
        }
      });
      
      var snapX = function(x) {
        var targets = rotated ? rotatedTargetsX : snapTargetsX;
        return Raphael.snapTo(targets, x, SQUARE_SIZE / 2);
     };
     
     var snapY = function(y) {
      var targets = rotated ? rotatedTargetsY : snapTargetsY;
      return Raphael.snapTo(targets, y, SQUARE_SIZE / 2);
     };
      
      var start = function() {
        if (!placingShips) {
          return;
        }
        this.ox = this.attr("x");
        this.oy = this.attr("y");
        this.attr({opacity: 0.8});
      };
      var move = function(dx, dy) {
        if (!placingShips) {
          return;
        }
        this.attr({x: this.ox + dx, y: this.oy + dy});
      };
      var up = function() {
        if (!placingShips) {
          return;
        }
        var boardX = board.attr('x');
        var boardY = board.attr('y');
        var boardWidth = board.attr('width');
        var boardHeight = board.attr('height');
        
        var x = snapX(this.attr('x'));
        var y = snapY(this.attr('y'));
        
        var xPrime = rotated ? x + length / 2 - SHIP_WIDTH / 2 : x; 
        var yPrime = rotated ? y - length / 2 + SHIP_WIDTH / 2 : y;
        
        var width = rotated ? this.attr('height') : this.attr('width');
        var height = rotated ? this.attr('width') : this.attr('height');
        
        if (!(xPrime > boardX && 
              xPrime + width < boardX + boardWidth &&
              yPrime > boardY &&
              yPrime + height < boardY + boardHeight)) {
          this.attr({
            x: this.ox,
            y: this.oy
          });
          this.onBoard = true;
        } else {
          this.attr({
            x: x,
            y: y
          });
        }
        this.attr({opacity: 1});
      };
        
      ship.drag(move, start, up);
      
      offsetY += SQUARE_SIZE;
      
      return ship;
    });
  }
  
  function log() {
    if (typeof console != 'undefined' && console.log && console.log.apply) {
      console.log.apply(console, arguments);
    } else {
      // Hack because IE does not suport console.log.apply()
      var args = $.map(arguments, function(arg, i) {
        return 'arguments[' + i + ']';
      });
      eval('console.log(' + args.join(',') + ')');
    }
  }
  
});
