import { defaultDisplayUnit, showLength } from './show-length.calc';

const exactly = (text: string): unknown => ({ text, approximate: false });
const approximately = (text: string): unknown => ({ text, approximate: true });

describe('showLength', () => {
  describe('metric units', () => {
    it.each([
      // Millimetres show up to 1 decimal.
      { millimetres: 89, unit: 'mm', language: 'en', expected: exactly('89 mm') },
      { millimetres: 88.9, unit: 'mm', language: 'en', expected: exactly('88.9 mm') },
      { millimetres: 88.9, unit: 'mm', language: 'es', expected: exactly('88,9 mm') },
      { millimetres: 12.34, unit: 'mm', language: 'en', expected: approximately('≈ 12.3 mm') },
      { millimetres: 12.36, unit: 'mm', language: 'es', expected: approximately('≈ 12,4 mm') },
      { millimetres: 2440, unit: 'mm', language: 'en', expected: exactly('2440 mm') },
      { millimetres: 2440, unit: 'mm', language: 'es', expected: exactly('2440 mm') },
      { millimetres: 0, unit: 'mm', language: 'en', expected: exactly('0 mm') },
      { millimetres: -88.9, unit: 'mm', language: 'en', expected: exactly('-88.9 mm') },
      { millimetres: -0.01, unit: 'mm', language: 'en', expected: approximately('≈ 0 mm') },
      // Centimetres show up to 2 decimals, without trailing zeros.
      { millimetres: 88.9, unit: 'cm', language: 'en', expected: exactly('8.89 cm') },
      { millimetres: 88.9, unit: 'cm', language: 'es', expected: exactly('8,89 cm') },
      { millimetres: 89, unit: 'cm', language: 'en', expected: exactly('8.9 cm') },
      { millimetres: 100, unit: 'cm', language: 'es', expected: exactly('10 cm') },
      { millimetres: 88.94, unit: 'cm', language: 'en', expected: approximately('≈ 8.89 cm') },
      { millimetres: 0.06, unit: 'cm', language: 'es', expected: approximately('≈ 0,01 cm') },
      // Metres show up to 3 decimals, without trailing zeros.
      { millimetres: 2440, unit: 'm', language: 'en', expected: exactly('2.44 m') },
      { millimetres: 2440, unit: 'm', language: 'es', expected: exactly('2,44 m') },
      { millimetres: 89, unit: 'm', language: 'en', expected: exactly('0.089 m') },
      { millimetres: 89, unit: 'm', language: 'es', expected: exactly('0,089 m') },
      { millimetres: 2000, unit: 'm', language: 'en', expected: exactly('2 m') },
      { millimetres: 1234.4, unit: 'm', language: 'en', expected: approximately('≈ 1.234 m') },
      { millimetres: 1234.6, unit: 'm', language: 'es', expected: approximately('≈ 1,235 m') },
    ] as const)(
      'shows $millimetres mm in $unit ($language) as $expected',
      ({ millimetres, unit, language, expected }) => {
        // Imperial precision has no effect on metric units.
        expect(showLength(millimetres, unit, { precision: 8, language })).toEqual(expected);
        expect(showLength(millimetres, unit, { precision: 64, language })).toEqual(expected);
      },
    );
  });

  describe('feet and inches', () => {
    it.each([
      // Worked example from the spec, read back.
      [1936.75, 16, exactly(`6' 4 1/4"`)],
      [1930.4, 16, exactly(`6' 4"`)],
      [317.5, 16, exactly(`1' 1/2"`)],
      // Whole feet carry no inches.
      [1828.8, 16, exactly(`6'`)],
      [304.7, 16, approximately(`≈ 1'`)],
      // Lengths below one foot carry no leading zero feet.
      [101.6, 16, exactly('4"')],
      [12.7, 16, exactly('1/2"')],
      [100, 32, approximately('≈ 3 15/16"')],
      [0, 16, exactly('0"')],
      // Every precision (2440 mm = 96.063").
      [2440, 8, approximately(`≈ 8' 1/8"`)],
      [2440, 16, approximately(`≈ 8' 1/16"`)],
      [2440, 32, approximately(`≈ 8' 1/16"`)],
      [2440, 64, approximately(`≈ 8' 1/16"`)],
      [-1936.75, 16, exactly(`-6' 4 1/4"`)],
    ] as const)('shows %d mm at 1/%d as %o', (millimetres, precision, expected) => {
      expect(showLength(millimetres, 'feet-and-inches', { precision, language: 'en' })).toEqual(
        expected,
      );
      expect(showLength(millimetres, 'feet-and-inches', { precision, language: 'es' })).toEqual(
        expected,
      );
    });
  });

  describe('decimal inches', () => {
    it.each([
      // Decimal inches show up to 3 decimals, without trailing zeros.
      [88.9, 'en', exactly('3.5"')],
      [88.9, 'es', exactly('3,5"')],
      [25.4, 'en', exactly('1"')],
      [3.175, 'en', exactly('0.125"')],
      [3.175, 'es', exactly('0,125"')],
      [89, 'en', approximately('≈ 3.504"')],
      [89, 'es', approximately('≈ 3,504"')],
      [0.396875, 'en', approximately('≈ 0.016"')],
      [0, 'en', exactly('0"')],
      [-89, 'en', approximately('≈ -3.504"')],
    ] as const)('shows %d mm (%s) as %o', (millimetres, language, expected) => {
      // Imperial precision only applies to fractions.
      expect(showLength(millimetres, 'decimal-inches', { precision: 8, language })).toEqual(
        expected,
      );
      expect(showLength(millimetres, 'decimal-inches', { precision: 64, language })).toEqual(
        expected,
      );
    });
  });

  describe('fractional inches', () => {
    it.each([
      // Every precision, on a value that rounds differently at each one (10 mm = 0.3937").
      [10, 8, approximately('≈ 3/8"')],
      [10, 16, approximately('≈ 3/8"')],
      [10, 32, approximately('≈ 13/32"')],
      [10, 64, approximately('≈ 25/64"')],
      [100, 8, approximately('≈ 3 7/8"')],
      [100, 16, approximately('≈ 3 15/16"')],
      // The finest fraction of each precision is exact.
      [3.175, 8, exactly('1/8"')],
      [1.5875, 16, exactly('1/16"')],
      [0.79375, 32, exactly('1/32"')],
      [0.396875, 64, exactly('1/64"')],
      [1.190625, 64, exactly('3/64"')],
      // Fractions are reduced.
      [88.9, 64, exactly('3 1/2"')],
      [88.9, 8, exactly('3 1/2"')],
      [161.925, 64, exactly('6 3/8"')],
      [19.05, 32, exactly('3/4"')],
      // Whole values carry no fraction.
      [152.4, 16, exactly('6"')],
      [101.5, 16, approximately('≈ 4"')],
      [2440, 16, approximately('≈ 96 1/16"')],
      // Values below one inch carry no leading zero.
      [12.7, 16, exactly('1/2"')],
      [0, 16, exactly('0"')],
      [1.190625, 8, approximately('≈ 0"')],
      // Negative lengths keep their sign, except when they round to zero.
      [-88.9, 16, exactly('-3 1/2"')],
      [-12.7, 16, exactly('-1/2"')],
      [-0.1, 16, approximately('≈ 0"')],
    ] as const)('shows %d mm at 1/%d as %o', (millimetres, precision, expected) => {
      expect(showLength(millimetres, 'fractional-inches', { precision, language: 'en' })).toEqual(
        expected,
      );
      expect(showLength(millimetres, 'fractional-inches', { precision, language: 'es' })).toEqual(
        expected,
      );
    });
  });

  describe('worked examples from the spec', () => {
    it('shows 89 mm as fractional inches at 1/16 as approximately 3 1/2"', () => {
      expect(showLength(89, 'fractional-inches', { precision: 16, language: 'en' })).toEqual({
        text: '≈ 3 1/2"',
        approximate: true,
      });
    });

    it('shows 25.4 mm as exactly 1"', () => {
      expect(showLength(25.4, 'fractional-inches', { precision: 16, language: 'en' })).toEqual({
        text: '1"',
        approximate: false,
      });
    });
  });
});

describe('defaultDisplayUnit', () => {
  it.each([
    ['metric', 'mm'],
    ['imperial', 'fractional-inches'],
  ] as const)('shows %s lengths in %s by default', (unitSystem, unit) => {
    expect(defaultDisplayUnit(unitSystem)).toBe(unit);
  });
});
