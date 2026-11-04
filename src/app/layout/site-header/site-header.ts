import type { ElementRef } from '@angular/core';
import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { TOOL_REGISTRY } from '../../core/tool-registry/tool-registry';
import { NavLink } from '../../shared/ui/nav-link/nav-link';

/**
 * The top bar on every page: the brand linking home, a link to each Tool and
 * to the settings. On narrow screens the links move into a Menu built on the
 * native Popover API, which handles opening, closing, Escape and light dismiss.
 */
@Component({
  selector: 'wt-site-header',
  imports: [NavLink, RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  protected readonly tools = inject(TOOL_REGISTRY);

  /**
   * Whether the Menu popover is open, to swap the button's icon and announce it
   * (`aria-expanded`): browsers do not all expose a popover invoker's state yet.
   */
  protected readonly menuOpen = signal(false);

  private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');

  constructor() {
    // A link in the Menu changes the page without reloading it: close the Menu then.
    const subscription = inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const menu = this.menu().nativeElement;
        if (menu.matches(':popover-open')) {
          menu.hidePopover();
        }
      });
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  protected menuToggled(event: ToggleEvent): void {
    this.menuOpen.set(event.newState === 'open');
  }
}
