var tileSize = 100;
var tileMargin = 4;
var fieldBorder = 8;

var fieldTileCount = 5;
var startTile = 2;
var animationSpeed = 150;
var obstaclesCount = 0;

var tileElems = [];
var score = 0;
var gameOn = false;

$(function() {
   newGame();
    //bind events
    $(document).keydown(keyPressed);
    $('.new-game').click(newGame);
    $('.tile-fixed').click(obstaclesSelect);
    bindTouchEvents();
});

function obstaclesSelect(e) {
    var elem = $(e.target);
    $('.tile-selected').removeClass('tile-selected');
    elem.addClass('tile-selected');

    obstaclesCount = elem.text();
    newGame();
}

function bindTouchEvents() {
    var touchEvents;
    if(window.navigator.msPointerEnabled) {
        touchEvents = {
            touchStart: 'MSPointerDown',
            touchMove: 'MSPointerMove',
            touchEnd: 'MSPointerUp'
        }
    } else {
        touchEvents = {
            touchStart: 'touchstart',
            touchMove: 'touchmove',
            touchEnd: 'touchend'
        }
    }

    var touchX, touchY;

    var gameGrid = document.getElementsByClassName('game-grid')[0];

    gameGrid.addEventListener(touchEvents.touchStart, function(e) {
        if ((!window.navigator.msPointerEnabled && e.touches.length > 1) || e.targetTouches > 1) {
            return;
        }
        if (window.navigator.msPointerEnabled) {
            touchX = e.pageX;
            touchY = e.pageY;
        } else {
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        }
        e.preventDefault();
    });

    gameGrid.addEventListener(touchEvents.touchMove, function(e) {
        e.preventDefault();
    });

    gameGrid.addEventListener(touchEvents.touchEnd, function(e) {
        if ((!window.navigator.msPointerEnabled && e.touches.length > 0) || e.targetTouches > 0) {
            return;
        }
        var touchEndX, touchEndY;
        if (window.navigator.msPointerEnabled) {
            touchEndX = e.pageX;
            touchEndY = e.pageY;
        } else {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
        }

        var dx = touchEndX - touchX;
        var dy = touchEndY - touchY;
        var absdx = Math.abs(dx);
        var absdy = Math.abs(dy);

        if(Math.max(absdx, absdy) > 10) {
            var direction;

            if(absdx > absdy) {
                if(dx > 0) {
                    direction = 'Right';
                } else {
                    direction = 'Left';
                }
            } else {
                if(dy > 0) {
                    direction = 'Down';
                } else {
                    direction = 'Up';
                }
            }

            nextTurn(direction);
        }
    });
}

function keyPressed(e) {
    var map = {
        38: 'Up',
        39: 'Right',
        40: 'Down',
        37: 'Left',
        75: 'Up',
        76: 'Right',
        74: 'Down',
        72: 'Left',
        87: 'Up',
        68: 'Right',
        83: 'Down',
        65: 'Left'
    };
    var mapped = map[e.which];
    if(mapped !== undefined) {
        e.preventDefault();
        nextTurn(map[e.keyCode]);
    }
}

