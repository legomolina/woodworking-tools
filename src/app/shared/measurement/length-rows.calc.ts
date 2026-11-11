import type { DisplayUnit, ShowLengthOptions } from './show-length.calc';
import { showLength } from './show-length.calc';
import type { UnitSystem } from './unit-system';

const METRIC_UNITS: readonly DisplayUnit[] = ['mm', 'cm', 'm'];
const IMPERIAL_UNITS: readonly DisplayUnit[] = [
  'fractional-inches',
  'feet-and-inches',
  'decimal-inches',
];

/** The units in display order: the preferred Unit System's first. */
const UNITS_BY_PREFERENCE: Readonly<Record<UnitSystem, readonly DisplayUnit[]>> = {
  metric: [...METRIC_UNITS, ...IMPERIAL_UNITS],
  imperial: [...IMPERIAL_UNITS, ...METRIC_UNITS],
};

/** One unit of a length as shown, before its label is added. */
export interface LengthRow {
  readonly unit: DisplayUnit;
  /** The display text, prefixed with `≈ ` when approximate. */
  readonly text: string;
  readonly approximate: boolean;
}

export interface LengthRowsOptions extends ShowLengthOptions {
  readonly unitSystem: UnitSystem;
}

/** A length shown in every unit, the preferred Unit System's units first. */
export function lengthRows(millimetres: number, options: LengthRowsOptions): readonly LengthRow[] {
  return UNITS_BY_PREFERENCE[options.unitSystem].map((unit) => ({
    unit,
    ...showLength(millimetres, unit, options),
  }));
}
