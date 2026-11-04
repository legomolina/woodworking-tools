import { booleanAttribute, Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import type { SelectOption } from '../select/select';
import { Select } from '../select/select';

/**
 * A labelled `select[wt-select]` stacked over an optional hint, which
 * describes it (design system: Field with a Select). `name` is the select's
 * id and derives the hint's, so it must be unique on the page.
 *
 * ```html
 * <wt-select-field name="precision" label="Imperial precision" hint="…" measurement [options]="precisions" [(value)]="precision" />
 * ```
 */
@Component({
  selector: 'wt-select-field',
  imports: [Select],
  templateUrl: './select-field.html',
  styleUrl: './select-field.css',
})
export class SelectField implements FormValueControl<string> {
  readonly name = input.required<string>();

  readonly label = input.required<string>();

  /** Extra guidance under the select, announced with it. */
  readonly hint = input<string>();

  /** Whether the options are measurements, shown in the mono face. */
  readonly measurement = input(false, { transform: booleanAttribute });

  readonly options = input.required<readonly SelectOption[]>();

  /** The selected option's value. */
  readonly value = model.required<string>();

  protected readonly hintId = computed(() => `${this.name()}-hint`);
}
