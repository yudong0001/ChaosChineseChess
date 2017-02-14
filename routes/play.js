var router = require('express').Router();
var camper = require('../models/camper');

var jiangNormal = function(piece, cboard){
    var dx = Math.abs(this.x - piece.x);
    var dy = Math.abs(this.y - piece.y);
    return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
}

var EMPTY_NAME = '空';

function randomInt(max){
    var rvalue = Math.round( Math.random()*max );
    console.log('randomInt value:'+ rvalue);//*******
    return rvalue;
}

function isSame(piece1, piece2){
    return (piece1.x == piece2.x && piece1.y == piece2.y);
}

function isInside(piece1,piece2,piece3){
    if(!(piece1.x==piece2.x&&piece2.x==piece3.x || piece1.y==piece2.y&&piece2.y==piece3.y)){
        return false;
    } ;
    var minPiece = piece2,maxPiece = piece3;
    var result = false;
    if(minPiece.x==maxPiece.x){
        if(minPiece.y>maxPiece.y){
            var tmpPiece = minPiece;
            minPiece = maxPiece;
            maxPiece = tmpPiece;
        }
        if(piece1.y>minPiece.y&&piece1.y<maxPiece.y){
            result = true;
        }
    }else{
        if(minPiece.x>maxPiece.x){
            var tmpPiece = minPiece;
            minPiece = maxPiece;
            maxPiece = tmpPiece;
        }
        if(piece1.x>minPiece.x&&piece1.x<maxPiece.x){
            result = true;
        }
    }
    return result;
}

