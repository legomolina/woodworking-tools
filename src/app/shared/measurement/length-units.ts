/** Conversion factors shared by reading and showing lengths. Every length is held in millimetres. */

export const MILLIMETRES_PER_INCH = 25.4;

export const INCHES_PER_FOOT = 12;

export type MetricUnit = 'mm' | 'cm' | 'm';

export const MILLIMETRES_PER_METRIC_UNIT: Readonly<Record<MetricUnit, number>> = {
  mm: 1,
  cm: 10,
  m: 1000,
};

export function isMetricUnit(unit: string): unit is MetricUnit {
  return Object.hasOwn(MILLIMETRES_PER_METRIC_UNIT, unit);
}
