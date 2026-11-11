import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import { lengthRows } from '../../shared/measurement/length-rows.calc';
import type { LengthRow } from '../../shared/measurement/length-rows.calc';
import type { DisplayUnit } from '../../shared/measurement/show-length.calc';
import type { Result } from '../../shared/ui/result-list/result-list';
import { ResultList } from '../../shared/ui/result-list/result-list';
import type { SegmentedOption } from '../../shared/ui/segmented-control/segmented-control';
import { SegmentedControl } from '../../shared/ui/segmented-control/segmented-control';
import { TextField } from '../../shared/ui/text-field/text-field';
import type { BevelFace } from './bevel-fence.calc';
import { readFencePositionForm } from './fence-position-form.calc';

function faceOptions(
  labels: Readonly<Record<BevelFace, string>>,
): readonly SegmentedOption<BevelFace>[] {
  return [
    { value: 'long', label: labels.long },
    { value: 'short', label: labels.short },
  ];
}

function toResults(
  rows: readonly LengthRow[],
  labels: Readonly<Record<DisplayUnit, string>>,
): readonly Result[] {
  return rows.map(({ unit, text, approximate }) => ({
    label: labels[unit],
    value: text,
    approximate,
  }));
}

/** The Bevel Fence Calculator's page: typed values in, the Fence Position and the other face out. */
@Component({
  selector: 'wt-bevel-fence-calculator-page',
  imports: [TranslocoPipe, TextField, SegmentedControl, ResultList],
  templateUrl: './bevel-fence-calculator.page.html',
  styleUrl: './bevel-fence-calculator.page.css',
})
export default class BevelFenceCalculatorPage {
  private readonly settings = inject(SettingsStore);

  protected readonly bevelAngle = signal('');
  protected readonly thickness = signal('');
  protected readonly length = signal('');
  protected readonly givenFace = signal<BevelFace>('long');

  protected readonly faceOptions = faceOptions;

  private readonly form = computed(() =>
    readFencePositionForm(
      {
        bevelAngle: this.bevelAngle(),
        thickness: this.thickness(),
        length: this.length(),
        givenFace: this.givenFace(),
      },
      this.settings.unitSystem(),
    ),
  );

  protected readonly errors = computed(() => this.form().errors);

  /** The other face, `undefined` while there is no result. */
  protected readonly otherFace = computed(() => this.form().result?.otherFace);

  private readonly rowsOf = computed(() => {
    const options = {
      unitSystem: this.settings.unitSystem(),
      precision: this.settings.imperialPrecision(),
      language: this.settings.language(),
    };
    return (millimetres: number): readonly LengthRow[] => lengthRows(millimetres, options);
  });

  private readonly fencePositionRows = computed(() => {
    const { result } = this.form();
    return result === undefined ? [] : this.rowsOf()(result.fencePositionMillimetres);
  });

  private readonly otherFaceRows = computed(() => {
    const { result } = this.form();
    return result === undefined ? [] : this.rowsOf()(result.otherFaceMillimetres);
  });

  /** The minimum Long Face in the preferred unit, for the message; empty when not needed. */
  protected readonly minimumLongFace = computed(() => {
    const minimum = this.form().minimumLongFaceMillimetres;
    return minimum === undefined ? '' : (this.rowsOf()(minimum)[0]?.text ?? '');
  });

  protected fencePositionResults(labels: Readonly<Record<DisplayUnit, string>>): readonly Result[] {
    return toResults(this.fencePositionRows(), labels);
  }

  protected otherFaceResults(labels: Readonly<Record<DisplayUnit, string>>): readonly Result[] {
    return toResults(this.otherFaceRows(), labels);
  }
}
