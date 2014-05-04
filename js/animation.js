var tileSize = 100;
var tileMargin = 4;
var fieldBorder = 8;

var fieldTileCount = 5;
var startTile = 2;
var animationSpeed = 150;

var tileElems = [];
var score = 0;
var gameOn = false;

$(function() {
   newGame();
    //bind events
    $('body').keypress(keyPressed);
    $('.new-game').click(newGame);
});

function keyPressed(e) {
    nextTurn(e.key);
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
    var tiles = emptyTileArray();
    for(var i = 0; i < tileElems.length; i++) {
        var elem = tileElems[i];
        var x = elem.data('x');
        var y = elem.data('y');

        //animate tile's shift
        elem.animate({
            left: calcPosX(x),
            top: calcPosY(y)
        }, animationSpeed);

        //push the tile to stack
        if(!tiles[x][y].elem)
            tiles[x][y].elem = [];
        tiles[x][y].elem.push(elem);
    }

    //process stacks
    for(x = 0; x < fieldTileCount; x++) {
        for(y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].elem && tiles[x][y].elem.length > 1) {
                var sum = 0;
                for(i = 0; i < tiles[x][y].elem.length; i++) {
                    elem = tiles[x][y].elem[i];
                    sum += elem.data('val');

                    //remove tile
                    elem.fadeOut(animationSpeed, function(){
                        $(this).remove();
                    });
                }
                //create new tile with sum
                var sumTile = tileShowUp(x, y, sum);

                //choose color for new tile
                for(i = 2; i <= 256; i *= 2) {
                    if(sum < i) {
                        i /= 2;
                        break;
                    }
                }
                sumTile.addClass('tile-' + i);

                tiles[x][y].elem = [sumTile];
            }
        }
    }

    //rebuild tiles array
    var newTiles = [];
    for(x = 0; x < fieldTileCount; x++) {
        for(y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].elem && tiles[x][y].elem.length > 0) {
                newTiles.push(tiles[x][y].elem[0]);
            }
        }
    }
    tileElems = newTiles;

    //push new tile
    newTile();

    //check for end of game
    if(!hasNextMove()) {
        gameOn = false;
        endGame();
    }
}

function tileShowUp(tileX, tileY, value) {
    var newTile = constructTile(tileX, tileY, value);
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

function constructTile(tileX, tileY, value) {
    return $('<div></div>')
        .addClass('tile')
        .addClass('tile-new')
        .css({
            left: calcPosX(tileX) + tileSize/4,
            top: calcPosY(tileY) + tileSize/4,
            width: tileSize / 2,
            height: tileSize / 2,
            opacity: 0})
        .data('x', tileX)
        .data('y', tileY)
        .data('val', value)
        .text(value);
}

function newTile() {
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
    return tileShowUp(freeTiles[tileId].x, freeTiles[tileId].y, startTile);
}

function newGame() {
    $('.tile-container').children().remove();
    tileElems = [];
    score = 0;
    gameOn = true;

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
            if(tiles[x][y].value != 0) {
                //find limit
                var limit = -1;
                for(var endY = y-1; endY >= 0;  endY--) {
                    if(tiles[x][endY].value != 0) {
                        limit = endY;
                        break;
                    }
                }

                //push up
                if(limit >= 0 && (tiles[x][limit].value != tiles[x][y].value || tiles[x][limit].merged)) //cannot merge?
                    limit++;
                if(limit == -1)
                    limit = 0;
                if(limit == y)
                    continue;

                if(tiles[x][limit].value) {
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
    if(value == 0) return;
    score += value;
    $('.score-value').text(score);
}

function hasNextMove() {
    var tiles = mapTiles();
    var has2048 = false;
    var hasEmpty = false;
    var hasMove = false;

    for(var x = 0; x < fieldTileCount; x++) {
        for(var y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].value == 0) {
                hasEmpty = true;
            }
            if(tiles[x][y].value == 2048) {
                has2048 = true;
            }
            if(x+1 < fieldTileCount && tiles[x][y].value != 0) {
                if(tiles[x][y].value == tiles[x+1][y].value) {
                    hasMove = true;
                }
            }
            if(y+1 < fieldTileCount && tiles[x][y].value != 0) {
                if(tiles[x][y].value == tiles[x][y+1].value) {
                    hasMove = true;
                }
            }
        }
    }
    if(has2048) return false; //win
    return hasEmpty || hasMove;
}

function endGame() {
    //win?
    var tiles = mapTiles();
    var has2048 = false;
    for(var x = 0; x < fieldTileCount; x++) {
        for(var y = 0; y < fieldTileCount; y++) {
            if(tiles[x][y].value == 2048) {
                has2048 = true;
            }
        }
    }

    var message = $('<span></span>').addClass('end-game-message').text('Game over');
    if(has2048) {
        message.addClass('win-message').text('You win!');
    }

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
    for(var i = 0; i < 5; i++) {
        tiles.push([]);
        for(var j = 0; j < 5; j++) {
            tiles[i].push({value: 0, elem: null});
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
            elem: tileElems[i]
        };
    }
    return tiles;
}
