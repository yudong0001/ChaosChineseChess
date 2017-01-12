var router = require('express').Router();
// var board = require('../models/board').Board();
var boardMami = require('../models/board');

global.gameId = 0;

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.session.gameId == undefined){
        req.session.gameId = global.gameId++;
    }
    req.session.refresh = req.session.gameId;//set the refresh flag for initial players in the same session
    var board = boardMami.Board(req.session.gameId);
    console.log('route:index.js: restart page ,grids[1][1]:%o',board.grids[1][1]);//********
    if (req.session.board == undefined) {
        req.session.board = board;
        req.session.reqCount = 0;
    }

    console.log('session.reqcount: '+req.session.reqCount);//********
    
    req.session.reqCount++;
    res.render('index', {
        title: '迷你象棋',
        rowsCount: board.rowsCount,
        columnsCount: board.columnsCount,
        grids: board.grids
    });
});

module.exports = router;