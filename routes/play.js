var router = require('express').Router();
var camper = require('../models/camper');

var jiangNormal = function(piece, cboard){
    var dx = Math.abs(this.x - piece.x);
    var dy = Math.abs(this.y - piece.y);
    return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
}

	var EMPTY_NAME = '空';

	function randomInt(max){
        var rvalue = Math.floor( Math.random()*max );
        console.log('randomInt value:'+ rvalue);//*******
        return rvalue;
    }

    function AIPlayer(){
        this.camp = undefined;
        //this.superJiang = true;
        this.jiangStepChange = true;
        // function testCouldMove(pieceMami, targetMami) {
        //     return piece.canMoveTo(target);
        // }

        this.play = function(e){
            // 电脑检测有无已翻开的己方棋子并尝试走动。
            var requ = e.req;
            var resp = e.res;
            var gameId = requ.session.gameId;
            var gameX = global.gameX[gameId];

            var board = gameX.board.grids;
            var rangeX = gameX.board.columnsCount;
            var rangeY = gameX.board.rowsCount-1;
            var candidates = [];
            var targets = [];
            var validMovements = [];

            console.log('entr AIPlayer.play ,board[0][0] is: %o' ,board[0][0]);//***********

            var count1=count2=0;
            for (var i = rangeY - 1; i >= 0; i--) {//row number
                for(var j=0;j<rangeX;j++){//column number
                    //console.log('for AI candi&target ,current cell discoverd:%o',board[i][j]);//*******
                    if(!board[i][j].hidden && board[i][j].name!=EMPTY_NAME ){
                        if(board[i][j].camp == this.camp){
                            candidates.push(board[i][j]);
                        }else{
                            targets.push(board[i][j]);
                        }
                    }
                }
            }

            //console.log('AIPlayer.candidates is: %o',candidates);//*************
            //console.log('AIPlayer.targets is: %o',targets);//************

            for (var i = 0; i < candidates.length; i++) {
                var candCell = candidates[i];
                for (var j = 0; j < targets.length; j++) {
                    var tarCell = targets[j]; 
                    if (candCell.canMoveTo(tarCell, board)) {
                        validMovements.push({pieceMami:candCell, targetMami:tarCell});
                    }
                }
            }
            if (validMovements.length > 0) {
                var rv = randomInt(validMovements.length);
                var piece = validMovements[rv].pieceMami;
                var target = validMovements[rv].targetMami;
                /*if(piece.name == '将'&&this.superJiang){this.superJiang = false;}
                if(jiangStepChange&&piece.name == '将'&&!this.superJiang){*/
                if(this.jiangStepChange&&piece.name == '将'){
                    console.log('AI:start to change the step method for jiang.');//******
                    this.jiangStepChange = false;
                    piece.canMoveTo = jiangNormal;
                }
                console.log('电脑的' + this.camp+piece.name + ' KO ' +target.camp+target.name);
                piece.moveTo(target);
                resp.json({
                    action:'kill',
                    killer:piece,
                    killed:target
                });
                return;
            }

            // 走动失败，随机（或有选择的，依据难度不同）翻开棋子。
            var undiscovered = [];
            console.log('start discovering by AI.');//************

            count1=count2=0;
            for (var i = rangeY - 1; i >= 0; i--) {
                for(var j=0;j<rangeX;j++){
                    if(board[i][j].hidden&&board[i][j].name!=EMPTY_NAME){
                        undiscovered.push(board[i][j]);
                    }
                }
            }
            console.log('ai.undiscovered length: '+undiscovered.length);//***********

            if (undiscovered.length > 0) {
                console.log('start to discover a cell by AI.');//**********
                var toBeDiscovered = undiscovered[randomInt(undiscovered.length)];
                console.log('电脑翻开了 ' + toBeDiscovered.camp + ' ' + toBeDiscovered.name);
                toBeDiscovered.hidden = false;
                resp.json({
                    action:'discover',
                    cell:toBeDiscovered
                });
                return;
            }

            // 无可用下一步，则检测是否输局或 Pass 一步。
            var restPieces = [];
            var restEnemies = camper.getEnemy(this.camp);
            count1=count2=0;
            for (var i = rangeY - 1; i >= 0; i--) {
                for(var j=0;j<rangeX;j++){
                    //console.log('for AI restPieces,current cell is %o',board[i][j]);//********
                    if(board[i][j].camp == this.camp){
                        restPieces.push(board[i][j]);
                    }
                }
            }
            if (restPieces.length == 0 && restEnemies.length > 0) {
                console.log('电脑认输');
                resp.json({
                    action:'finished',
                });
            } else if (restPieces.length > 0 && restEnemies.length == 0){
                console.log('Human 输了！');
                resp.json({
                    action:'finished',
                });
            }else {
                console.log('电脑 Pass 一步');
                resp.json({
                    action:'pass',
                });
            }
        };
    }//object 'AIPlayer'

    function humanPlayer(){
        this.selectedAlly = undefined;
        this.camp= undefined;
        this.jiangStepChange = true;

        this.play= function(e) {
            console.log('enter humanPlayer.play');//************
            console.log('global.gameX:%o',global.gameX);//********
            
            var requ = e.req;
            var resp = e.res;
            var cellpos = {x:e.posx ,y:e.posy};
            var gameId = requ.session.gameId;
            var gameX = global.gameX[gameId];

            var playerX = gameX.playerX;
            var playerY = gameX.playerY;
            //var board = requ.session.board;
            //var board = global.board[gameId];
            var board = gameX.board.grids;
            var cell = board[cellpos.y][cellpos.x];

            console.log('humanPlay:global.gameX.board[3][8]: %o'+board[3][8].camp+board[3][8].name);//*******
            console.log('humanPlay:get req cell from global board: '+cell.camp+cell.name);//***************
            console.log('who is this in humanPlayer.play: '+this.camp);//**************


            if (this.selectedAlly == undefined) {
                if (cell.name == EMPTY_NAME) {
                    console.log('点击空地。');//*************
                    resp.json();
                    return;
                } else {
                    if (cell.hidden) {
                        console.log('翻开一颗 ' + cell.camp + cell.name);//**********

                        if (this.camp == undefined) {
                            //assign camp to player1&player2
                            if(e.playMode=='humanAI'){
                                camper.assignCamp(cell.camp, playerX, playerY);
                            }else{
                                camper.assignCamp(cell.camp, playerX, playerY);
                            }
                            console.log('who is this after assignCamp: %o'+this.camp);//**************
                        }
                        cell.hidden = false;
                        resp.json({
                            action:'discover',
                            cell:cell
                        });
                        //aiPlayer.play();
                        return;
                    } else {
                        if (this.camp == cell.camp) {
                            console.log('选择一颗己方 ' + cell.camp + cell.name);//*********
                            this.selectedAlly = cell;
                            resp.json({
                                action:'select',
                                cell:cell
                            });
                            return;
                        } else {
                            console.log('敌方棋子，无法选择。'+ cell.camp + cell.name);//*********
                            resp.json();
                            return;
                        }
                    }
                }
            } else {
                var selected = this.selectedAlly;
                if (cell.name == EMPTY_NAME) {
                    var result = tryMovePiece(resp, this.jiangStepChange, cell, cboard);
                    if(result.okToMove){
                        this.selectedAlly = undefined;
                        if(this.jiangStepChange){
                            this.jiangStepChange = result.jsc;
                        }
                    }
                } else {
                    if (cell.hidden) {
                        console.log('要翻开棋子，请取消当前选择的棋子。');//*******
                        resp.json();
                        return;
                    }
                    if (cell.camp == this.camp) {
                        if (this.selectedAlly == cell) {
                            console.log('取消选择。');//*******
                            this.selectedAlly = undefined;
                            resp.json({
                                action:'unselect',
                                cell:cell
                            });
                            return;
                        } else {
                            console.log('切换选择。');//*******
                            this.selectedAlly = cell;
                            resp.json({
                                action:'xselect',
                                cell:cell
                            });
                            return;
                        }
                    } else {
                        var result = tryMovePiece(resp, this.jiangStepChange, cell, cboard);
                        if(result.okToMove){
                            this.selectedAlly = undefined;
                            if(this.jiangStepChange){
                                this.jiangStepChange = result.jsc;
                            }
                        }
                        return;
                    }
                }
            }

            function tryMovePiece(resp, jiangStepChange, targetMami, cboard) {
                var cboard = cboard;
                var okToMove = false;
                var jsc = jiangStepChange;
                var targetCell = targetMami;
                var killer = selected;
                var killed = targetCell;
                console.log('人类:killer:%o KO %o'+killer.camp+killer.name+':'+killed.camp+killed.name);//**********

                if (selected.canMoveTo(targetCell, cboard)) {
                    okToMove = true;
                    console.log('prepare changing method for jiang step.'+jsc+':'+selected.name);//********
                    if(jsc&&selected.name == '将'){
                        console.log('start change method for jiang step.');//********
                        jsc = false;
                        selected.canMoveTo = jiangNormal;
                    }
                    selected.moveTo(targetCell);
                    resp.json({
                        action:'kill',
                        killer:killer,
                        killed:killed
                    });
                } else {
                    console.log('不能这么走，你要去学一学中国象棋基本规则。');//************
                    resp.json({
                        action:'canNotMove'
                    });
                }
                return {okToMove:okToMove,jsc:jsc};
            }//function 'tryMovePiece'

        };



    }//***humanPlayer***

    // var aiPlayer = [];
    // var humanPlayerX = [];
    // var humanPlayerY = [];
    // var humanPlayer3 = undefined;
    

