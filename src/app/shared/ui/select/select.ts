import { booleanAttribute, Component, ElementRef, inject, input, model } from '@angular/core';

/** One choice of a `select[wt-select]`. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  /** The option's language, when its label is not in the page's language (such as "Español"). */
  readonly lang?: string;
}

/**
 * A native `<select>` styled like the design system's Select, with the
 * customizable picker (`appearance: base-select`) where the browser supports
 * it and the operating system's own list elsewhere. It renders its own
 * plain-text options, so they can be styled with it. Label it with a `<label for>`.
 *
 * ```html
 * <select wt-select id="language" [options]="languages" [(value)]="language"></select>
 * <select wt-select id="precision" measurement [options]="precisions" [(value)]="precision"></select>
 * ```
 */
@Component({
  selector: 'select[wt-select]',
  templateUrl: './select.html',
  styleUrl: './select.css',
  host: {
    '(change)': 'choose()',
    '[attr.measurement]': "measurement() ? '' : null",
  },
})
export class Select {
  private readonly select = inject<ElementRef<HTMLSelectElement>>(ElementRef);

  /** Whether the options are measurements, shown in the mono face like every other value. */
  readonly measurement = input(false, { transform: booleanAttribute });

  readonly options = input.required<readonly SelectOption[]>();

  /** The selected option's value. */
  readonly value = model.required<string>();

  protected choose(): void {
    this.value.set(this.select.nativeElement.value);
  }
}
