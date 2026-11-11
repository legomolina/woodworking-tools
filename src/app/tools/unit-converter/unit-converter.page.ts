import { LowerCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import { readLength } from '../../shared/measurement/read-length.calc';
import { resultCopy } from '../../shared/clipboard/result-copy';
import {
  ImperialPrecisionChoice,
  imperialPrecisionOptions,
} from '../../shared/measurement/imperial-precision-choice';
import { lengthRows } from '../../shared/measurement/length-rows.calc';
import type { DisplayUnit } from '../../shared/measurement/show-length.calc';
import type { Result } from '../../shared/ui/result-list/result-list';
import { Button } from '../../shared/ui/button/button';
import { ResultList } from '../../shared/ui/result-list/result-list';
import { SelectField } from '../../shared/ui/select-field/select-field';
import { TextField } from '../../shared/ui/text-field/text-field';
import { TypedLengthStore } from './typed-length-store';

/** The Unit Converter's page: one length field and the length in every unit. */
@Component({
  selector: 'wt-unit-converter-page',
  imports: [TranslocoPipe, LowerCasePipe, TextField, SelectField, ResultList, Button],
  templateUrl: './unit-converter.page.html',
  styleUrl: './unit-converter.page.css',
})
export default class UnitConverterPage {
  private readonly settings = inject(SettingsStore);

  protected readonly precision = inject(ImperialPrecisionChoice);

  private readonly typedLength = inject(TypedLengthStore);

  protected readonly precisionOptions = imperialPrecisionOptions;

  protected readonly text = this.typedLength.text;

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
    return lengthRows(reading.millimetres, {
      unitSystem: this.settings.unitSystem(),
      precision: this.settings.imperialPrecision(),
      language: this.settings.language(),
    });
  });

  private readonly copier = resultCopy(this.text);

  protected readonly copyOutcomes = this.copier.outcomes;

  protected setText(text: string): void {
    this.typedLength.setText(text);
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
    await this.copier.copy(result);
  }
}
