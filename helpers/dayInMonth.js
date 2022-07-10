module.exports = function (date, dayInWeek, weekInMonth) { // date, dayInWeek (1-7) week of the month (1-5)
    if (weekInMonth > 0) {
        return((Math.ceil((date.getUTCDate()) / 7) === weekInMonth) && (date.getUTCDay() === dayInWeek - 1));
    } else {
        var last = new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
        return(Math.ceil(last.getUTCDate() / 7) === Math.ceil(date.getUTCDate() / 7) && (date.getUTCDay() == dayInWeek - 1));
    }
}