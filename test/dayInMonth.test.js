const dayInMonth = require('../helpers/dayInMonth');

test('check day in month', () => {
    let d = new Date(Date.UTC(2022, 7, 30, 7, 46, 31, 4));
    expect(dayInMonth(d, 1, 0)).toBe(false);
    expect(dayInMonth(d, 2, 0)).toBe(false);
    expect(dayInMonth(d, 3, 0)).toBe(true);
    expect(dayInMonth(d, 4, 0)).toBe(false);
    expect(dayInMonth(d, 5, 0)).toBe(false);
    expect(dayInMonth(d, 6, 0)).toBe(false);
    expect(dayInMonth(d, 7, 0)).toBe(false);

    d = new Date(Date.UTC(2022, 7, 10, 7, 46, 31, 4));
    expect(dayInMonth(d, 1, 2)).toBe(false);
    expect(dayInMonth(d, 2, 2)).toBe(false);
    expect(dayInMonth(d, 3, 2)).toBe(false);
    expect(dayInMonth(d, 4, 2)).toBe(true);
    expect(dayInMonth(d, 5, 2)).toBe(false);
    expect(dayInMonth(d, 6, 2)).toBe(false);
    expect(dayInMonth(d, 7, 2)).toBe(false);
});