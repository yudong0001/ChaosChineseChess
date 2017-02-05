global.board = [];

var EMPTY_NAME = '空';
var EMPTY_CAMP = 'GRAY';
var EMPTY_WEIGHT = 100;

var rowsCount = 5;
var columnsCount = 9;

var board = [];
var deadPieces = [];

var camper = require('./camper');

function Piece(name, fname, camp, weight,x, y, cbMoveTo) {
    this.name = name;
    this.fname = fname;
    this.camp = camp;
    this.weight = weight;
    this.x = x;
    this.y = y;
    this.canMoveTo = cbMoveTo;
    this.isCovered = false;
    this.hidden = true;

    function replaceTarget(target, source) {
        target.name = source.name;
        target.fname = source.fname;
        target.camp = source.camp;
        target.weight = source.weight;
        target.canMoveTo = source.canMoveTo;
        //target.canProtect = source.canProtect;

        source.name = EMPTY_NAME;
        source.fname = undefined;
        source.camp = undefined;
        source.weight = EMPTY_WEIGHT;
        source.canMoveTo = undefined;
        //source.canProtect = undefined;
    }

    this.moveTo = function(anotherPiece) {
        console.log('piece.moveTo:who is this? %o'+this.camp+this.name);//*******
        if (anotherPiece.name == EMPTY_NAME) {
            replaceTarget(anotherPiece, this);
        }else {
            deadPieces.push(Piece(anotherPiece.name, anotherPiece.fname, anotherPiece.camp, anotherPiece.weight,
                anotherPiece.x, anotherPiece.y, anotherPiece.cbMoveTo));
            replaceTarget(anotherPiece, this);
        }
    };
}//class 'piece'

function createEmptyPieceAt(x, y) {
    var p = new Piece(EMPTY_NAME, undefined, undefined, EMPTY_WEIGHT, x, y, undefined);
    p.hidden = false;
    return p;
}

function randomInt(upLimit) {
    return Math.round(Math.random() * 100) % upLimit;
}

function isInStraightLine(p1, p2) {
    return (p1.x == p2.x && p1.y != p2.y) || (p1.x != p2.x && p1.y == p2.y);
}

function obstaclesCountOnStraightLine(p1, p2, cboard) {
    var cboard = cboard;
    var count = 0;
    if (p1.x == p2.x && p1.y != p2.y) {
        var upLimit = p1.y;
        var lowLimit = p2.y;
        if (upLimit < lowLimit) {
            upLimit = p2.y;
            lowLimit = p1.y;
        }
        for (var i = lowLimit + 1; i < upLimit; i++) {
            if (cboard[i][p1.x].name != EMPTY_NAME) {
                //console.log('board.obstacles.cboard[i][p1.x]:%o',cboard[i][p1.x]);//*******
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
            if (cboard[p1.y][i].name != EMPTY_NAME) {
                //console.log('board.obstacles.cboard[p1.y][i]:%o',cboard[p1.y][i]);//*******
                count++;
            }
        }
    }
    return count;
}

var piecesDesc = {
    '车': {fname:'JU', count:2, weight:1, cbMoveTo:function(piece,cboard){
        return isInStraightLine(this, piece) && obstaclesCountOnStraightLine(this, piece, cboard) == 0;
     }},
    '马': {fname:'MA', count:2, weight:4, cbMoveTo:function(piece,cboard){
        var dx = Math.abs(this.x - piece.x);
        var dy = Math.abs(this.y - piece.y);
        var cboard =cboard;
        return (dx == 1 && dy == 2 && cboard[(this.y + piece.y) / 2][this.x].name == EMPTY_NAME) ||
            (dx == 2 && dy == 1 && cboard[this.y][(this.x + piece.x) / 2].name == EMPTY_NAME);
    }},
    '相': {fname:'XIANG', count:2, weight:7, cbMoveTo:function(piece, cboard){
        var cboard = cboard;
        return Math.abs(this.x - piece.x) == 2 && Math.abs(this.y - piece.y) == 2 &&
            cboard[(this.y + piece.y) / 2][(this.x + piece.x) / 2].name == EMPTY_NAME;
    }},
    '士': {fname:'SHI', count:2, weight:5, cbMoveTo:function(piece, cboard){
        return Math.abs(this.x - piece.x) == 1 && Math.abs(this.y - piece.y) == 1;
    }},
    '炮': {fname:'PAO', count:2, weight:3, cbMoveTo:function(piece, cboard){
        var cboard = cboard;
        if (isInStraightLine(this, piece)) {
            var count = obstaclesCountOnStraightLine(this, piece, cboard);
            //console.log('count for piece"Cannon":obstaclesCountOnStraightLine(this, piece):'+count);//*******
            return (piece.camp == undefined && count == 0) || (piece.camp != undefined && count == 1);
        }
        return false;
    }},
    '将': {fname:'JIANG', count:1, weight:2, cbMoveTo:function(piece,cboard){
        var cboard = cboard;
        var dx = Math.abs(this.x - piece.x);
        var dy = Math.abs(this.y - piece.y);
        //return (dx == 1 && (dy == 1 || dy == 0)) || (dx == 0 && dy == 1);
         if (isInStraightLine(this, piece)) {
            var count = obstaclesCountOnStraightLine(this, piece, cboard);
            return (piece.camp == undefined && count == 0) || (piece.camp != undefined && (count == 1 || count == 0));
        }//for 车和炮

         return ( dx == 2 && dy == 2 && cboard[(this.y + piece.y) / 2][(this.x + piece.x) / 2].name == EMPTY_NAME ) ||
                ((dx == 1 && dy == 2 && cboard[(this.y + piece.y) / 2][this.x].name == EMPTY_NAME) ||
                (dx == 2 && dy == 1 && cboard[this.y][(this.x + piece.x) / 2].name == EMPTY_NAME))||
                ((dx == 1 && (dy == 1 || dy == 0)) || (dx == 0 && dy == 1));
    }},
    '兵': {fname:'BING', count:5, weight:6, cbMoveTo:function(piece, cboard){
        var dx = Math.abs(this.x - piece.x);
        var dy = Math.abs(this.y - piece.y);
        return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
    }}
};

var availablePieces = [];

function createPiece(camp, name, desc) {
    for (var i = 0; i < desc.count; i++) {
        availablePieces.push({camp: camp, name: name, fname: desc.fname, weight: desc.weight, cb: desc.cbMoveTo});
    }
}

function createPiecesFor(camp) {
    Object.keys(piecesDesc).forEach(function(o){
        createPiece(camp, o, piecesDesc[o]);
    });
}

function popAPieceTo(x, y) {
    if (availablePieces.length > 0) {
        var piece = undefined;
        if (availablePieces.length == 1) {
            piece = availablePieces[0];
        } else {
            piece = availablePieces.splice(randomInt(availablePieces.length), 1)[0];
        }
        return new Piece(piece.name, piece.fname, piece.camp, piece.weight, x, y, piece.cb);
    } else {
        return createEmptyPieceAt(x, y);
    }
}

var emptyColumn = Math.floor(columnsCount / 2);
var emptyRow = rowsCount - 1;

function Board(gameId){
    console.log('start renew board.');//***********
    board = [];
    availablePieces = [];
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
    
    global.board[gameId] = [];
    global.board[gameId] = board;

    return {
        grids: board,
        columnsCount: columnsCount,
        rowsCount: rowsCount
    };
};

exports.Board = Board;