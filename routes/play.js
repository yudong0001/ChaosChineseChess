var router = require('express').Router();

router.all('/', function(req, res){
    console.log('------', req.body.x, req.body.y);
    req.session.count++;
    res.json({
        result:'success',
        movement:true,
        sessionID: req.session.id,
        reqCount: req.session.reqCount
    });
});

module.exports = router;
