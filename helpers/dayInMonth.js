module.exports = function (date, dayInWeek, weekInMonth) { // date, dayInWeek (1-7) week of the month (1-5)
    if (weekInMonth > 0) {
        return((Math.ceil((date.getDate()) / 7) === weekInMonth) && (date.getDay() === dayInWeek - 1));
    } else {
        var last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return(Math.ceil(last.getDate() / 7) === Math.ceil(date.getDate() / 7) && (date.getDay() == dayInWeek - 1));
    }
}