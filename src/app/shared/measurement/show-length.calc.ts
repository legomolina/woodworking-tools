import {
  INCHES_PER_FOOT,
  isMetricUnit,
  MILLIMETRES_PER_INCH,
  MILLIMETRES_PER_METRIC_UNIT,
  type MetricUnit,
} from './length-units';
import type { UnitSystem } from './unit-system';

/** The units a length can be shown in. */
export type DisplayUnit =
  'mm' | 'cm' | 'm' | 'fractional-inches' | 'decimal-inches' | 'feet-and-inches';

/** The denominators Imperial lengths can be rounded to (1/8", 1/16", 1/32" or 1/64"). */
// These numbers are the named constant's own definition, not magic numbers scattered in logic.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const IMPERIAL_PRECISIONS = [8, 16, 32, 64] as const;

export type ImperialPrecision = (typeof IMPERIAL_PRECISIONS)[number];

/** The languages the UI ships in (ADR 0001). */
export type Language = 'en' | 'es';

export interface ShowLengthOptions {
  readonly precision: ImperialPrecision;
  readonly language: Language;
}

export interface ShownLength {
  /** The display text, prefixed with `≈ ` when approximate. */
  readonly text: string;
  /** Whether the shown value differs from the exact length. */
  readonly approximate: boolean;
}

const MAXIMUM_METRIC_DECIMALS: Readonly<Record<MetricUnit, number>> = { mm: 1, cm: 2, m: 3 };

const DECIMAL_SEPARATORS: Readonly<Record<Language, string>> = { en: '.', es: ',' };

const DECIMAL_INCH_DECIMALS = 3;

/** Relative tolerance that absorbs floating-point noise from unit conversion. */
const TOLERANCE = 1e-9;

/** Significant digits kept before rounding, to drop floating-point noise such as `8.890000000000001`. */
const SIGNIFICANT_DIGITS = 12;

const DECIMAL_BASE = 10;

export const APPROXIMATE_MARK = '≈ ';

/** A non-negative value rounded to a whole number of steps, and whether that changed it. */
interface Rounded {
  readonly steps: number;
  readonly approximate: boolean;
}

/** A non-negative length as shown, before the sign and the approximate mark are added. */
interface ShownMagnitude extends Rounded {
  readonly text: string;
}

function isClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Rounds a non-negative value to the nearest multiple of `1 / stepsPerUnit`. */
function roundToSteps(value: number, stepsPerUnit: number): Rounded {
  const steps = Math.round(Number((value * stepsPerUnit).toPrecision(SIGNIFICANT_DIGITS)));
  return { steps, approximate: !isClose(steps / stepsPerUnit, value) };
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function formatFractionalInches(steps: number, precision: ImperialPrecision): string {
  const whole = Math.floor(steps / precision);
  const numerator = steps % precision;
  if (numerator === 0) {
    return `${whole}"`;
  }
  const divisor = greatestCommonDivisor(numerator, precision);
  const fraction = `${numerator / divisor}/${precision / divisor}`;
  return whole === 0 ? `${fraction}"` : `${whole} ${fraction}"`;
}

/** Feet, then the remaining inches; whole feet carry no inches and no zero feet are shown. */
function formatFeetAndInches(steps: number, precision: ImperialPrecision): string {
  const stepsPerFoot = INCHES_PER_FOOT * precision;
  const feet = Math.floor(steps / stepsPerFoot);
  const inchSteps = steps % stepsPerFoot;
  if (feet === 0) {
    return formatFractionalInches(inchSteps, precision);
  }
  return inchSteps === 0 ? `${feet}'` : `${feet}' ${formatFractionalInches(inchSteps, precision)}`;
}

/**
 * Shows a whole number of steps of `10^-decimals` as a decimal number, without trailing zeros.
 * There is deliberately no thousands separator: `2.440 mm` or `2,440 mm` would read back as 2.44 mm.
 */
function formatDecimal(steps: number, decimals: number, language: Language): string {
  const digits = String(steps).padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/u, '');
  return fraction === '' ? whole : whole + DECIMAL_SEPARATORS[language] + fraction;
}

function showMagnitude(
  millimetres: number,
  unit: DisplayUnit,
  options: ShowLengthOptions,
): ShownMagnitude {
  if (isMetricUnit(unit)) {
    const maximumDecimals = MAXIMUM_METRIC_DECIMALS[unit];
    const inUnit = millimetres / MILLIMETRES_PER_METRIC_UNIT[unit];
    const rounded = roundToSteps(inUnit, DECIMAL_BASE ** maximumDecimals);
    const value = formatDecimal(rounded.steps, maximumDecimals, options.language);
    return { ...rounded, text: `${value} ${unit}` };
  }
  const inches = millimetres / MILLIMETRES_PER_INCH;
  if (unit === 'decimal-inches') {
    const rounded = roundToSteps(inches, DECIMAL_BASE ** DECIMAL_INCH_DECIMALS);
    const value = formatDecimal(rounded.steps, DECIMAL_INCH_DECIMALS, options.language);
    return { ...rounded, text: `${value}"` };
  }
  const rounded = roundToSteps(inches, options.precision);
  const text =
    unit === 'feet-and-inches'
      ? formatFeetAndInches(rounded.steps, options.precision)
      : formatFractionalInches(rounded.steps, options.precision);
  return { ...rounded, text };
}

/**
 * Shows a length, given in millimetres, in the chosen unit. The text always carries its unit,
 * and is marked with `≈` when the shown value had to be rounded.
 *
 * @throws RangeError when `millimetres` is not a finite number.
 */
export function showLength(
  millimetres: number,
  unit: DisplayUnit,
  options: ShowLengthOptions,
): ShownLength {
  if (!Number.isFinite(millimetres)) {
    throw new RangeError('Cannot show a length that is not a finite number of millimetres');
  }
  const { steps, approximate, text } = showMagnitude(Math.abs(millimetres), unit, options);
  // A length that rounds to zero shows no sign. (At 0 mm `steps` is 0, so `< 0` versus `<= 0`
  // cannot change the result.)
  const sign = millimetres < 0 && steps !== 0 ? '-' : '';
  return { text: (approximate ? APPROXIMATE_MARK : '') + sign + text, approximate };
}

const DEFAULT_DISPLAY_UNITS: Readonly<Record<UnitSystem, DisplayUnit>> = {
  metric: 'mm',
  imperial: 'fractional-inches',
};

/** The unit every Tool shows lengths in by default for a Unit System. */
export function defaultDisplayUnit(unitSystem: UnitSystem): DisplayUnit {
  return DEFAULT_DISPLAY_UNITS[unitSystem];
}
