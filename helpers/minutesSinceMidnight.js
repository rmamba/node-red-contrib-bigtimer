module.exports = function (dateTime, defaultValue = null) {
    if (!dateTime) {
        return defaultValue;
    }
    return (dateTime.getHours() * 60) + dateTime.getMinutes();
}