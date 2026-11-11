export type ReadBevelAngleError = 'empty' | 'unreadable' | 'out-of-range';

export type ReadBevelAngleResult =
  | { readonly ok: true; readonly degrees: number }
  | { readonly ok: false; readonly error: ReadBevelAngleError };

const HALF_TURN_DEGREES = 180;

export const MAXIMUM_BEVEL_ANGLE_DEGREES = 45;

/** Decimal degrees with `.` or `,` as separator and an optional trailing `°`; a sign is read so it can be rejected. */
const BEVEL_ANGLE = /^(?<sign>-?)\s*(?<value>\d+(?:[.,]\d+)?)\s*°?$/u;

/**
 * Reads a Bevel Angle typed in decimal degrees, from 0° to 45° inclusive. Anything else is a
 * reading error: `empty`, `unreadable` or `out-of-range`.
 */
export function readBevelAngle(text: string): ReadBevelAngleResult {
  const normalised = text.trim();
  if (normalised === '') {
    return { ok: false, error: 'empty' };
  }
  const groups = BEVEL_ANGLE.exec(normalised)?.groups;
  if (groups === undefined) {
    return { ok: false, error: 'unreadable' };
  }
  const degrees = Number(groups['value'].replace(',', '.'));
  if (groups['sign'] === '-' && degrees !== 0) {
    return { ok: false, error: 'out-of-range' };
  }
  if (degrees > MAXIMUM_BEVEL_ANGLE_DEGREES) {
    return { ok: false, error: 'out-of-range' };
  }
  return { ok: true, degrees };
}

export type BevelFace = 'long' | 'short';

export interface FencePositionInput {
  readonly bevelAngleDegrees: number;
  readonly thicknessMillimetres: number;
  /** The face whose length is `lengthMillimetres`. */
  readonly givenFace: BevelFace;
  readonly lengthMillimetres: number;
}

export type FencePositionResult =
  | {
      readonly ok: true;
      readonly fencePositionMillimetres: number;
      readonly shortFaceMillimetres: number;
      readonly longFaceMillimetres: number;
    }
  | {
      readonly ok: false;
      readonly error: 'long-face-too-short';
      readonly minimumLongFaceMillimetres: number;
    };

/** Absorbs floating-point noise (`tan(45°)` is `0.9999999999999999`) when comparing lengths. */
const LENGTH_TOLERANCE_MILLIMETRES = 1e-9;

/**
 * The Long Face is `Thickness × tan(Bevel Angle)` longer than the Short Face, and the Fence
 * Position equals the Short Face. A given Long Face that is not longer than that difference
 * would put the Fence at zero or below, so it is rejected with the minimum Long Face.
 */
export function calculateFencePosition(input: FencePositionInput): FencePositionResult {
  const difference =
    input.thicknessMillimetres * Math.tan((input.bevelAngleDegrees * Math.PI) / HALF_TURN_DEGREES);

  if (input.givenFace === 'short') {
    return {
      ok: true,
      fencePositionMillimetres: input.lengthMillimetres,
      shortFaceMillimetres: input.lengthMillimetres,
      longFaceMillimetres: input.lengthMillimetres + difference,
    };
  }

  if (input.lengthMillimetres - difference < LENGTH_TOLERANCE_MILLIMETRES) {
    return { ok: false, error: 'long-face-too-short', minimumLongFaceMillimetres: difference };
  }
  const shortFace = input.lengthMillimetres - difference;
  return {
    ok: true,
    fencePositionMillimetres: shortFace,
    shortFaceMillimetres: shortFace,
    longFaceMillimetres: input.lengthMillimetres,
  };
}
