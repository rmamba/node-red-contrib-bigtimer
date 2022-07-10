module.exports = function (dateTime) {
    return (dateTime.getHours() * 60) + dateTime.getMinutes();
}