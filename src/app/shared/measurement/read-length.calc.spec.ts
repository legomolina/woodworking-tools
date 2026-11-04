import { readLength } from './read-length.calc';

/** Matches a successful read, tolerating floating-point noise from unit conversion. */
function readAs(millimetres: number): unknown {
  const closeToExpected: unknown = expect.closeTo(millimetres, 9);
  return { ok: true, millimetres: closeToExpected };
}

/** 400 digits: past the largest number JavaScript can hold (about 1.8e308). */
const TOO_LARGE = '9'.repeat(400);

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
      // Large but finite lengths still read normally.
      ['100000 mm', 100000],
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
      ['100000"', 2540000],
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

  describe('negative lengths', () => {
    // No woodworking length is negative: they are rejected with their own error kind.
    it.each([
      '-5',
      '-89 mm',
      '-2 cm',
      '-8,9 cm',
      '-0.5 m',
      '-0.0001 mm',
      '-3 1/2"',
      '-3-1/2"',
      '-1/2 in',
      '-3.5"',
      '- 3 1/2"',
      `-6' 4"`,
      `-6' 4 1/4"`,
      '-6 ft',
      '  -6 ft 4 in  ',
    ])('rejects %j as negative under either Unit System', (text) => {
      expect(readLength(text, 'metric')).toEqual({ ok: false, error: 'negative' });
      expect(readLength(text, 'imperial')).toEqual({ ok: false, error: 'negative' });
    });

    it.each(['-5', '-3 1/2', '- 3-1/2', '-1/2'])(
      'rejects the bare number %j under Imperial',
      (text) => {
        expect(readLength(text, 'imperial')).toEqual({ ok: false, error: 'negative' });
      },
    );

    it.each(['-', '-abc', '--5', '-5 apples', '-1/0"', `-${TOO_LARGE}`])(
      'leaves %j unreadable: a sign in front of something that is not a length',
      (text) => {
        expect(readLength(text, 'metric')).toEqual({ ok: false, error: 'unreadable' });
        expect(readLength(text, 'imperial')).toEqual({ ok: false, error: 'unreadable' });
      },
    );
  });

  describe('zero', () => {
    it.each([
      '0 mm',
      '0 cm',
      '0 m',
      '0"',
      '0 in',
      '0/4"',
      `0'`,
      `0' 0"`,
      '0 ft 0 in',
      '-0',
      '-0 mm',
      '-0"',
      `-0' 0"`,
    ])('reads %j as 0 mm under either Unit System', (text) => {
      expect(readLength(text, 'metric')).toEqual(readAs(0));
      expect(readLength(text, 'imperial')).toEqual(readAs(0));
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

    describe('numbers too large to hold', () => {
      // TOO_LARGE is labelled `N` in the names so they stay readable.
      it.each([
        ['N mm', 'metric', `${TOO_LARGE} mm`],
        ['N mm', 'imperial', `${TOO_LARGE} mm`],
        ['N cm', 'metric', `${TOO_LARGE} cm`],
        ['N cm', 'imperial', `${TOO_LARGE} cm`],
        // 10^306 m is a finite number, but 10^309 mm is not.
        ['10^306 m', 'metric', `1${'0'.repeat(306)} m`],
        ['10^306 m', 'imperial', `1${'0'.repeat(306)} m`],
        ['N"', 'metric', `${TOO_LARGE}"`],
        ['N"', 'imperial', `${TOO_LARGE}"`],
        ['N in', 'metric', `${TOO_LARGE} in`],
        ['N in', 'imperial', `${TOO_LARGE} in`],
        ['N 1/2"', 'metric', `${TOO_LARGE} 1/2"`],
        ['N 1/2"', 'imperial', `${TOO_LARGE} 1/2"`],
        ['N/2"', 'metric', `${TOO_LARGE}/2"`],
        ['N/2"', 'imperial', `${TOO_LARGE}/2"`],
        // Not an overflow but NaN (Infinity / Infinity): still not a length.
        ['N/N"', 'metric', `${TOO_LARGE}/${TOO_LARGE}"`],
        ['N/N"', 'imperial', `${TOO_LARGE}/${TOO_LARGE}"`],
        // Finite as typed, but too large once converted to millimetres.
        ['10^307"', 'metric', `1${'0'.repeat(307)}"`],
        ['10^307"', 'imperial', `1${'0'.repeat(307)}"`],
        ['10^306 ft', 'metric', `1${'0'.repeat(306)} ft`],
        ['10^306 ft', 'imperial', `1${'0'.repeat(306)} ft`],
        // Feet and inches each finite in millimetres, but not their sum.
        [`5×10^305' 5×10^306"`, 'metric', `5${'0'.repeat(305)}' 5${'0'.repeat(306)}"`],
        [`5×10^305' 5×10^306"`, 'imperial', `5${'0'.repeat(305)}' 5${'0'.repeat(306)}"`],
        ['N ft', 'metric', `${TOO_LARGE} ft`],
        ['N ft', 'imperial', `${TOO_LARGE} ft`],
        [`N' 4"`, 'metric', `${TOO_LARGE}' 4"`],
        [`N' 4"`, 'imperial', `${TOO_LARGE}' 4"`],
        [`6' N"`, 'metric', `6' ${TOO_LARGE}"`],
        [`6' N"`, 'imperial', `6' ${TOO_LARGE}"`],
        [`N' 4 1/2"`, 'metric', `${TOO_LARGE}' 4 1/2"`],
        [`N' 4 1/2"`, 'imperial', `${TOO_LARGE}' 4 1/2"`],
        ['N', 'metric', TOO_LARGE],
        ['N', 'imperial', TOO_LARGE],
        ['N 1/2', 'imperial', `${TOO_LARGE} 1/2`],
        ['-N mm', 'metric', `-${TOO_LARGE} mm`],
        ['-N', 'imperial', `-${TOO_LARGE}`],
      ] as const)('returns unreadable for %s under %s', (_label, unitSystem, text) => {
        expect(readLength(text, unitSystem)).toEqual({ ok: false, error: 'unreadable' });
      });

      // Only lengths that do not fit are rejected, not merely huge ones.
      it.each(['metric', 'imperial'] as const)(
        'reads 10^305 m (10^308 mm) under %s',
        (unitSystem) => {
          expect(readLength(`1${'0'.repeat(305)} m`, unitSystem)).toEqual({
            ok: true,
            millimetres: 1e308,
          });
        },
      );
    });
  });
});
