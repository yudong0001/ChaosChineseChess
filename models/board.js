var EMPTY_NAME = '空';
var rowsCount = 5;
var columnsCount = 9;

var board = [];
var deadPieces = [];

/*var camper = {
    RED: 'red',
    BLACK: 'black',
    assignCamp: function (firstCamp, player1, player2) {
        if (firstCamp == this.RED) {
            player1.camp = firstCamp;
            player2.camp = this.BLACK;
        } else if (firstCamp == this.BLACK) {
            player1.camp = firstCamp;
            player2.camp = this.RED;
        }
    },
    getEnemy: function(allyCamp) {
        if (allyCamp == this.RED) {
            return this.BLACK;
        } else if (allyCamp == this.BLACK) {
            return this.RED;
        }
    }
}*/
var camper = require('./camper');

function Piece(name, camp, x, y, cbMoveTo) {
    this.name = name;
    this.camp = camp;
    this.x = x;
    this.y = y;
    this.hidden = true;
    this.canMoveTo = cbMoveTo;

    function replaceTarget(target, source) {
        target.name = source.name;
        target.camp = source.camp;
        target.canMoveTo = source.canMoveTo;

        source.name = EMPTY_NAME;
        source.camp = undefined;
        source.canMoveTo = undefined;
    }

    this.moveTo = function(anotherPiece) {
        if (anotherPiece.name == EMPTY_NAME) {
            replaceTarget(anotherPiece, this);
        }else {
            deadPieces.push(Piece(anotherPiece.name, anotherPiece.camp,
                anotherPiece.x, anotherPiece.y, anotherPiece.cbMoveTo));
            replaceTarget(anotherPiece, this);
        }
    };
}

function createEmptyPieceAt(x, y) {
    var p = new Piece(EMPTY_NAME, undefined, x, y, undefined);
    p.hidden = false;
    return p;
}

function randomInt(upLimit) {
    return Math.round(Math.random() * 100) % upLimit;
}

function isInStraightLine(p1, p2) {
    return (p1.x == p2.x && p1.y != p2.y) || (p1.x != p2.x && p1.y == p2.y);
}

function obstaclesCountOnStraightLine(p1, p2) {
    var count = 0;
    if (p1.x == p2.x && p1.y != p2.y) {
        var upLimit = p1.y;
        var lowLimit = p2.y;
        if (upLimit < lowLimit) {
            upLimit = p2.y;
            lowLimit = p1.y;
        }
        for (var i = lowLimit + 1; i < upLimit; i++) {
            if (board[i][p1.x].name != EMPTY_NAME) {
                count++;
            }
        }
    } else {
        var upLimit = p1.x;
        var lowLimit = p2.x;
        if (upLimit < lowLimit) {
            upLimit = p2.x;
            lowLimit = p1.x;
        }
        for (var i = lowLimit + 1; i < upLimit; i++) {
            if (board[p1.y][i].name != EMPTY_NAME) {
                count++;
            }
        }
    }
    return count;
}

var piecesDesc = {
    '车': {count:2, cbMoveTo:function(piece){
        return isInStraightLine(this, piece) && obstaclesCountOnStraightLine(this, piece) == 0;
     }},
    '马': {count:2, cbMoveTo:function(piece){
        var dx = Math.abs(this.x - piece.x);
        var dy = Math.abs(this.y - piece.y);
        return (dx == 1 && dy == 2 && board[(this.y + piece.y) / 2][this.x].name == EMPTY_NAME) ||
            (dx == 2 && dy == 1 && board[this.y][(this.x + piece.x) / 2].name == EMPTY_NAME);
    }},
    '相': {count:2, cbMoveTo:function(piece){
        return Math.abs(this.x - piece.x) == 2 && Math.abs(this.y - piece.y) == 2 &&
            board[(this.y + piece.y) / 2][(this.x + piece.x) / 2].name == EMPTY_NAME;
    }},
    '士': {count:2, cbMoveTo:function(piece){
        return Math.abs(this.x - piece.x) == 1 && Math.abs(this.y - piece.y) == 1;
    }},
    '炮': {count:2, cbMoveTo:function(piece){
        if (isInStraightLine(this, piece)) {
            var count = obstaclesCountOnStraightLine(this, piece);
            return (piece.camp == undefined && count == 0) || (piece.camp != undefined && count == 1);
        }
        return false;
    }},
    '将': {count:1, cbMoveTo:function(piece){
        var dx = Math.abs(this.x - piece.x);
        var dy = Math.abs(this.y - piece.y);
        return (dx == 1 && (dy == 1 || dy == 0)) || (dx == 0 && dy == 1);
    }},
    '兵': {count:5, cbMoveTo:function(piece){
        var dx = Math.abs(this.x - piece.x);
        var dy = Math.abs(this.y - piece.y);
        return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
    }}
};

var availablePieces = [];

function createPiece(camp, name, desc) {
    for (var i = 0; i < desc.count; i++) {
        availablePieces.push({camp: camp, name: name, cb: desc.cbMoveTo});
    }
}

function createPiecesFor(camp) {
    Object.keys(piecesDesc).forEach(function(o){
        createPiece(camp, o, piecesDesc[o]);
    });
}

/*createPiecesFor('red');
createPiecesFor('black');*/

function popAPieceTo(x, y) {
    if (availablePieces.length > 0) {
        var piece = undefined;
        if (availablePieces.length == 1) {
            piece = availablePieces[0];
        } else {
            piece = availablePieces.splice(randomInt(availablePieces.length), 1)[0];
        }
        return new Piece(piece.name, piece.camp, x, y, piece.cb);
    } else {
        return createEmptyPieceAt(x, y);
    }
}

var emptyColumn = Math.floor(columnsCount / 2);
var emptyRow = rowsCount - 1;
/*for (var i = 0; i < rowsCount; i++) {
    board.push([]);
    if (i == emptyRow) {
        for (var j = 0; j < columnsCount; j++) {
            board[i].push(createEmptyPieceAt(j, i));
        }
    } else {

        for (var j = 0; j < columnsCount; j++) {
            if (j == emptyColumn) {
                board[i].push(createEmptyPieceAt(j, i));
            } else {
                board[i].push(popAPieceTo(j, i));
            }
        }
    }
}*/

function Board(){
    console.log('start renew board.');//***********
    board = [];
    createPiecesFor('red');
    createPiecesFor('black');
    for (var i = 0; i < rowsCount; i++) {
        board.push([]);
        if (i == emptyRow) {
            for (var j = 0; j < columnsCount; j++) {
                board[i].push(createEmptyPieceAt(j, i));
            }
        } else {

            for (var j = 0; j < columnsCount; j++) {
                if (j == emptyColumn) {
                    board[i].push(createEmptyPieceAt(j, i));
                } else {
                    board[i].push(popAPieceTo(j, i));
                }
            }
        }
    }
    global.board = board;
    return {
        grids: board,
        columnsCount: columnsCount,
        rowsCount: rowsCount
    };
};

exports.Board = Board;
