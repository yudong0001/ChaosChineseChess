var RED = 'red';
var BLACK = 'black';

var assignCamp= function (firstCamp, player1, player2) {
    if (firstCamp == RED) {
        console.log('assign red to firstCamp.');//***********
        player1.camp = firstCamp;
        player2.camp = BLACK;
    } else if (firstCamp == BLACK) {
        console.log('assign black to firstCamp.');//***********
        player1.camp = firstCamp;
        player2.camp = RED;
    }
};

var getEnemy = function(allyCamp) {
    if (allyCamp == RED) {
        return BLACK;
    } else if (allyCamp == BLACK) {
        return RED;
    }
};

exports.assignCamp = assignCamp;
exports.getEnemy = getEnemy;