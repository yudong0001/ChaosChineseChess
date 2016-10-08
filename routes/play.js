var router = require('express').Router();

router.all('/', function(req, res){
    req.session.cookie.expires = false;
    if (req.session.count == undefined) {
        req.session.count = 0;
    }
    console.log('------', req.body.hw);
    req.session.count++;
    res.json({
        result:'success',
        movement:true,
        testValue: req.session.id,
        testCount: req.session.count
    });
});

router.post('/flip', function(req, res){
    req.session.count++;
    if (req.session.board == undefined) {
        req.session.board = {
            placeholder: '占位内容',
            foo: function(){
                console.log('blablabla');
            }
        }
    }
    var board = req.session.board;
    res.json({
        result:'success',
        testCount: req.session.count,
        ph: req.session.board
    });
});

module.exports = router;