function nextTurn(direction) {
    if(!gameOn) return ;

    var turn = false;
    switch(direction) {
        case 'Up':
            turn = shiftUp(0);
            break;
        case 'Left':
            turn = shiftUp(1);
            break;
        case 'Down':
            turn = shiftUp(2);
            break;
        case 'Right':
            turn = shiftUp(3);
            break;
    }

    if(!turn) return;

    //do animations and collect stacks of tiles
    var x, y, i, elem;
    var tiles = tileStacks();
    for(i = 0; i < tileElems.length; i++) {
        elem = tileElems[i];
        x = elem.data('x');
        y = elem.data('y');

        //animate tile's shift
        elem.animate({
            left: calcPosX(x),
            top: calcPosY(y)
        }, animationSpeed);

        //push the tile to the stack
        tiles[x][y].push(elem);
    }

    //process stacks
    var removeElement = function() { $(this).remove(); };
    for(x = 0; x < fieldTileCount; x++) {
        for(y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].length > 1) {
                var sum = 0;
                for(i = 0; i < tiles[x][y].length; i++) {
                    elem = tiles[x][y][i];
                    sum += elem.data('val');

                    //remove tile
                    elem.fadeOut(animationSpeed, removeElement());
                }
                //create new tile with sum
                var sumTile = tileShowUp(x, y, sum);
                sumTile.addClass(tileStyle(sum));
                tiles[x][y] = [sumTile];
            }
        }
    }

    //rebuild tiles array
    var newTiles = [];
    for(x = 0; x < fieldTileCount; x++) {
        for(y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].length > 0) {
                newTiles.push(tiles[x][y][0]);
            }
        }
    }
    tileElems = newTiles;

    //push new tile
    newTile();

    //check for end of the game
    var gameResult = hasNextMove();
    if(gameResult != 'continue') {
        gameOn = false;
        endGame(gameResult == 'win');
    }
}

function tileShowUp(tileX, tileY, value, obstacle) {
    var newTile = constructTile(tileX, tileY, value, obstacle);
    if(obstacle) {
        newTile.addClass('tile-obstacle');
    }
    $('.tile-container').append(newTile);
    tileElems.push(newTile);

    //animation
    var leftPos = calcPosX(tileX);
    var topPos = calcPosY(tileY);
    newTile.animate({
        opacity: 1,
        left: leftPos,
        top: topPos,
        width: tileSize,
        height: tileSize
    }, animationSpeed);

    return newTile;
}

function constructTile(tileX, tileY, value, obstacle) {
    return $('<div></div>')
        .addClass('tile')
        .addClass('tile-2')
        .css({
            left: calcPosX(tileX) + tileSize/4,
            top: calcPosY(tileY) + tileSize/4,
            width: tileSize / 2,
            height: tileSize / 2,
            opacity: 0})
        .data('x', tileX)
        .data('y', tileY)
        .data('val', value)
        .data('obstacle', obstacle ? obstacle : false)
        .text(obstacle ? '' : value);
}

function newTile(obstacle) {
    var tiles = mapTiles();

    //collect empty tiles
    var freeTiles = [];
    for(var x = 0; x < fieldTileCount; x++) {
        for(var y = 0 ; y < fieldTileCount; y++) {
            if(tiles[x][y].value === 0) {
                freeTiles.push({x: x, y: y});
            }
        }
    }
    var tileId = Math.floor(Math.random() * freeTiles.length);
    return tileShowUp(freeTiles[tileId].x, freeTiles[tileId].y, startTile, obstacle);
}

function newGame() {
    $('.tile-container').children().remove();
    tileElems = [];
    score = 0;
    $('.score-value').text(0);
    gameOn = true;

    //add obstacles
    for(var i = 0; i < obstaclesCount; i++) {
        newTile(true);
    }

    newTile();
    newTile();
}

