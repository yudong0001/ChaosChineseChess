const RED = 'red';
const BLACK = 'black';
var assignCamp= function (firstCamp, player1, player2) {
    if (firstCamp == this.RED) {
        player1.camp = firstCamp;
        player2.camp = this.BLACK;
    } else if (firstCamp == this.BLACK) {
        player1.camp = firstCamp;
        player2.camp = this.RED;
    }
};
var getEnemy = function(allyCamp) {
    if (allyCamp == this.RED) {
        return this.BLACK;
    } else if (allyCamp == this.BLACK) {
        return this.RED;
    }
};

exports.assignCamp = assignCamp;
exports.getEnemy = getEnemy;