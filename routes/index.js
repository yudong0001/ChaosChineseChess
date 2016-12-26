var router = require('express').Router();
var board = require('../models/board').Board();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.board == undefined) {
        req.session.board = board;
        req.session.reqCount = 0;
    }
    req.session.reqCount++;
    res.render('index', {
        title: '迷你象棋',
        rowsCount: board.rowsCount,
        columnsCount: board.columnsCount,
        grids: board.grids
    });
});

module.exports = router;