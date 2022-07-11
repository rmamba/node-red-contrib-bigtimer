module.exports = function (low, high) {
    var m = Math.floor(Math.random() * (Math.abs(high) - low) + low);
    if (high <= 0) {
        return - m;
    } else { 
        return m;
    }
}