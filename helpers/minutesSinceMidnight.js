module.exports = function (dateTime, defaultValue = null) {
    if (!dateTime) {
        return defaultValue;
    }
    return (dateTime.getUTCHours() * 60) + dateTime.getUTCMinutes();
}