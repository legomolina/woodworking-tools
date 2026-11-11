import { readFencePositionForm } from './fence-position-form.calc';
import type { FencePositionFormResult, FencePositionFormTexts } from './fence-position-form.calc';

const VALID: FencePositionFormTexts = {
  bevelAngle: '45',
  thickness: '19',
  length: '300',
  givenFace: 'long',
};

function read(
  texts: Partial<FencePositionFormTexts>,
  unitSystem: 'metric' | 'imperial' = 'metric',
): FencePositionFormResult {
  return readFencePositionForm({ ...VALID, ...texts }, unitSystem);
}

describe('readFencePositionForm', () => {
  it('calculates the Fence Position and the Short Face from the Long Face', () => {
    const form = read({});

    expect(form.errors).toStrictEqual({});
    expect(form.result?.otherFace).toBe('short');
    expect(form.result?.fencePositionMillimetres).toBeCloseTo(281, 9);
    expect(form.result?.otherFaceMillimetres).toBeCloseTo(281, 9);
  });

  it('calculates the Long Face from the Short Face', () => {
    const form = read({ length: '281', givenFace: 'short' });

    expect(form.errors).toEqual({});
    expect(form.result?.otherFace).toBe('long');
    expect(form.result?.fencePositionMillimetres).toBe(281);
    expect(form.result?.otherFaceMillimetres).toBeCloseTo(300, 9);
  });

  it('hands on the angle, Thickness and both faces for drawing, whichever face was given', () => {
    const fromLong = read({ bevelAngle: '22,5', thickness: '20', length: '100' }).result;
    const fromShort = read({
      bevelAngle: '22,5',
      thickness: '20',
      length: '100',
      givenFace: 'short',
    }).result;

    expect(fromLong?.bevelAngleDegrees).toBe(22.5);
    expect(fromLong?.thicknessMillimetres).toBe(20);
    expect(fromLong?.longFaceMillimetres).toBe(100);
    expect(fromLong?.shortFaceMillimetres).toBeCloseTo(91.7157, 4);
    expect(fromShort?.longFaceMillimetres).toBeCloseTo(108.2843, 4);
    expect(fromShort?.shortFaceMillimetres).toBe(100);
    expect(fromShort?.givenFace).toBe('short');
    expect(fromLong?.givenFace).toBe('long');
  });

  it('uses the tangent of the Bevel Angle: 22.5° on 20 mm gives a Long Face 8.2843 mm longer', () => {
    const form = read({ bevelAngle: '22.5', thickness: '20', length: '100', givenFace: 'short' });

    expect(form.result?.otherFaceMillimetres).toBeCloseTo(108.2843, 4);
  });

  it('reads bare numbers in the preferred Unit System', () => {
    const { result } = read({ thickness: '1', length: '10', bevelAngle: '0' }, 'imperial');

    expect(result?.fencePositionMillimetres).toBeCloseTo(254, 9);
  });

  it('reads units typed with the lengths', () => {
    const { result } = read({ thickness: '0.75"', length: '30 cm', bevelAngle: '0' });

    expect(result?.fencePositionMillimetres).toBeCloseTo(300, 9);
  });

  it.each(['bevelAngle', 'thickness', 'length'] as const)(
    'has neither result nor errors while %s is empty',
    (field) => {
      expect(read({ [field]: '  ' })).toEqual({ errors: {} });
    },
  );

  it('has no result and no error from the other fields while one is empty', () => {
    expect(read({ length: '' }).errors).toEqual({});
  });

  it('flags an unreadable angle on the angle only', () => {
    expect(read({ bevelAngle: 'abc' })).toEqual({ errors: { bevelAngle: 'unreadable' } });
  });

  it('flags an angle out of range', () => {
    expect(read({ bevelAngle: '46' })).toEqual({ errors: { bevelAngle: 'out-of-range' } });
  });

  it.each([
    ['abc', 'unreadable'],
    ['-5', 'not-positive'],
    ['0', 'not-positive'],
  ] as const)('flags the unusable Thickness %j as %s', (thickness, expected) => {
    expect(read({ thickness })).toEqual({ errors: { thickness: expected } });
  });

  it.each([
    ['abc', 'unreadable'],
    ['-5', 'not-positive'],
    ['0', 'not-positive'],
  ] as const)('flags the unusable length %j as %s', (length, expected) => {
    expect(read({ length })).toEqual({ errors: { length: expected } });
  });

  it('shows the errors of several fields at once', () => {
    expect(read({ bevelAngle: '50', thickness: 'x', length: '0' })).toEqual({
      errors: { bevelAngle: 'out-of-range', thickness: 'unreadable', length: 'not-positive' },
    });
  });

  it('flags an unusable field even while another is empty', () => {
    expect(read({ thickness: '', length: 'abc' })).toEqual({ errors: { length: 'unreadable' } });
  });

  it('states the minimum Long Face when it is not longer than the difference', () => {
    const form = read({ length: '19' });

    expect(form.result).toBeUndefined();
    expect(form.errors.length).toBe('long-face-too-short');
    expect(form.minimumLongFaceMillimetres).toBeCloseTo(19, 9);
    expect(form.bevelAngleDegrees).toBe(45);
  });

  it('accepts any Short Face, however short the Long Face would be', () => {
    expect(read({ length: '1', givenFace: 'short' }).result?.otherFaceMillimetres).toBeCloseTo(
      20,
      9,
    );
  });
});
