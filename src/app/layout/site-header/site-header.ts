import { Icon } from '../../shared/ui/icon/icon';
import type { ElementRef } from '@angular/core';
import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  imports: [Icon, NavLink, RouterLink, RouterLinkActive, TranslocoPipe],
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

  private readonly menuButton = viewChild.required<ElementRef<HTMLElement>>('menuButton');

  constructor() {
    // A link in the Menu changes the page without reloading it: close the Menu as the
    // navigation starts. Not when it ends: the first navigation, which starts at bootstrap,
    // can end after the Menu was opened (a slow lazy-loaded page) and would close it.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.closeMenu();
      });
  }

  /** Close the Menu when focus moves on past it, so it never covers what has focus (WCAG 2.4.11). */
  protected focusLeft(event: FocusEvent): void {
    const next = event.relatedTarget;
    const stillInMenu =
      next instanceof Node &&
      (this.menu().nativeElement.contains(next) || this.menuButton().nativeElement === next);
    if (!stillInMenu) {
      this.closeMenu();
    }
  }

  protected menuToggled(event: ToggleEvent): void {
    this.menuOpen.set(event.newState === 'open');
  }

  private closeMenu(): void {
    const menu = this.menu().nativeElement;
    if (menu.matches(':popover-open')) {
      menu.hidePopover();
    }
  }
}
