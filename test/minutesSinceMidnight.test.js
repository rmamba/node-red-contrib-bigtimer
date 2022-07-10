const minutesSinceMidnight = require('../helpers/minutesSinceMidnight');

test('return corrent minutes since midnight', () => {
    const d = new Date(2022, 7, 10, 7, 46, 31, 4);
    expect(minutesSinceMidnight(d)).toBe(466);
});