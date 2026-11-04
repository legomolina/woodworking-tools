import { Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

/** One choice of a `<wt-segmented-control>`. */
export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * A small set of mutually exclusive choices shown side by side (design
 * system: Segmented control), such as the Unit System. It is a group of
 * native radio buttons, so arrow keys move between choices, labelled by
 * `label` and described by `hint`. `name` groups the radio buttons and
 * derives the ids of the label and hint, so it must be unique on the page.
 *
 * ```html
 * <wt-segmented-control name="unit-system" label="Unit System" [options]="unitSystems" [(value)]="unitSystem" />
 * ```
 */
@Component({
  selector: 'wt-segmented-control',
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.css',
})
export class SegmentedControl<T extends string> implements FormValueControl<T> {
  readonly name = input.required<string>();

  readonly label = input.required<string>();

  /** Extra guidance under the choices, announced with the group. */
  readonly hint = input<string>();

  readonly options = input.required<readonly SegmentedOption<T>[]>();

  /** The chosen option's value. */
  readonly value = model.required<T>();

  protected readonly labelId = computed(() => `${this.name()}-label`);

  protected readonly hintId = computed(() => `${this.name()}-hint`);
}
