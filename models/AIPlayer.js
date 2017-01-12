	var EMPTY_NAME = '空';

	function randomInt(max){
        var rvalue = Math.floor( Math.random()*max );
        console.log('randomInt value:'+ rvalue);//*******
        return rvalue;
    }

    // AIPlayer 的难度依据 AI 是否知晓盘面全局（未翻开的棋子）划分。
        camp = undefined;
        function testCouldMove(pieceMami, targetMami) {
            return piece.canMoveTo(target);
        }

        function play(e){
            // 电脑检测有无已翻开的己方棋子并尝试走动。
            var requ = e.req;
            var resp = e.res;
            var gameId = requ.session.gameId;
            var board = global.board[gameId];
            var rangeX = requ.session.board.columnsCount;
            var rangeY = requ.session.board.rowsCount-1;
            var candidates = [];
            var targets = [];
            var validMovements = [];

            console.log('entr AIPlayer.play ,board[0][0] is: %o' ,board[0][0]);//***********

            var count1=count2=0;
            for (var i = rangeY - 1; i >= 0; i--) {//row number
                for(var j=0;j<rangeX;j++){//column number
                    //console.log('for AI candi&target ,current cell discoverd:%o',board[i][j]);//*******
                    if(!board[i][j].hidden && board[i][j].name!=EMPTY_NAME ){
                        if(board[i][j].camp==this.camp){
                            candidates.push(board[i][j]);
                        }else{
                            targets.push(board[i][j]);
                        }
                    }
                }
            };

            //console.log('AIPlayer.candidates is: %o',candidates);//*************
            //console.log('AIPlayer.targets is: %o',targets);//************

            for (var i = 0; i < candidates.length; i++) {
                var candCell = candidates[i];

                for (var j = 0; j < targets.length; j++) {
                    var tarCell = targets[j];

                    if (candCell.canMoveTo(tarCell)) {
                        validMovements.push({pieceMami:candCell, targetMami:tarCell});
                    }
                }
            }
            if (validMovements.length > 0) {
                var piece = validMovements[0].pieceMami;
                var target = validMovements[0].targetMami;
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
            console.log('ai.undiscovered length: %o',undiscovered.length);//***********

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
            } else {
                console.log('电脑 Pass 一步');
                resp.json({
                    action:'pass',
                });
            }
        }

exports.aiPlay = play;