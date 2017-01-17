var router = require('express').Router();
// var board = require('../models/board').Board();
var boardMami = require('../models/board');

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('session gen id:'+req.session.genid);//*********
    if(global.gameId == undefined){
        global.gameId = 0;
        global.gameX = new Array;
    }//initial global.gameId and global.gameX

    if(req.session.gameId){
        global.gameX[req.session.gameId]=undefined;
    }
    req.session.gameId = global.gameId++;
    var gameId = req.session.gameId;
    // if(req.session.gameId == undefined){
    //     req.session.gameId = global.gameId++;
    // }
    
    console.log('route:index.js.session.gameId: '+gameId);//********

    var board = boardMami.Board(gameId);
    if(!global.gameX[gameId]){
        global.gameX[gameId] = new Object;
    }
    global.gameX[gameId].board = board;
    global.gameX[gameId].playerX = new Object;
    global.gameX[gameId].playerY = new Object;
    console.log('route.index:global.gameX:%o',global.gameX);//********

    //var board = undefined;
    // if (req.session.board == undefined) {
    //     req.session.reqCount = 0;
    //     //board = boardMami.Board(req.session.reqCount);
    //     req.session.board = board;
    // }else{
    //     //board = boardMami.Board(req.session.reqCount);
    // }
    console.log('route:index.js: restart page ,grids[1][1]:%o'+board.grids[1][1].camp+board.grids[1][1].name);//********

    req.session.refresh = gameId;//set the refresh flag for initial players in the same session
    console.log('route:index.js.session.reqCount: '+req.session.reqCount);//********
    
    req.session.reqCount++;
    res.render('index', {
        title: '迷你象棋',
        rowsCount: board.rowsCount,
        columnsCount: board.columnsCount,
        //grids: board.grids
    });
});

module.exports = router;