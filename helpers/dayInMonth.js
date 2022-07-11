module.exports = function (date, dayInWeek, weekInMonth) { // date, dayInWeek (1-7) week of the month (1-5)
    if (weekInMonth > 0) {
        return((Math.ceil((date.day) / 7) === weekInMonth) && (date.weekday === dayInWeek));
    } else {
        var last = new Date(date.year, date.month + 1, 0);
        return(Math.ceil(last.day / 7) === Math.ceil(date.day / 7) && (date.weekday == dayInWeek));
    }
}