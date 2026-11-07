import { Component, input } from '@angular/core';
import { LucideArrowRight, LucideMenu, LucideSlidersHorizontal, LucideX } from '@lucide/angular';

/** The icons the app uses (Lucide names). Add a name here and a case in `icon.html` to use another. */
export type IconName = 'arrow-right' | 'menu' | 'sliders-horizontal' | 'x';

/**
 * A decorative Lucide icon (`docs/adr/0004-lucide-icons.md`). It is always
 * hidden from assistive technology, so use it next to a visible text label,
 * never as the only content of a control. It is sized by `size` and takes the
 * text colour (`currentcolor`).
 */
@Component({
  selector: 'wt-icon',
  imports: [LucideArrowRight, LucideMenu, LucideSlidersHorizontal, LucideX],
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  host: { '[attr.size]': 'size()', 'aria-hidden': 'true' },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md'>('md');
}
