import { Component, input } from '@angular/core';

/**
 * An action button (design system: Button), at least `control-height` tall.
 * Put it on a native `<button type="button">` (or `type="submit"` in a form)
 * with a visible text label: a verb first, sentence case. Use `variant="primary"`
 * for the one action a view exists for (at most one per view); the default is
 * `secondary`. The native element keeps its own `disabled`, `type` and
 * `aria-label`; prefer leaving it enabled and explaining with a message.
 * Use `size="small"` for a secondary action repeated inside a row or list
 * (such as Copy on a result): it is shorter and quieter, but still a
 * comfortable target (at least 32px tall).
 *
 * ```html
 * <button wt-button variant="primary" type="button">Optimize cuts</button>
 * <button wt-button size="small" type="button">Copy</button>
 * ```
 */
@Component({
  selector: 'button[wt-button]',
  templateUrl: './button.html',
  styleUrl: './button.css',
  host: { '[attr.variant]': 'variant()', '[attr.size]': 'size()' },
})
export class Button {
  readonly variant = input<'primary' | 'secondary'>('secondary');

  readonly size = input<'default' | 'small'>('default');
}
