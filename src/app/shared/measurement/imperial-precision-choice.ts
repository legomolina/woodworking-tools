import { computed, inject, Service } from '@angular/core';
import { SettingsStore } from '../../core/settings/settings-store';
import type { SelectOption } from '../ui/select/select';
import { IMPERIAL_PRECISIONS } from './show-length.calc';

/** Each Imperial precision as the smallest fraction it shows, such as `1/16 in`. */
export function imperialPrecisionOptions(inch: string): readonly SelectOption[] {
  return IMPERIAL_PRECISIONS.map((denominator) => ({
    value: String(denominator),
    label: `1/${denominator} ${inch}`,
  }));
}

/**
 * Choosing the global Imperial precision from a `<wt-select-field>`: the current
 * value as the select's string, and the change handler. The setting stays in the `SettingsStore`.
 */
@Service()
export class ImperialPrecisionChoice {
  private readonly settings = inject(SettingsStore);

  /** The current Imperial precision as the select's value, such as `16`. */
  readonly value = computed(() => String(this.settings.imperialPrecision()));

  /** Sets the precision from a select value; anything that is not an Imperial precision is ignored. */
  choose(precision: string): void {
    const denominator = IMPERIAL_PRECISIONS.find((candidate) => String(candidate) === precision);
    if (denominator !== undefined) {
      this.settings.setImperialPrecision(denominator);
    }
  }
}
