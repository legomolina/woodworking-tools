import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
export class App {}