//shift tiles
function shiftUp(rotations) {
    var turn = false;
    var scoreToAdd = 0;
    var tiles = mapTiles();

    //rotate tiles array (cw)
    for(var k = 0; k < rotations; k++) {
        var rot = [];
        for(var i = 0; i < fieldTileCount; i++) {
            rot.push([]);
            for(var j = 0; j < fieldTileCount; j++) {
                rot[i].push(tiles[j][fieldTileCount - i - 1]);
            }
        }
        tiles = rot;
    }

    for(var x = 0; x < fieldTileCount; x++) {
        for(var y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].value !== 0 && !tiles[x][y].obstacle) {
                //find limit
                var limit = -1;
                for(var endY = y-1; endY >= 0;  endY--) {
                    if(tiles[x][endY].value !== 0 || tiles[x][endY].obstacle) {
                        limit = endY;
                        break;
                    }
                }

                //check limit
                if(limit >= 0) {
                    //cannot merge?
                    if(tiles[x][limit].value != tiles[x][y].value || tiles[x][limit].merged || tiles[x][limit].obstacle)
                        limit++;
                }
                if(limit == -1)
                    limit = 0;
                if(limit == y)
                    continue;

                if(tiles[x][limit].value) { //merge
                    tiles[x][limit].merged = true;
                    scoreToAdd += tiles[x][limit].value * 2;
                }
                tiles[x][limit].value += tiles[x][y].value;
                tiles[x][y].value = 0;

                //new coordinates
                switch(rotations) {
                    case 0:  //up
                        tiles[x][y].elem.data('y', limit);
                        break;
                    case 1: //left
                        tiles[x][y].elem.data('x', limit);
                        break;
                    case 2: //down
                        tiles[x][y].elem.data('y', fieldTileCount - limit - 1);
                        break;
                    case 3: //right
                        tiles[x][y].elem.data('x', fieldTileCount - limit - 1);
                        break;
                }
                turn = true;
            }
        }
    }
    addScore(scoreToAdd);
    return turn;
}

function addScore(value) {
    if(value === 0) return;
    score += value;
    $('.score-value').text(score);
}

function hasNextMove() {
    var tiles = mapTiles();
    var has2048 = false;
    var hasMove = false;

    for(var x = 0; x < fieldTileCount; x++) {
        for(var y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].value == 2048) {
                has2048 = true;
            }

            if(tiles[x][y].value === 0 || tiles[x][y].obstacle) continue;

            var dx = [1, -1, 0, 0];
            var dy = [0, 0, 1, -1];
            for(var k = 0; k < 4; k++) {
                var nx = x + dx[k];
                var ny = y + dy[k];
                if(nx < 0 || ny < 0 || nx >= fieldTileCount || ny >= fieldTileCount) continue;
                if(tiles[nx][ny].obstacle) continue;
                if(tiles[nx][ny].value === 0 || tiles[nx][ny].value == tiles[x][y].value) {
                    hasMove = true;
                }
            }
        }
    }
    if(has2048) return 'win';
    return  hasMove ? 'continue' : 'full';
}

function endGame(win) {
    var message = $('<span></span>').addClass('end-game-message').text('Game over');
    if(win)
        message.addClass('win-message').text('You win!');
    $('<div></div>').addClass('end-game-screen').appendTo('.tile-container').append(message);
}

//utility

function calcPosX(tileX) {
    return tileX * tileSize + tileX * tileMargin + fieldBorder;
}

function calcPosY(tileY) {
    return tileY * tileSize + tileY * tileMargin + fieldBorder;
}

function emptyTileArray() {
    var tiles = [];
    for(var i = 0; i < fieldTileCount; i++) {
        tiles.push([]);
        for(var j = 0; j < fieldTileCount; j++) {
            tiles[i].push({value: 0, elem: null, obstacle: false});
        }
    }
    return tiles;
}

//put tiles values on two-dimensional array
function mapTiles() {
    var tiles = emptyTileArray();
    for(var i = 0; i < tileElems.length; i++) {
        var x = tileElems[i].data('x');
        var y = tileElems[i].data('y');
        tiles[x][y] = {
            value: tileElems[i].data('val'),
            elem: tileElems[i],
            obstacle: tileElems[i].data('obstacle')
        };
    }
    return tiles;
}

function tileStacks() {
    var tiles = [];
    for(var i = 0; i < fieldTileCount; i++) {
        tiles.push([]);
        for(var j = 0; j < fieldTileCount; j++) {
            tiles[i].push([]);
        }
    }
    return tiles;
}

function tileStyle(value) {
    for(var i = 2; i <= 256; i *= 2) {
        if(value < i) {
            i /= 2;
            break;
        }
    }
    return 'tile-' + i;
}
