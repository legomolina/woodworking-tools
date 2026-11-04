import type { ElementRef } from '@angular/core';
import { Component, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteHeader } from './layout/site-header/site-header';
import { SkipLink } from './layout/skip-link/skip-link';

/**
 * The app shell: skip link, header, the routed page inside `<main>`, and
 * footer. The shell renders no `h1`: each page has its own.
 */
@Component({
  selector: 'wt-root',
  imports: [RouterOutlet, SiteFooter, SiteHeader, SkipLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    // After moving to another page inside the app, start the reader at its
    // content, as a full page load would (WCAG 2.4.3). The first page keeps
    // the browser's own starting point.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.main().nativeElement.focus();
      });
  }
}
