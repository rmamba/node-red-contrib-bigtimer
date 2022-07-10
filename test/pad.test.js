const pad = require('../helpers/pad');

test('pad string to length', () => {
    expect(pad('123', 8)).toBe('00000123');
});

test('pad string to length with custom character', () => {
    expect(pad('123', 8, 'x')).toBe('xxxxx123');
});