function AIPlayer(){
    this.camp = undefined;
    this.superJiang = true;
    //this.jiangStepChange = true;
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
        var rangeY = gameX.board.rowsCount;
        var candidates = [];
        var candidatesOpp = [];
        var targets = [];
        var freeTargets = [];
        var validMovements = [];
        var validMovementsOpp = [];
        var freeWalk = [];
        var freeWalkOpp = [];

        console.log('entr AIPlayer.play ,board[0][0] is: %o' +board[0][0].camp+':'+board[0][0].name);//***********

        var count1=count2=0;
        for (var i = rangeY - 1; i >= 0; i--) {//row number
            for(var j=0;j<rangeX;j++){//column number
                //console.log('for AI candi&target ,current cell discoverd:%o',board[i][j]);//*******
                //if(!board[i][j].hidden && board[i][j].name!=EMPTY_NAME ){
                if(!board[i][j].hidden){
                    if(board[i][j].camp == this.camp){
                        candidates.push(board[i][j]);
                    }else if(board[i][j].camp != undefined){
                        board[i][j].isCovered = false;
                    	candidatesOpp.push(board[i][j]);
                    	targets.push(board[i][j]);
                    }else{
                    	targets.push(board[i][j]);//for AI kill
                        freeTargets.push(board[i][j]);//for freeWalkOpp
                    }
                }
            }
        }

        //console.log('AIPlayer.candidates is: %o',candidates);//*************
        //console.log('AIPlayer.targets is: %o',targets);//************

        for (var i = 0; i < candidatesOpp.length; i++) {
            var candCell = candidatesOpp[i];
            for (var j = 0; j < candidates.length; j++) {
                var tarCell = candidates[j]; 
                if (candCell.canMoveTo(tarCell, board)) {
                    //console.log('canMoveTo for Opp:tarCell.weight:'+tarCell.weight);//********
                    validMovementsOpp.push({pieceMami:candCell, targetMami:tarCell});
                }
            }
            if(candidatesOpp.length>1){
                for(var j=0;j<candidatesOpp.length;j++){
                    if(i!=j&&candidatesOpp[j].canMoveTo(candidatesOpp[i], board)){
                        candidatesOpp[i].isCovered = true;
                    }
                }
            }
        }//for killOpp

        console.log('check ai.candidatesOpp.isCovered: %o',candidatesOpp);//*******

        for (var i = 0; i < candidatesOpp.length; i++) {
            var candCell = candidatesOpp[i];
            for (var j = 0; j < freeTargets.length; j++) {
                var tarCell = freeTargets[j]; 
                if (candCell.canMoveTo(tarCell, board)) {
                    //console.log('canMoveTo for freeWalkOpp:tarCell.weight:'+tarCell.weight);//********
                    freeWalkOpp.push({pieceMami:candCell, targetMami:tarCell, danger:false});
                }
            }
        }//for freeWalkOpp

        for (var i = 0; i < candidates.length; i++) {
            var candCell = candidates[i];
            for (var j = 0; j < targets.length; j++) {
                var tarCell = targets[j]; 
                if (candCell.canMoveTo(tarCell, board)) {
                    //console.log('canMoveTo:tarCell.weight:'+tarCell.weight);//********
                    if(tarCell.weight<10){
                        validMovements.push({pieceMami:candCell, targetMami:tarCell});
                    }else{
                        freeWalk.push({pieceMami:candCell, targetMami:tarCell, danger:false});
                    }
                }
            }
        }//for kill&freeWalk

        if (freeWalk.length > 0 && freeWalkOpp.length > 0) {
            for(var i=0;i<freeWalk.length;i++){
            	for(var j=0;j<freeWalkOpp.length;j++){
            		if(isSame(freeWalk[i].targetMami, freeWalkOpp[j].targetMami)
                        && freeWalkOpp[j].pieceMami.name != '炮'){
            			freeWalk[i].danger = true;
            		}
            	}
                if(candidatesOpp.length>0){
                    freeWalk[i].targetMami.camp = 'gray';
                    for(var j=0;j<candidatesOpp.length;j++){
                        if(candidatesOpp[j].name=='炮' && candidatesOpp[j].canMoveTo(freeWalk[i].targetMami, board) 
                            && !isInside(freeWalk[i].pieceMami, candidatesOpp[j], freeWalk[i].targetMami)){
                            freeWalk[i].danger = true;
                        }
                        // if(candidatesOpp[j].name=='炮'){
                        //     console.log('set danger flag for freeWalk[i] of 炮:canMoveTo:'+candidatesOpp[j].canMoveTo(freeWalk[i].targetMami, board));//*******
                        //     console.log('set danger flag for freeWalk[i] of 炮:isInside:'+isInside(freeWalk[i].pieceMami, candidatesOpp[j], freeWalk[i].targetMami));//******
                        //     console.log('set danger flag for freeWalk[i] of 炮:freeWalk[i]:%o',freeWalk[i]);//******
                        // }
                    }
                    freeWalk[i].targetMami.camp = undefined;
                }//for enemy '炮'
                if(validMovementsOpp.length>0){
                    for(var jj=0;jj<validMovementsOpp.length;jj++){
                        if( isSame(freeWalk[i].pieceMami, validMovementsOpp[jj].targetMami) 
                            && (validMovementsOpp[jj].pieceMami.name == '车' || validMovementsOpp[jj].pieceMami.name == '炮' 
                                || validMovementsOpp[jj].pieceMami.name == '将'&&this.superJiang) ){
                                if( (validMovementsOpp[jj].pieceMami.x == validMovementsOpp[jj].targetMami.x 
                                    && validMovementsOpp[jj].pieceMami.x == freeWalk[i].targetMami.x)
                                    || (validMovementsOpp[jj].pieceMami.y == validMovementsOpp[jj].targetMami.y 
                                    && validMovementsOpp[jj].pieceMami.y == freeWalk[i].targetMami.y) ){
                                        freeWalk[i].danger = true;
                                }
                                console.log('check freeWalk.danger while catched by JuPaoJiang:%o',validMovementsOpp[jj]);//******
                                console.log('check freeWalk.danger while catched by JuPaoJiang:%o',freeWalk[i]);//******
                                // if( validMovementsOpp[jj].pieceMami.name == '车' 
                                //     && (freeWalk[i].pieceMami.name == '士' || freeWalk[i].pieceMami.name == '相' || freeWalk[i].pieceMami.name == '马')
                                //     && (validMovementsOpp[jj].pieceMami.x == freeWalk[i].targetMami.x
                                //     || validMovementsOpp[jj].pieceMami.y == freeWalk[i].targetMami.y) ){
                                //         freeWalk[i].danger = true;
                                // }
                        }
                    }
                }
            }
        }//set danger flag for freeWalk

        // if(freeWalk.length>0){
        //     console.log('AI.freeWalk: %o',freeWalk);//******
        // }

        if (validMovements.length > 0 || freeWalk.length > 0) {
            var validFirstKills = new Array;
            var validFightBacks = new Array;
            var validPreKills = new Array;
            var validEscapes = new Array;
            var movements = new Array;
            var rv = 0;
            var piece = validMovements.length > 0?validMovements[rv].pieceMami:freeWalk[rv].pieceMami;
            var target = validMovements.length > 0?validMovements[rv].targetMami:freeWalk[rv].targetMami;
            //console.log('AI.play:target.weight:'+target.weight);//*******
            
            if (validMovements.length > 0 && validMovementsOpp.length > 0){
                //console.log('some pieces danger,prepare to first kill,validMovementsOpp:%o',validMovementsOpp);//*******
                //console.log('some pieces danger,prepare to first kill,validMovements:%o',validMovements);//*******
                // piece = validMovements[rv].pieceMami;
                // target = validMovements[rv].targetMami;
            	var doFirstKill = false;
                var actWeight = 100;
                for(var i=0;i<validMovementsOpp.length;i++){
            		for(var j=0;j<validMovements.length;j++){
                        //console.log('prepare to do first kill.validMovements:',validMovements);//*****
                        //console.log('prepare to do first kill.validMovementsOpp:',validMovementsOpp);//*****
                        //console.log('first kill condition:' + isSame(validMovements[j].pieceMami, validMovementsOpp[i].targetMami));//***
                        //console.log('first kill condition,piece.weight:' +':'+ validMovements[j].pieceMami.weight+':'+validMovements[rv].pieceMami.weight );//*******
            			
               //          if( isSame(validMovements[j].pieceMami, validMovementsOpp[i].targetMami) 
               //              && validMovements[j].pieceMami.weight <= validMovements[rv].pieceMami.weight){
            			// 	rv = j;
            			// 	doFirstKill = true;
               //              movements.push({action:'firstKill', rv:j});
               //              console.log('AI will do first kill.');//*****
            			// 	// piece = validMovements[rv].pieceMami;
            			// 	// target = validMovements[rv].targetMami;
            			// }
                        if( isSame(validMovements[j].pieceMami, validMovementsOpp[i].targetMami)){
                            validFirstKills.push(validMovements[j]);
                        }

                        if( isSame(validMovements[j].targetMami, validMovementsOpp[i].pieceMami)){
                            if(actWeight>validMovementsOpp[i].targetMami.weight){
                                actWeight = validMovementsOpp[i].targetMami.weight;
                                rv = j;
                                console.log('AI prepare kill killed.');//*******
                            }
                        }
                        
            		}
            	}
                if(actWeight<100){
                    movements.push({action:'fightBack', rv:rv, actWeight:actWeight});
                }
                
                if(validFirstKills.length>0){
                    doFirstKill = true;
                    rv = 0;
                    for(var i=0;i<validFirstKills.length;i++){
                        if(validFirstKills[i].pieceMami.weight<=validFirstKills[rv].pieceMami.weight){
                            rv = i;
                        }
                    }
                }
                if(doFirstKill){
                    movements.push({action:'firstKill', rv:rv});
                }

                // piece = validMovements[rv].pieceMami;
                // target = validMovements[rv].targetMami;
            }//for first kill
            
            // if(!canEscape && validMovementsOpp.length > 0 && freeWalk.length > 0){
            if(validMovementsOpp.length > 0 && freeWalk.length > 0){
                rv = 0;
                console.log('some pieces danger,prepare to escape,rv initial value:'+rv);//*******
                //console.log('some pieces danger,prepare to escape,validMovementsOpp:%o',validMovementsOpp);//*******
                // piece = freeWalk[rv].pieceMami;
                // target = freeWalk[rv].targetMami;
            	for(var i=0;i<validMovementsOpp.length;i++){
            		for(var j=0;j<freeWalk.length;j++){
                        //console.log('validEscapes:%o',validEscapes);//*****
            	        if( isSame(freeWalk[j].pieceMami, validMovementsOpp[i].targetMami) 
                            && !freeWalk[j].danger){
                            validEscapes.push(freeWalk[j]);
                        }
            		}
            	}
                var canEscape = false;
                if(validEscapes.length>0){
                    for(var i=0;i<validEscapes.length;i++){
                        if(validEscapes[i].pieceMami.weight <= validEscapes[rv].pieceMami.weight){
                            rv = i;
                            canEscape = true;
                        }
                    }
                }
                if(canEscape){
                    movements.push({action:'escape', rv:rv});
                    console.log('for safe escape.validEscapes[rv].danger:'+validEscapes[rv].danger);//*******
                }
                // piece = freeWalk[rv].pieceMami;
                // target = freeWalk[rv].targetMami;
            }//for escape

            // if (!canEscape && validMovements.length > 0){
            if (validMovements.length > 0){
                rv = 0;
                //canEscape = true;
                for(var i = 0; i < validMovements.length; i++){
                    if(validMovements[i].targetMami.weight <= validMovements[rv].targetMami.weight){ 
                        if(!validMovements[i].targetMami.isCovered){
                            rv = i;
                            movements.push({action:'normalKill', rv:i});
                        }else if(validMovements[i].targetMami.isCovered 
                            && validMovements[i].targetMami.weight <= validMovements[i].pieceMami.weight){
                            rv = i;
                            movements.push({action:'normalKill', rv:i});
                        }
                    }
                    //console.log('AI.play.validMovements:target.weight:'+target.weight);//*******
                }
                console.log('for AI normal kill');//******
                // piece = validMovements[rv].pieceMami;
                // target = validMovements[rv].targetMami;
            }//for normal kill
            console.log('AI.movements.length:'+movements.length);//*******
            //if(canEscape){
            if(movements.length>0){
                console.log('movements: %o',movements);//*******
                var tmpWeight = 100, mi = -1;
                var firstKill = false, fightBack = false, escape = false;
                for(var c=0;c<movements.length;c++){
                    if(movements[c].action == 'firstKill' &&validFirstKills[movements[c].rv].pieceMami.weight < tmpWeight){
                        firstKill = true;
                        fightBack = false;
                        tmpWeight = validFirstKills[movements[c].rv].pieceMami.weight;
                        mi = c;
                        console.log('firstKill.validFirstKills: %o', validFirstKills[movements[c].rv]);//*******
                    }else if(movements[c].action == 'fightBack' &&movements[c].actWeight <= tmpWeight 
                        && !validMovements[movements[c].rv].targetMami.isCovered){
                        fightBack = true;
                        firstKill = false;
                        tmpWeight = movements[c].actWeight;
                        mi = c;
                        console.log('fightBack.validMovements: %o', validMovements[movements[c].rv]);//*******
                    }else if(movements[c].action == 'escape' &&(validEscapes[movements[c].rv].pieceMami.weight < tmpWeight 
                        || validEscapes[movements[c].rv].pieceMami.weight == tmpWeight&&firstKill&&validFirstKills[movements[mi].rv].targetMami.isCovered
                            && validFirstKills[movements[mi].rv].pieceMami.weight<validFirstKills[movements[mi].rv].targetMami.weight
                        || validEscapes[movements[c].rv].pieceMami.weight == tmpWeight&&fightBack&&validMovements[movements[mi].rv].targetMami.isCovered
                            && validMovements[movements[mi].rv].pieceMami.weight<validMovements[movements[mi].rv].targetMami.weight)){
                        tmpWeight = validEscapes[movements[c].rv].pieceMami.weight;
                        mi = c;
                        console.log('escape.validEscapes: %o', validEscapes[movements[c].rv]);//*******
                    }
                }

                if(tmpWeight == 100){
                    for(var c=0;c<movements.length;c++){
                        if(movements[c].action == 'normalKill' &&validMovements[movements[c].rv].targetMami.weight <= tmpWeight){
                            tmpWeight = validMovements[movements[c].rv].targetMami.weight;
                            mi = c;
                            console.log('normalKill.validMovements: %o', validMovements[movements[c].rv]);//*******
                        }
                    }
                    if( tmpWeight < 100 &&validMovements[movements[mi].rv].targetMami.isCovered 
                        && validMovements[movements[mi].rv].targetMami.weight>=validMovements[movements[mi].rv].pieceMami.weight ){
                        tmpWeight = 100;
                    }
                }

                if(tmpWeight < 100){
                    if(movements[mi].action == 'escape'){
                        console.log('AI decide to escape.');//******
                        piece = validEscapes[movements[mi].rv].pieceMami;
                        target = validEscapes[movements[mi].rv].targetMami;
                    }else if(movements[mi].action == 'firstKill'){
                        console.log('AI decide to firstKill.');//******
                        piece = validFirstKills[movements[mi].rv].pieceMami;
                        target = validFirstKills[movements[mi].rv].targetMami;
                    }else if(movements[mi].action == 'fightBack' || movements[mi].action == 'normalKill'){
                        console.log('AI decide to fightBack or normalKill.');//******
                        piece = validMovements[movements[mi].rv].pieceMami;
                        target = validMovements[movements[mi].rv].targetMami;
                    }
    
                    if(this.superJiang&&piece.name == '将'){
                        console.log('AI:start to change the step method for jiang.');//******
                        this.superJiang = false;
                        piece.canMoveTo = jiangNormal;
                        piece.weight = 6;
                    }
    
                    console.log('电脑的' + this.camp+piece.name + ' KO ' +target.camp+target.name);//*******
                    piece.moveTo(target);
                    resp.json({
                        action:'kill',
                        killer:piece,
                        killed:target
                    });
                    return;
                }
                
            }//for valid movements
        }

        // 走动失败，随机（或有选择的，依据难度不同）翻开棋子或freeWalk。
        
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
    
        var doDiscover = false;
        if(undiscovered.length > 0 && (freeWalk.length==0 || randomInt(9)<6)){
            doDiscover = true;
        }
        if(doDiscover){
            if (undiscovered.length > 0) {
                console.log('start to discover a cell by AI.');//**********
                var toBeDiscovered = undiscovered[randomInt(undiscovered.length-1)];
                console.log('电脑翻开了 ' + toBeDiscovered.camp + ' ' + toBeDiscovered.name);//*******
                toBeDiscovered.hidden = false;
                resp.json({
                    action:'discover',
                    cell:toBeDiscovered
                });
                return;
            }
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
            console.log('电脑认输');//*******
            resp.json({
                action:'finished',
            });
        } else if (restPieces.length > 0 && restEnemies.length == 0){
            console.log('Human 输了！');//*******
            resp.json({
                action:'finished',
            });
        }else {
            console.log('电脑 freeWalk');//*******
            if (freeWalk.length > 0) {
            	// for(var i=0;i<freeWalk.length;i++){
            	// 	for(var j=0;j<freeWalkOpp.length;j++){
            	// 		if(freeWalk[i].targetMami.x==freeWalkOpp[j].targetMami.x && freeWalk[i].targetMami.y==freeWalkOpp[j].targetMami.y){
            	// 			freeWalk[i].danger = true;
            	// 		}
            	// 	}
            	// }

                var rv = randomInt(freeWalk.length-1);
                var conut = 20;
                while(conut-- >0&&freeWalk[rv].danger){
                	rv = randomInt(freeWalk.length-1);
                	console.log('AI random safe freeWalk: rv&freeWalk[rv].danger:'+rv+':'+freeWalk[rv].danger);//*******
                }

                if(!freeWalk[rv].danger){
                    var piece = freeWalk[rv].pieceMami;
                    var target = freeWalk[rv].targetMami;
                    console.log('AI does safe freeWalk, freeWalk[rv].danger:'+freeWalk[rv].danger);//*****
            
                    if(this.superJiang&&piece.name == '将'){
                        console.log('AI:start to change the step method for jiang.');//******
                        this.superJiang = false;
                        piece.canMoveTo = jiangNormal;
                        piece.weight = 6;
                    }
                    console.log('电脑的' + this.camp+piece.name + ' freeWalk to ' +target.camp+target.name);//*******
                    piece.moveTo(target);
                    resp.json({
                        action:'kill',
                        killer:piece,
                        killed:target
                    });
                    return;
                }
            }
            console.log('电脑 pass 一步');//*******
            resp.json({
            	action:'pass',
            });
            
        }
    };
}//object 'AIPlayer'

