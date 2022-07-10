const minutesSinceMidnight = require('../helpers/minutesSinceMidnight');

test('udefined', () => {
    expect(minutesSinceMidnight(undefined)).toBe(null);
});

test('udefined with default value', () => {
    expect(minutesSinceMidnight(undefined, 1440)).toBe(1440);
});

test('return corrent minutes since midnight', () => {
    const d = new Date(2022, 7, 10, 7, 46, 31, 4);
    expect(minutesSinceMidnight(d)).toBe(466);
});