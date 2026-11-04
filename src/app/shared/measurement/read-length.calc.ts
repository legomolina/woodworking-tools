import {
  INCHES_PER_FOOT,
  isMetricUnit,
  MILLIMETRES_PER_INCH,
  MILLIMETRES_PER_METRIC_UNIT,
  type MetricUnit,
} from './length-units';
import type { UnitSystem } from './unit-system';

export type ReadLengthError = 'unreadable' | 'empty' | 'negative';

export type ReadLengthResult =
  | { readonly ok: true; readonly millimetres: number }
  | { readonly ok: false; readonly error: ReadLengthError };

// The patterns carry the `u` flag as good practice. It changes nothing today: `\d` is ASCII-only
// and `\s` is Unicode-aware with or without it, and every other character matched is in the BMP.

/** A decimal number with `.` or `,` as the decimal separator. */
const DECIMAL = String.raw`\d+(?:[.,]\d+)?`;

/** A whole number of inches and a fraction, separated by spaces or a hyphen (`3 1/2`, `3-1/2`). */
const FRACTIONAL = String.raw`(?:(?<whole>\d+)(?:\s*-\s*|\s+))?(?<numerator>\d+)\s*\/\s*(?<denominator>\d+)`;

const INCHES = String.raw`(?:${FRACTIONAL}|(?<decimal>${DECIMAL}))`;

/** Inch markers, including the smart quote and double prime that phone keyboards insert. */
const INCH_MARKER = String.raw`(?:["”″]|in)`;
/** Foot markers, including the smart apostrophe and prime that phone keyboards insert. */
const FOOT_MARKER = String.raw`(?:['’′]|ft)`;

const METRIC_LENGTH = new RegExp(String.raw`^(?<value>${DECIMAL})\s*(?<unit>mm|cm|m)$`, 'u');
const INCH_LENGTH = new RegExp(String.raw`^${INCHES}\s*${INCH_MARKER}$`, 'u');
/** Feet, optionally followed by inches whose marker may be omitted (`6'`, `6' 4 1/4"`, `6'-4"`). */
const FEET_AND_INCHES_LENGTH = new RegExp(
  String.raw`^(?<feet>${DECIMAL})\s*${FOOT_MARKER}(?:\s*-?\s*${INCHES}\s*${INCH_MARKER}?)?$`,
  'u',
);
const BARE_METRIC = new RegExp(String.raw`^(?<value>${DECIMAL})$`, 'u');
const BARE_IMPERIAL = new RegExp(String.raw`^${INCHES}$`, 'u');

/** Named groups captured by the patterns above; which keys are set depends on the pattern. */
type Groups = Readonly<Record<string, string | undefined>>;

const EMPTY: ReadLengthResult = { ok: false, error: 'empty' };
const UNREADABLE: ReadLengthResult = { ok: false, error: 'unreadable' };
const NEGATIVE: ReadLengthResult = { ok: false, error: 'negative' };

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

/**
 * Millimetres for the groups captured by {@link INCHES}. A zero denominator gives `Infinity`
 * (or `NaN` for `0/0`), which {@link readFiniteUnsignedLength} rejects like any overflow.
 */
function inchesToMillimetres(groups: Groups): number {
  if (groups['decimal'] !== undefined) {
    return parseDecimal(groups['decimal']) * MILLIMETRES_PER_INCH;
  }
  const inches =
    Number(groups['whole'] ?? 0) + Number(groups['numerator']) / Number(groups['denominator']);
  return inches * MILLIMETRES_PER_INCH;
}

function fromInches(groups: Groups): ReadLengthResult {
  return { ok: true, millimetres: inchesToMillimetres(groups) };
}

function fromFeetAndInches(groups: Groups): ReadLengthResult {
  const feetInMillimetres = parseDecimal(groups['feet']!) * INCHES_PER_FOOT * MILLIMETRES_PER_INCH;
  const hasInches = groups['numerator'] !== undefined || groups['decimal'] !== undefined;
  const inchesInMillimetres = hasInches ? inchesToMillimetres(groups) : 0;
  return { ok: true, millimetres: feetInMillimetres + inchesInMillimetres };
}

function fromMetric(value: string, unit: MetricUnit): ReadLengthResult {
  return { ok: true, millimetres: parseDecimal(value) * MILLIMETRES_PER_METRIC_UNIT[unit] };
}

function readUnsignedValue(normalised: string, unitSystem: UnitSystem): ReadLengthResult {
  const metric = METRIC_LENGTH.exec(normalised)?.groups;
  if (metric !== undefined && isMetricUnit(metric['unit'])) {
    return fromMetric(metric['value'], metric['unit']);
  }

  const inches = INCH_LENGTH.exec(normalised)?.groups;
  if (inches !== undefined) {
    return fromInches(inches);
  }

  const feetAndInches = FEET_AND_INCHES_LENGTH.exec(normalised)?.groups;
  if (feetAndInches !== undefined) {
    return fromFeetAndInches(feetAndInches);
  }

  if (unitSystem === 'metric') {
    const bare = BARE_METRIC.exec(normalised)?.groups;
    return bare === undefined ? UNREADABLE : fromMetric(bare['value'], 'mm');
  }

  const bare = BARE_IMPERIAL.exec(normalised)?.groups;
  return bare === undefined ? UNREADABLE : fromInches(bare);
}

/** Reads an unsigned length, rejecting values too large to hold as a finite number. */
function readFiniteUnsignedLength(normalised: string, unitSystem: UnitSystem): ReadLengthResult {
  const result = readUnsignedValue(normalised, unitSystem);
  return result.ok && !Number.isFinite(result.millimetres) ? UNREADABLE : result;
}

/**
 * Reads a length typed by a woodworker. An explicit unit always wins; a bare number is
 * millimetres under Metric and inches under Imperial. No woodworking length is negative, so a
 * leading `-` on a valid length gives the `negative` error (zero, even `-0`, still reads as zero).
 * Other range validation is left to the caller.
 */
export function readLength(text: string, unitSystem: UnitSystem): ReadLengthResult {
  const normalised = text.trim().toLowerCase();
  if (normalised === '') {
    return EMPTY;
  }
  if (!normalised.startsWith('-')) {
    return readFiniteUnsignedLength(normalised, unitSystem);
  }

  const magnitude = readFiniteUnsignedLength(normalised.slice(1).trimStart(), unitSystem);
  if (!magnitude.ok) {
    return UNREADABLE;
  }
  // A signed zero (`-0`) is still zero, not a negative length.
  return magnitude.millimetres === 0 ? magnitude : NEGATIVE;
}
