import { DOCUMENT, LowerCasePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import { readLength } from '../../shared/measurement/read-length.calc';
import type { DisplayUnit } from '../../shared/measurement/show-length.calc';
import { IMPERIAL_PRECISIONS, showLength } from '../../shared/measurement/show-length.calc';
import type { UnitSystem } from '../../shared/measurement/unit-system';
import type { Result } from '../../shared/ui/result-list/result-list';
import { Button } from '../../shared/ui/button/button';
import { ResultList } from '../../shared/ui/result-list/result-list';
import type { SelectOption } from '../../shared/ui/select/select';
import { SelectField } from '../../shared/ui/select-field/select-field';
import { TextField } from '../../shared/ui/text-field/text-field';

/** How long the copy confirmation stays on screen. */
const CONFIRMATION_MS = 5000;

const APPROXIMATE_MARK = '≈ ';

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

/** Each Imperial precision as the smallest fraction it shows, such as `1/16 in`. */
function precisionOptions(inch: string): readonly SelectOption[] {
  return IMPERIAL_PRECISIONS.map((denominator) => ({
    value: String(denominator),
    label: `1/${denominator} ${inch}`,
  }));
}

/** The Unit Converter's page: one length field and the length in every unit. */
@Component({
  selector: 'wt-unit-converter-page',
  imports: [TranslocoPipe, LowerCasePipe, TextField, SelectField, ResultList, Button],
  templateUrl: './unit-converter.page.html',
  styleUrl: './unit-converter.page.css',
})
export default class UnitConverterPage {
  private readonly settings = inject(SettingsStore);

  private readonly clipboard = inject(DOCUMENT).defaultView?.navigator.clipboard;

  protected readonly text = signal('');

  protected readonly precisions = precisionOptions;

  protected readonly imperialPrecision = computed(() => String(this.settings.imperialPrecision()));

  private readonly reading = computed(() => readLength(this.text(), this.settings.unitSystem()));

  /** What went wrong reading the text; `undefined` when it reads or is empty. */
  protected readonly error = computed(() => {
    const reading = this.reading();
    return !reading.ok && reading.error !== 'empty' ? reading.error : undefined;
  });

  /** The length in every unit, in display order, before the unit labels are added. */
  private readonly shown = computed(() => {
    const reading = this.reading();
    if (!reading.ok) {
      return [];
    }
    const options = {
      precision: this.settings.imperialPrecision(),
      language: this.settings.language(),
    };
    return UNITS_BY_PREFERENCE[this.settings.unitSystem()].map((unit) => ({
      unit,
      ...showLength(reading.millimetres, unit, options),
    }));
  });

  /**
   * The confirmation for the last copy only. It is a list of at most one, so each copy renders a
   * fresh message that a live region announces again, and it empties when the text changes.
   */
  protected readonly copyOutcomes = linkedSignal<
    string,
    readonly { unit: string; copied: boolean }[]
  >({ source: this.text, computation: () => [] });

  private confirmationTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.confirmationTimer);
    });
  }

  protected chooseImperialPrecision(precision: string): void {
    const denominator = IMPERIAL_PRECISIONS.find((candidate) => String(candidate) === precision);
    if (denominator !== undefined) {
      this.settings.setImperialPrecision(denominator);
    }
  }

  /** The results labelled with the given unit names (translated by the template). */
  protected results(labels: Readonly<Record<DisplayUnit, string>>): readonly Result[] {
    return this.shown().map(({ unit, text, approximate }) => ({
      label: labels[unit],
      value: text,
      approximate,
    }));
  }

  /** Copies a result's text, without the `≈` marker, and confirms (or reports failure). */
  protected async copy(result: Result): Promise<void> {
    const text = result.approximate ? result.value.slice(APPROXIMATE_MARK.length) : result.value;
    const forText = this.text();
    const copied = await this.write(text);
    if (this.text() !== forText) {
      return;
    }
    this.copyOutcomes.set([{ unit: result.label, copied }]);
    clearTimeout(this.confirmationTimer);
    this.confirmationTimer = setTimeout(() => {
      this.copyOutcomes.set([]);
    }, CONFIRMATION_MS);
  }

  /** Writes to the clipboard; `false` when there is none or it refuses. */
  private async write(text: string): Promise<boolean> {
    try {
      await this.clipboard?.writeText(text);
      return this.clipboard !== undefined;
    } catch {
      return false;
    }
  }
}
