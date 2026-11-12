import { LowerCasePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import { resultCopy } from '../../shared/clipboard/result-copy';
import {
  ImperialPrecisionChoice,
  imperialPrecisionOptions,
} from '../../shared/measurement/imperial-precision-choice';
import { lengthRows } from '../../shared/measurement/length-rows.calc';
import type { LengthRow } from '../../shared/measurement/length-rows.calc';
import type { DisplayUnit } from '../../shared/measurement/show-length.calc';
import type { Result } from '../../shared/ui/result-list/result-list';
import { Button } from '../../shared/ui/button/button';
import { ResultList } from '../../shared/ui/result-list/result-list';
import type { SegmentedOption } from '../../shared/ui/segmented-control/segmented-control';
import { SegmentedControl } from '../../shared/ui/segmented-control/segmented-control';
import { SelectField } from '../../shared/ui/select-field/select-field';
import { TextField } from '../../shared/ui/text-field/text-field';
import type { BevelFace } from './bevel-fence.calc';
import { BevelFenceCalculatorStore } from './bevel-fence-calculator.store';
import { BevelDiagram } from './components/bevel-diagram/bevel-diagram';
import type { BevelDiagramState } from './components/bevel-diagram/bevel-diagram';
import type { FencePositionFormResult } from './fence-position-form.calc';
import { readFencePositionForm } from './fence-position-form.calc';

const TENTHS_PER_MILLIMETRE = 10;

/** Absorbs floating-point noise before rounding up. */
const TOLERANCE = 1e-9;

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
  imports: [
    TranslocoPipe,
    LowerCasePipe,
    TextField,
    SelectField,
    SegmentedControl,
    ResultList,
    Button,
    BevelDiagram,
  ],
  templateUrl: './bevel-fence-calculator.page.html',
  styleUrl: './bevel-fence-calculator.page.css',
})
export default class BevelFenceCalculatorPage {
  private readonly settings = inject(SettingsStore);
  protected readonly precision = inject(ImperialPrecisionChoice);

  protected readonly store = inject(BevelFenceCalculatorStore);

  protected readonly precisionOptions = imperialPrecisionOptions;
  protected readonly faceOptions = faceOptions;

  private readonly form = computed(() =>
    readFencePositionForm(
      {
        bevelAngle: this.store.bevelAngle(),
        thickness: this.store.thickness(),
        length: this.store.length(),
        givenFace: this.store.givenFace(),
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

  private readonly copier = resultCopy(this.fencePositionRows);

  protected readonly copyOutcomes = this.copier.outcomes;

  /** The minimum Long Face in the preferred unit, for the message; empty when not needed. */
  protected readonly minimumLongFace = computed(() => {
    const minimum = this.form().minimumLongFaceMillimetres;
    if (minimum === undefined) {
      return '';
    }
    // Rounded up, so the minimum shown is never below the true one.
    const roundedUp =
      Math.ceil(minimum * TENTHS_PER_MILLIMETRE - TOLERANCE) / TENTHS_PER_MILLIMETRE;
    return this.rowsOf()(roundedUp).find((row) => row.unit === 'mm')?.text ?? '';
  });

  /** The Bevel Angle the minimum Long Face applies to, in the active language's number format. */
  protected readonly shownAngle = computed(() => {
    const degrees = this.form().bevelAngleDegrees;
    return degrees === undefined ? '' : degrees.toLocaleString(this.settings.language());
  });

  /**
   * What the diagram draws: the last state in which every value was usable, so an unusable or
   * missing value leaves the drawing as it was. `undefined` until there is a first valid state.
   */
  protected readonly diagramState = linkedSignal<
    {
      result: FencePositionFormResult['result'];
      show: (millimetres: number) => string;
      language: string;
    },
    BevelDiagramState | undefined
  >({
    // Reads the unit settings here, so changing them redraws the labels.
    source: () => ({
      result: this.form().result,
      show: (millimetres: number): string => this.rowsOf()(millimetres)[0].text,
      language: this.settings.language(),
    }),
    computation: ({ result, show, language }, previous) => {
      if (result === undefined) {
        return previous?.value;
      }
      return {
        angleDegrees: result.bevelAngleDegrees,
        angle: result.bevelAngleDegrees.toLocaleString(language),
        givenFace: result.givenFace,
        thickness: show(result.thicknessMillimetres),
        longFace: show(result.longFaceMillimetres),
        shortFace: show(result.shortFaceMillimetres),
      };
    },
  });

  protected fencePositionResults(labels: Readonly<Record<DisplayUnit, string>>): readonly Result[] {
    return toResults(this.fencePositionRows(), labels);
  }

  protected otherFaceResults(labels: Readonly<Record<DisplayUnit, string>>): readonly Result[] {
    // The other face is a single row, in millimetres.
    return toResults(
      this.otherFaceRows().filter((row) => row.unit === 'mm'),
      labels,
    );
  }

  /** Copies a Fence Position result, without the `≈` marker, and confirms (or reports failure). */
  protected async copy(result: Result): Promise<void> {
    await this.copier.copy(result);
  }
}
