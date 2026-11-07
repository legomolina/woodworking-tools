import { DOCUMENT, LowerCasePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import { readLength } from '../../shared/measurement/read-length.calc';
import type { DisplayUnit } from '../../shared/measurement/show-length.calc';
import { showLength } from '../../shared/measurement/show-length.calc';
import type { UnitSystem } from '../../shared/measurement/unit-system';
import type { Result } from '../../shared/ui/result-list/result-list';
import { Button } from '../../shared/ui/button/button';
import { ResultList } from '../../shared/ui/result-list/result-list';
import { TextField } from '../../shared/ui/text-field/text-field';

/** How long the copy confirmation stays on screen. */
const CONFIRMATION_MS = 3000;

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

/** The Unit Converter's page: one length field and the length in every unit. */
@Component({
  selector: 'wt-unit-converter-page',
  imports: [TranslocoPipe, LowerCasePipe, TextField, ResultList, Button],
  templateUrl: './unit-converter.page.html',
  styleUrl: './unit-converter.page.css',
})
export default class UnitConverterPage {
  private readonly settings = inject(SettingsStore);

  private readonly clipboard = inject(DOCUMENT).defaultView?.navigator.clipboard;

  protected readonly text = signal('');

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

  /** What the confirmation under the results says; `undefined` when there is none. */
  protected readonly copyOutcome = signal<{ unit: string; copied: boolean } | undefined>(undefined);

  private confirmationTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.confirmationTimer);
    });
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
    const text = result.value.startsWith(APPROXIMATE_MARK)
      ? result.value.slice(APPROXIMATE_MARK.length)
      : result.value;
    let copied = true;
    try {
      await this.clipboard!.writeText(text);
    } catch {
      copied = false;
    }
    this.copyOutcome.set({ unit: result.label, copied });
    clearTimeout(this.confirmationTimer);
    this.confirmationTimer = setTimeout(() => {
      this.copyOutcome.set(undefined);
    }, CONFIRMATION_MS);
  }
}