function humanPlayer(){
    this.selectedAlly = undefined;
    this.camp= undefined;
    this.superJiang = true;

    this.play= function(e) {
        console.log('enter humanPlayer.play');//******
        //console.log('global.gameX:%o',global.gameX);//******
        
        var requ = e.req;
        var resp = e.res;
        var cellpos = {x:e.posx ,y:e.posy};
        
        var gameId = requ.session.gameId;
        var gameX = global.gameX[gameId];

        var playerX = gameX.playerX;
        var playerY = gameX.playerY;
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
        } else {//when this.selectedAlly != undefined
            var selected = this.selectedAlly;
            if (cell.name == EMPTY_NAME) {
                var result = tryMovePiece(resp, this.superJiang, cell, board);
                if(result.okToMove){
                    this.selectedAlly = undefined;
                    if(this.superJiang){
                        this.superJiang = result.jsc;
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
                    var result = tryMovePiece(resp, this.superJiang, cell, board);
                    if(result.okToMove){
                        this.selectedAlly = undefined;
                        if(this.superJiang){
                            this.superJiang = result.jsc;
                        }
                    }
                    return;
                }
            }
        }

        function tryMovePiece(resp, superJiang, targetMami, cboard) {
            var cboard = cboard;
            var okToMove = false;
            var jsc = superJiang;
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

    //console.log('route.play:global.gameX:%o',global.gameX[gameId]);//*********

    if(req.body.playMode == "humanAI"){
        if(req.session.refresh!=undefined&&req.session.refresh==gameId){
            console.log('start to init players.');//*******
            req.session.refresh = undefined;
            global.gameX[gameId].playerX = new humanPlayer;
            global.gameX[gameId].playerY = new AIPlayer;
        }
        //console.log('play:humanPlayer1:%o',global.gameX[gameId].playerX);//*********

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
