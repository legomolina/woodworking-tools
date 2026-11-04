import { Component } from '@angular/core';

/**
 * A navigation link (design system: AppHeader's `wt-nav-link`), at least 44px
 * tall. The current page's link carries `aria-current="page"` (set it with
 * `routerLinkActive` and `ariaCurrentWhenActive="page"`) and is marked three
 * ways, never by colour alone: `tape-soft` fill, bolder weight and an `ink` bar.
 */
@Component({
  selector: 'a[wt-nav-link]',
  templateUrl: './nav-link.html',
  styleUrl: './nav-link.css',
})
export class NavLink {}
