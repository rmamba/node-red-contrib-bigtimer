const randomInt = require('../helpers/randomInt');

test('random number is always between set values', () => {
    const results = [];
    for (i = 0; i<1000; i++) {
        results.push(randomInt(10, 100));
    }
    expect(Math.min(...results)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...results)).toBeLessThan(100);
});