import { Component, input } from '@angular/core';

/**
 * An action button (design system: Button), at least `control-height` tall.
 * Put it on a native `<button type="button">` (or `type="submit"` in a form)
 * with a visible text label: a verb first, sentence case. Use `variant="primary"`
 * for the one action a view exists for (at most one per view); the default is
 * `secondary`. The native element keeps its own `disabled`, `type` and
 * `aria-label`; prefer leaving it enabled and explaining with a message.
 *
 * ```html
 * <button wt-button variant="primary" type="button">Optimize cuts</button>
 * ```
 */
@Component({
  selector: 'button[wt-button]',
  templateUrl: './button.html',
  styleUrl: './button.css',
  host: { '[attr.variant]': 'variant()' },
})
export class Button {
  readonly variant = input<'primary' | 'secondary'>('secondary');
}
