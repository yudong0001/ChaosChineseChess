var router = require('express').Router();
// var board = require('../models/board').Board();
var boardMami = require('../models/board');

/* GET home page. */
router.get('/', function(req, res, next) {
    var board = boardMami.Board();
    console.log('route:index.js: restart page ,grids[0][0]:%o',board.grids[0][0]);//********
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