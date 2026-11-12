import type { UnitSystem } from '../../shared/measurement/unit-system';
import type { BevelFace } from './bevel-fence.calc';
import { calculateFencePosition, readBevelAngle } from './bevel-fence.calc';
import { readLength } from '../../shared/measurement/read-length.calc';

/** What the woodworker typed, exactly as typed, and which face the length belongs to. */
export interface FencePositionFormTexts {
  readonly bevelAngle: string;
  readonly thickness: string;
  readonly length: string;
  readonly givenFace: BevelFace;
}

export interface FencePositionFormErrors {
  readonly bevelAngle?: 'unreadable' | 'out-of-range';
  readonly thickness?: 'unreadable' | 'not-positive';
  readonly length?: 'unreadable' | 'not-positive' | 'long-face-too-short';
}

export interface FencePositionFormResult {
  readonly errors: FencePositionFormErrors;
  /** Set only when every value is present and usable. */
  readonly result?: {
    readonly fencePositionMillimetres: number;
    readonly bevelAngleDegrees: number;
    readonly thicknessMillimetres: number;
    readonly longFaceMillimetres: number;
    readonly shortFaceMillimetres: number;
    /** The face whose length was typed. */
    readonly givenFace: BevelFace;
    /** The face that was not given. */
    readonly otherFace: BevelFace;
    readonly otherFaceMillimetres: number;
  };
  /** Set with the `long-face-too-short` error. */
  readonly minimumLongFaceMillimetres?: number;
  /** Set with the `long-face-too-short` error: the Bevel Angle it applies to. */
  readonly bevelAngleDegrees?: number;
}

type LengthReading =
  | { readonly state: 'empty' }
  | { readonly state: 'error'; readonly error: 'unreadable' | 'not-positive' }
  | { readonly state: 'ok'; readonly millimetres: number };

function readPositiveLength(text: string, unitSystem: UnitSystem): LengthReading {
  const reading = readLength(text, unitSystem);
  if (!reading.ok) {
    return reading.error === 'empty'
      ? { state: 'empty' }
      : { state: 'error', error: reading.error === 'negative' ? 'not-positive' : 'unreadable' };
  }
  return reading.millimetres > 0
    ? { state: 'ok', millimetres: reading.millimetres }
    : { state: 'error', error: 'not-positive' };
}

/**
 * Reads the three typed values and calculates the Fence Position. While any value is empty there
 * is no result; a value that cannot be used is reported on its own field, whatever the others
 * hold. A Long Face too short for the Thickness and Bevel Angle is reported on the length with
 * the minimum Long Face.
 */
export function readFencePositionForm(
  texts: FencePositionFormTexts,
  unitSystem: UnitSystem,
): FencePositionFormResult {
  const angle = readBevelAngle(texts.bevelAngle);
  const thickness = readPositiveLength(texts.thickness, unitSystem);
  const length = readPositiveLength(texts.length, unitSystem);

  const errors: FencePositionFormErrors = {
    ...(!angle.ok && angle.error !== 'empty' ? { bevelAngle: angle.error } : {}),
    ...(thickness.state === 'error' ? { thickness: thickness.error } : {}),
    ...(length.state === 'error' ? { length: length.error } : {}),
  };

  if (!angle.ok || thickness.state !== 'ok' || length.state !== 'ok') {
    return { errors };
  }

  const calculated = calculateFencePosition({
    bevelAngleDegrees: angle.degrees,
    thicknessMillimetres: thickness.millimetres,
    givenFace: texts.givenFace,
    lengthMillimetres: length.millimetres,
  });
  if (!calculated.ok) {
    return {
      errors: { length: calculated.error },
      minimumLongFaceMillimetres: calculated.minimumLongFaceMillimetres,
      bevelAngleDegrees: angle.degrees,
    };
  }
  const otherFace = texts.givenFace === 'long' ? 'short' : 'long';
  return {
    errors,
    result: {
      fencePositionMillimetres: calculated.fencePositionMillimetres,
      bevelAngleDegrees: angle.degrees,
      thicknessMillimetres: thickness.millimetres,
      longFaceMillimetres: calculated.longFaceMillimetres,
      shortFaceMillimetres: calculated.shortFaceMillimetres,
      givenFace: texts.givenFace,
      otherFace,
      otherFaceMillimetres:
        otherFace === 'short' ? calculated.shortFaceMillimetres : calculated.longFaceMillimetres,
    },
  };
}
