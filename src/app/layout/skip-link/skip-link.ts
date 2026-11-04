import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * The first focusable element on every page: hidden until focused, it moves
 * focus to the main content so keyboard users can bypass the header (WCAG 2.4.1).
 *
 * It focuses the target itself instead of following the `#fragment`, because
 * with `<base href="/">` the browser would resolve the fragment against the
 * home page and leave the current one.
 */
@Component({
  selector: 'wt-skip-link',
  imports: [TranslocoPipe],
  templateUrl: './skip-link.html',
  styleUrl: './skip-link.css',
})
export class SkipLink {
  /** The main content: it needs an `id` and `tabindex="-1"`. */
  readonly target = input.required<HTMLElement>();

  protected skip(event: Event): void {
    event.preventDefault();
    this.target().focus();
  }
}
