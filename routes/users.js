var express = require('express');
var router = express.Router();

var users = require('../models/users.js').users;

/* GET users listing. */
router.all('/', function(req, res, next) {
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.send(users);
});

module.exports = router;
