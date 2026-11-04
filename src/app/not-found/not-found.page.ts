import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

/** Shown at any address that is not a page of the app, with a way back home. */
@Component({
  selector: 'wt-not-found-page',
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.css',
})
export default class NotFoundPage {}