router.post('/',function(req,res){
	console.log('-----:'+req.body.player +':'+req.body.x+':gameId:'+req.session.gameId+':refresh flag:'+req.session.refresh);//*******
    var gameId = req.session.gameId;
    var playMode = req.body.playMode;

    console.log('play:global.gameX:%o',global.gameX[gameId]);//*********

    if(req.body.playMode == "humanAI"){
        if(req.session.refresh!=undefined&&req.session.refresh==gameId){
            console.log('start to init players.');//*******
            req.session.refresh = undefined;
            global.gameX[gameId].playerX = new humanPlayer;
            global.gameX[gameId].playerY = new AIPlayer;
        }
        console.log('play:humanPlayer1:%o',global.gameX[gameId].playerX);//*********

        if(req.body.player == "human"){
            global.gameX[gameId].playerX.play({ req:req ,res:res ,playMode:playMode ,posx:req.body.x ,posy:req.body.y });
        }else{
            global.gameX[gameId].playerY.play({req:req ,res:res});
        }
    }else if(req.body.playMode == "human"){
        if(req.session.refresh!=undefined&&req.session.refresh == gameId){
            req.session.refresh = undefined;;
            global.gameX[gameId].playerX = new humanPlayer;
            global.gameX[gameId].playerY = new humanPlayer;
        }
        if(req.body.player == "human"){
            global.gameX[gameId].playerX.play({ req:req ,res:res ,playMode:playMode ,posx:req.body.x ,posy:req.body.y });
        }else{
            global.gameX[gameId].playerY.play({ req:req ,res:res ,playMode:playMode ,posx:req.body.x ,posy:req.body.y });
        }
    }
    
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
