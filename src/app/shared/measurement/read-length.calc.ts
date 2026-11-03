import type { UnitSystem } from './unit-system';

export type ReadLengthError = 'unreadable' | 'empty';

export type ReadLengthResult =
  | { readonly ok: true; readonly millimetres: number }
  | { readonly ok: false; readonly error: ReadLengthError };

const MILLIMETRES_PER_INCH = 25.4;
const INCHES_PER_FOOT = 12;

const MILLIMETRES_PER_METRIC_UNIT: Readonly<Record<string, number>> = {
  mm: 1,
  cm: 10,
  m: 1000,
};

/** A decimal number with `.` or `,` as the decimal separator. */
const DECIMAL = String.raw`\d+(?:[.,]\d+)?`;

/** A whole number of inches and a fraction, separated by spaces or a hyphen (`3 1/2`, `3-1/2`). */
const FRACTIONAL = String.raw`(?:(?<whole>\d+)(?:\s*-\s*|\s+))?(?<numerator>\d+)\s*\/\s*(?<denominator>\d+)`;

const INCHES = String.raw`(?:${FRACTIONAL}|(?<decimal>${DECIMAL}))`;

const METRIC_LENGTH = new RegExp(String.raw`^(?<value>${DECIMAL})\s*(?<unit>mm|cm|m)$`, 'u');
const INCH_LENGTH = new RegExp(String.raw`^${INCHES}\s*(?:"|in)$`, 'u');
/** Whole feet, optionally followed by inches whose marker may be omitted (`6'`, `6' 4 1/4"`, `6'-4"`). */
const FEET_AND_INCHES_LENGTH = new RegExp(
  String.raw`^(?<feet>\d+)\s*(?:'|ft)(?:\s*-?\s*${INCHES}\s*(?:"|in)?)?$`,
  'u',
);
const BARE_METRIC = new RegExp(String.raw`^(?<value>${DECIMAL})$`, 'u');
const BARE_IMPERIAL = new RegExp(String.raw`^${INCHES}$`, 'u');

type Groups = Readonly<Record<string, string | undefined>>;

const UNREADABLE: ReadLengthResult = { ok: false, error: 'unreadable' };

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

/** Millimetres for the groups captured by {@link INCHES}, or `undefined` for a zero denominator. */
function inchesToMillimetres(groups: Groups): number | undefined {
  if (groups['decimal'] !== undefined) {
    return parseDecimal(groups['decimal']) * MILLIMETRES_PER_INCH;
  }
  const denominator = Number(groups['denominator']);
  if (denominator === 0) {
    return undefined;
  }
  const inches = Number(groups['whole'] ?? 0) + Number(groups['numerator']) / denominator;
  return inches * MILLIMETRES_PER_INCH;
}

function fromInches(groups: Groups): ReadLengthResult {
  const millimetres = inchesToMillimetres(groups);
  return millimetres === undefined ? UNREADABLE : { ok: true, millimetres };
}

function fromFeetAndInches(groups: Groups): ReadLengthResult {
  const feetInMillimetres = Number(groups['feet']) * INCHES_PER_FOOT * MILLIMETRES_PER_INCH;
  const hasInches = groups['numerator'] !== undefined || groups['decimal'] !== undefined;
  if (!hasInches) {
    return { ok: true, millimetres: feetInMillimetres };
  }
  const inchesInMillimetres = inchesToMillimetres(groups);
  return inchesInMillimetres === undefined
    ? UNREADABLE
    : { ok: true, millimetres: feetInMillimetres + inchesInMillimetres };
}

function fromMetric(value: string, unit: string): ReadLengthResult {
  return { ok: true, millimetres: parseDecimal(value) * (MILLIMETRES_PER_METRIC_UNIT[unit] ?? 1) };
}

function readUnsignedLength(normalised: string, unitSystem: UnitSystem): ReadLengthResult {
  const metric = METRIC_LENGTH.exec(normalised)?.groups;
  if (metric !== undefined) {
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

/**
 * Reads a length typed by a woodworker. An explicit unit always wins; a bare number is
 * millimetres under Metric and inches under Imperial. A leading `-` is read as a negative
 * length: sign and range validation is left to the caller.
 */
export function readLength(text: string, unitSystem: UnitSystem): ReadLengthResult {
  const normalised = text.trim().toLowerCase();
  if (normalised === '') {
    return { ok: false, error: 'empty' };
  }
  if (!normalised.startsWith('-')) {
    return readUnsignedLength(normalised, unitSystem);
  }

  const magnitude = readUnsignedLength(normalised.slice(1).trimStart(), unitSystem);
  return magnitude.ok ? { ok: true, millimetres: -magnitude.millimetres } : UNREADABLE;
}
