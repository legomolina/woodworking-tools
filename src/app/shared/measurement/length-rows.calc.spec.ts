import { lengthRows } from './length-rows.calc';

describe('lengthRows', () => {
  it('lists the Metric units first for the Metric Unit System', () => {
    const rows = lengthRows(25.4, { unitSystem: 'metric', precision: 16, language: 'en' });

    expect(rows.map((row) => row.unit)).toEqual([
      'mm',
      'cm',
      'm',
      'fractional-inches',
      'feet-and-inches',
      'decimal-inches',
    ]);
  });

  it('lists the Imperial units first for the Imperial Unit System', () => {
    const rows = lengthRows(25.4, { unitSystem: 'imperial', precision: 16, language: 'en' });

    expect(rows.map((row) => row.unit)).toEqual([
      'fractional-inches',
      'feet-and-inches',
      'decimal-inches',
      'mm',
      'cm',
      'm',
    ]);
  });

  it('shows one inch in every unit', () => {
    const rows = lengthRows(25.4, { unitSystem: 'metric', precision: 16, language: 'en' });

    expect(rows.map(({ text, approximate }) => ({ text, approximate }))).toEqual([
      { text: '25.4 mm', approximate: false },
      { text: '2.54 cm', approximate: false },
      { text: '≈ 0.025 m', approximate: true },
      { text: '1"', approximate: false },
      { text: '1"', approximate: false },
      { text: '1"', approximate: false },
    ]);
  });

  it.each([
    { precision: 8 as const, expected: '≈ 1/2"' },
    { precision: 16 as const, expected: '≈ 9/16"' },
  ])('rounds Imperial lengths to 1/$precision"', ({ precision, expected }) => {
    const rows = lengthRows(14, { unitSystem: 'imperial', precision, language: 'en' });

    expect(rows[0]).toEqual({ unit: 'fractional-inches', text: expected, approximate: true });
  });

  it('formats numbers in the given language', () => {
    const rows = lengthRows(25.4, { unitSystem: 'metric', precision: 16, language: 'es' });

    expect(rows[1]?.text).toBe('2,54 cm');
  });
});
