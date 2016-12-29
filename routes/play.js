var router = require('express').Router();
var camper = require('../models/camper');

	var EMPTY_NAME = '空';

	function getCellFromMami(jqMami) {
        var x = jqMami.css('left');
        var y = jqMami.css('top');
        x = x.substring(0, x.length - 2) / cellSize;
        y = y.substring(0, y.length - 2) / cellSize;
        return {x: x, y: y};
    }

    function updateMamiForCell(jqMami, cell) {
        if (cell.hidden) {
            return;
        } else {
            jqMami.addClass('discovered');
        }
        if (cell.name == EMPTY_NAME) {
            jqMami.removeClass('red discovered selected').addClass('discovered empty').text('');
        } else {
            jqMami.removeClass('red black').addClass(cell.camp).text(cell.name);
        }
    }

    // AIPlayer 的难度依据 AI 是否知晓盘面全局（未翻开的棋子）划分。
    var aiPlayer = {
        camp: undefined,
        testCouldMove: function(pieceMami, targetMami) {
            var piece = getCellFromMami(pieceMami);
            var target = getCellFromMami(targetMami);
            return piece.canMoveTo(targetMami);
        },
        play: function() {
            // 电脑检测有无已翻开的己方棋子并尝试走动。
            var candidates = $('.' + this.camp + '.discovered:not(.empty)').get();
            var targets = $('.discovered:not(.' + this.camp + ')').get();
            var validMovements = [];
            for (var i = 0; i < candidates.length; i++) {
                var candMami = $(candidates[i]);
                var candCell = getCellFromMami(candMami);
                for (var j = 0; j < targets.length; j++) {
                    var tarMami = $(targets[j]);
                    var tarCell = getCellFromMami(tarMami);
                    if (candCell.canMoveTo(tarCell)) {
                        validMovements.push({pieceMami:candMami, targetMami:tarMami});
                    }
                }
            }
            if (validMovements.length > 0) {
                var mm = validMovements[0];
                var piece = getCellFromMami(mm.pieceMami);
                console.log('电脑的' + piece.name + '走了一步');
                var target = getCellFromMami(mm.targetMami);
                piece.moveTo(target);
                updateMamiForCell(mm.pieceMami, piece);
                updateMamiForCell(mm.targetMami, target);
                return;
            }

            // 走动失败，随机（或有选择的，依据难度不同）翻开棋子。
            var undiscovered = $('.cell:not(.discovered)').get();
            if (undiscovered.length > 0) {
                var toBeDiscoveredMami = $(undiscovered[randomInt(undiscovered.length)]);
                var toBeDiscovered = getCellFromMami(toBeDiscoveredMami);
                console.log('电脑翻开了 ' + toBeDiscovered.camp + ' ' + toBeDiscovered.name);
                toBeDiscovered.hidden = false;
                updateMamiForCell(toBeDiscoveredMami, toBeDiscovered);
                return;
            }

            // 无可用下一步，则检测是否输局或 Pass 一步。
            var restPieces = $('.discovered.' + this.camp).get();
            var restEnemies = $('.discovered.' + camper.getEnemy(this.camp));
            if (restPieces.length == 0 && restEnemies.length > 0) {
                console.log('电脑认输');
            } else {
                console.log('电脑 Pass 一步');
            }
        },
    };//***AI Player***

    // ==== MoveTo ===
    // Post data:
    /*
        selected: {x, y}
        target: {x, y}
    */
    // Return data:
    /*
        isMoved
    */

    var humanPlayer = {
        selectedAlly: undefined,
        camp: undefined,
        tryMovePiece: function(resp,targetMami) {
            /*var selected = getCellFromMami(this.selectedAlly);
            var targetCell = getCellFromMami(targetMami);*/
            var selected = this.selectedAlly;
            var targetCell = targetMami;
            var killer = selected;
            var killed = targetCell;
            if (selected.canMoveTo(targetCell)) {
                /*selected.moveTo(targetCell);
                updateMamiForCell(this.selectedAlly, selected);
                updateMamiForCell(targetMami, targetCell);
                this.selectedAlly = undefined;*/
                resp.json({
                    action:'kill',
                    killer:killer,
                    killed:killed
                });
                selected.moveTo(targetCell);
                this.selectedAlly = undefined;
                //aiPlayer.play();
            } else {
                console.log('不能这么走，你要去学一学中国象棋基本规则。');
                resp.json();
            }
        },
        play: function(e) {
            console.log('enter humanPlayer.play');//************
            
            /*var clicked = $(e.currentTarget);
            var cell = getCellFromMami(clicked);*/
            var requ = e.req;
            var resp = e.res;
            var cellpos = {x:e.posx ,y:e.posy};
            var cell = global.board[cellpos.y][cellpos.x];

            console.log('get board from global:%o', cell);//***************
            console.log('who is this in humanPlayer.play: %o',this);//**************


            if (this.selectedAlly == undefined) {
                if (cell.name == EMPTY_NAME) {
                    console.log('点击空地。');//*************
                    resp.json();
                } else {
                    if (cell.hidden) {
                        console.log('翻开一颗 ' + cell.camp + ' 棋子。');//**********

                        if (this.camp == undefined) {
                            //assign camp to player1&player2
                            camper.assignCamp(cell.camp, this, aiPlayer);
                            console.log('who is this after assignCamp: %o',this);//**************
                        }
                        cell.hidden = false;
                        /*clicked.addClass('discovered ' + cell.camp).text(cell.name);*/
                        resp.json({
                            action:'discover',
                            cell:cell
                        });
                        //aiPlayer.play();
                    } else {
                        if (this.camp == cell.camp) {
                            console.log('选择一颗己方 ' + cell.camp + ' 棋子。');
                            /*clicked.addClass('selected');
                            this.selectedAlly = clicked;*/
                            this.selectedAlly = cell;
                            resp.json({
                                action:'select',
                                cell:cell
                            });
                        } else {
                            console.log('敌方棋子，无法选择。');
                            resp.json();
                        }
                    }
                }
            } else {
                if (cell.name == EMPTY_NAME) {
                    /*this.tryMovePiece(clicked);*/
                    this.tryMovePiece(resp,cell);
                } else {
                    if (cell.hidden) {
                        console.log('要翻开棋子，请取消当前选择的棋子。');
                        resp.json();
                        return;
                    }
                    if (cell.camp == this.camp) {
                        //$('.cell').removeClass('selected');
                        // if (this.selectedAlly.get(0) == clicked.get(0)) {
                        if (this.selectedAlly == cell) {
                            console.log('取消选择。');
                            this.selectedAlly = undefined;
                            resp.json({
                                action:'unselect'
                            });
                        } else {
                            console.log('切换选择。');
                            //clicked.addClass('selected');
                            this.selectedAlly = cell;
                            resp.json({
                                action:'exchange'
                            });
                        }
                    } else {
                        /*this.tryMovePiece(clicked);*/
                        this.tryMovePiece(resp,cell);
                    }
                }
            }
        },
    };//***humanPlayer***

router.post('/',function(req,res){
	console.log('-----:: %o',req.body.x);//************
    humanPlayer.play({req:req ,res:res ,posx:req.body.x ,posy:req.body.y});
});

/*router.all('/', function(req, res){
    //console.log('-----'+req.body.x);
    humanPlayer.play({x:req.body.x, y:req.body.y});
    req.session.count++;
    res.json({
        result:'success',
        movement:true,
        sessionID: req.session.id,
        reqCount: req.session.reqCount
    });
});*/

module.exports = router;
