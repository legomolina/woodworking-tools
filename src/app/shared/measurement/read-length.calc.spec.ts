import { readLength } from './read-length.calc';

/** Matches a successful read, tolerating floating-point noise from unit conversion. */
function readAs(millimetres: number): unknown {
  const closeToExpected: unknown = expect.closeTo(millimetres, 9);
  return { ok: true, millimetres: closeToExpected };
}

describe('readLength', () => {
  describe('metric units', () => {
    it.each([
      ['89 mm', 89],
      ['89mm', 89],
      ['8.9cm', 89],
      ['8,9 cm', 89],
      ['0.089 m', 89],
      ['0,089m', 89],
      ['2 m', 2000],
      ['12.5 mm', 12.5],
      ['89 MM', 89],
      ['8.9 Cm', 89],
      ['2 M', 2000],
      ['  89   mm  ', 89],
    ])('reads %j as %d mm under either Unit System', (text, millimetres) => {
      expect(readLength(text, 'metric')).toEqual(readAs(millimetres));
      expect(readLength(text, 'imperial')).toEqual(readAs(millimetres));
    });
  });

  describe('inches', () => {
    it.each([
      // Worked example from the spec.
      ['3 1/2"', 88.9],
      ['3-1/2"', 88.9],
      ['3 - 1/2"', 88.9],
      ['1/2 in', 12.7],
      ['1/2"', 12.7],
      ['5/4"', 31.75],
      ['3.5"', 88.9],
      ['3.5in', 88.9],
      ['3,5 in', 88.9],
      ['1"', 25.4],
      ['3 1/2 IN', 88.9],
      // Typographic marks inserted by phone keyboards and word processors.
      ['3 1/2”', 88.9],
      ['3 1/2″', 88.9],
      ['  3   1/2  "  ', 88.9],
    ])('reads %j as %d mm under either Unit System', (text, millimetres) => {
      expect(readLength(text, 'metric')).toEqual(readAs(millimetres));
      expect(readLength(text, 'imperial')).toEqual(readAs(millimetres));
    });
  });

  describe('feet and inches', () => {
    it.each([
      // Worked example from the spec.
      [`6' 4 1/4"`, 1936.75],
      ['6ft 4in', 1930.4],
      [`6'`, 1828.8],
      ['6 ft', 1828.8],
      [`6'4"`, 1930.4],
      [`6' 4`, 1930.4],
      [`1' 1/2"`, 317.5],
      [`6'-4 1/4"`, 1936.75],
      [`6' 3.5"`, 1917.7],
      ['6 FT 4 IN', 1930.4],
      ['6ft 4"', 1930.4],
      [`6' 4in`, 1930.4],
      [`1.5'`, 457.2],
      ['6,5 ft', 1981.2],
      ['6’ 4 1/4”', 1936.75],
      ['6′ 4 1/4″', 1936.75],
      [`  6 '  4  1/4  "  `, 1936.75],
    ])('reads %j as %d mm under either Unit System', (text, millimetres) => {
      expect(readLength(text, 'metric')).toEqual(readAs(millimetres));
      expect(readLength(text, 'imperial')).toEqual(readAs(millimetres));
    });
  });

  describe('sign', () => {
    // Sign validation is the caller's job, so negative lengths must be read, not rejected.
    it.each([
      ['-89', 'metric', -89],
      ['-8,9 cm', 'imperial', -89],
      ['-3 1/2"', 'metric', -88.9],
      ['- 3-1/2', 'imperial', -88.9],
      [`-6' 4 1/4"`, 'metric', -1936.75],
    ] as const)('reads %j under %s as %d mm', (text, unitSystem, millimetres) => {
      expect(readLength(text, unitSystem)).toEqual(readAs(millimetres));
    });
  });

  describe('bare numbers', () => {
    it.each([
      ['1', 25.4],
      ['3.5', 88.9],
      ['3,5', 88.9],
      ['3 1/2', 88.9],
      ['1/2', 12.7],
      // Zero is readable: range validation is the caller's job.
      ['0', 0],
    ])('reads %j under Imperial as inches (%d mm)', (text, millimetres) => {
      expect(readLength(text, 'imperial')).toEqual(readAs(millimetres));
    });

    it.each([
      ['89', 89],
      ['0', 0],
      ['12.5', 12.5],
      ['12,5', 12.5],
      [' 89 ', 89],
    ])('reads %j under Metric as %d mm', (text, millimetres) => {
      expect(readLength(text, 'metric')).toEqual(readAs(millimetres));
    });
  });

  describe('errors', () => {
    it.each([
      ['', 'metric'],
      ['   ', 'metric'],
      ['\t \n', 'imperial'],
    ] as const)('returns empty for %j under %s', (text, unitSystem) => {
      expect(readLength(text, unitSystem)).toEqual({ ok: false, error: 'empty' });
    });

    it.each([
      ['abc', 'metric'],
      ['abc', 'imperial'],
      ['5 kg', 'metric'],
      ['5 kg', 'imperial'],
      ['3 1/0"', 'metric'],
      ['3 1/0"', 'imperial'],
      ['1/0', 'imperial'],
      ['1/2 mm', 'metric'],
      ['3 1/2 cm', 'imperial'],
      // Fractions are an Imperial notation: a bare fraction is not millimetres.
      ['3 1/2', 'metric'],
      ['1/2', 'metric'],
      ['3..5"', 'imperial'],
      ['3 mm mm', 'metric'],
      [`6' 4 1/0"`, 'imperial'],
      [`4" 6'`, 'imperial'],
      [`6' 4 mm`, 'metric'],
      [`6' 4' `, 'imperial'],
      ['-', 'metric'],
      ['--5', 'metric'],
    ] as const)('returns unreadable for %j under %s', (text, unitSystem) => {
      expect(readLength(text, unitSystem)).toEqual({ ok: false, error: 'unreadable' });
    });
  });
});
