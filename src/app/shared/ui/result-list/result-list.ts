import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import type { TemplateRef } from '@angular/core';

/** One row of a `<wt-result-list>`: a unit label and its value. */
export interface Result {
  readonly label: string;
  /** The text shown, including the `≈` marker when `approximate`. */
  readonly value: string;
  /** Marks the value as rounded: reflected as an `approximate` attribute for styling. */
  readonly approximate?: boolean;
}

/**
 * A list of results, each a unit label and its value in the monospace
 * numeric type (design system: Result panel), such as a length in several
 * units at once. The list is a polite live region, so changed results are
 * announced without moving focus. All text comes in through `results`; the
 * `≈` marker of an approximate result is part of its `value`.
 *
 * `action` is an optional template rendered after each value, for a
 * per-result control; it receives the result as its implicit context.
 *
 * ```html
 * <wt-result-list [results]="results" />
 * ```
 */
@Component({
  selector: 'wt-result-list',
  imports: [NgTemplateOutlet],
  templateUrl: './result-list.html',
  styleUrl: './result-list.css',
})
export class ResultList {
  readonly results = input.required<readonly Result[]>();

  readonly action = input<TemplateRef<{ $implicit: Result }>>();
}
