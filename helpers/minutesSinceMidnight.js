const { DateTime } = require("luxon");

/**
     * @param {DateTime} dateTime JS DateTime input object
     * @param {string} tz Timezone string
     * @param {number} defaultValue Returns this value if input object is empty
     * @returns Number of minutes since midnight in specified timezone
     */
 module.exports = function (dateTime, tz, defaultValue = null) {
    if (!dateTime) {
        return defaultValue;
    }
    const luxonTime = DateTime.fromJSDate(dateTime, {
        zone: tz
    });
    return luxonTime.hour * 60 + luxonTime.minute;
}