const { DateTime } = require("luxon");

/**
 * @param {Date} date JS UTC Date input object
 * @param {string} tz Timezone string
 * @param {number} defaultValue Returns this value if input object is empty
 * @returns Number of minutes since midnight in specified timezone
 */
 module.exports = function (date, tz, defaultValue = null) {
    if (!date) {
        return defaultValue;
    }
    const luxonTime = DateTime.fromJSDate(date, {
        zone: 'UTC'
    }).setZone(tz);
    return luxonTime.hour * 60 + luxonTime.minute;
}