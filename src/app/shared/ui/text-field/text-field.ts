import { booleanAttribute, Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

/**
 * A labelled text input stacked over an optional hint and error, which describe it
 * (design system: Field). `name` is the input's id and derives the hint's and the error's, so
 * it must be unique on the page. All text comes in as inputs.
 *
 * ```html
 * <wt-text-field name="length" label="Length" hint="…" measurement [(value)]="length" />
 * ```
 */
@Component({
  selector: 'wt-text-field',
  templateUrl: './text-field.html',
  styleUrl: './text-field.css',
  host: {
    '[attr.measurement]': "measurement() ? '' : null",
    '[attr.invalid]': "error() ? '' : null",
  },
})
export class TextField implements FormValueControl<string> {
  readonly name = input.required<string>();

  readonly label = input.required<string>();

  /** Extra guidance under the input, announced with it. */
  readonly hint = input<string>();

  /**
   * What is wrong with the value; unset when it is fine. Marks the input invalid
   * and is announced once, when it appears, as an alert.
   */
  readonly error = input<string>();

  /** A unit shown after the value inside the field, such as `°`; read with the field. */
  readonly unit = input<string>();
  /** Whether the value is a measurement, shown in the mono face. */
  readonly measurement = input(false, { transform: booleanAttribute });

  /** What the input holds. */
  readonly value = model('');

  protected readonly hintId = computed(() => `${this.name()}-hint`);

  protected readonly unitId = computed(() => `${this.name()}-unit`);
  protected readonly errorId = computed(() => `${this.name()}-error`);

  /** The ids of the unit, the hint and the error, in that order; `null` when neither shows. */
  protected readonly describedBy = computed(
    () =>
      [
        this.unit() ? this.unitId() : '',
        this.hint() ? this.hintId() : '',
        this.error() ? this.errorId() : '',
      ]
        .filter((id) => id !== '')
        .join(' ') || null,
  );
}
