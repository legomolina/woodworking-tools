import { booleanAttribute, Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

/**
 * A labelled text input stacked over an optional hint, which describes it
 * (design system: Field). `name` is the input's id and derives the hint's, so
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
  },
})
export class TextField implements FormValueControl<string> {
  readonly name = input.required<string>();

  readonly label = input.required<string>();

  /** Extra guidance under the input, announced with it. */
  readonly hint = input<string>();

  /** Whether the value is a measurement, shown in the mono face. */
  readonly measurement = input(false, { transform: booleanAttribute });

  /** What the input holds. */
  readonly value = model('');

  protected readonly hintId = computed(() => `${this.name()}-hint`);
}
