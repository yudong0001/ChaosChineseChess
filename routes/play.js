var router = require('express').Router();

router.all('/', function(req, res){
    req.session.cookie.expires = false;
    if (req.session.count == undefined) {
        req.session.count = 0;
    }
    req.session.count++;
    res.json({
        result:'success',
        movement:true,
        testValue: req.session.id,
        testCount: req.session.count
    });
});

module.exports = router;
