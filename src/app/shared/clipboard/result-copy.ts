import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, linkedSignal } from '@angular/core';
import type { Signal } from '@angular/core';
import { APPROXIMATE_MARK } from '../measurement/show-length.calc';
import type { Result } from '../ui/result-list/result-list';

/** How long the copy confirmation stays on screen. */
export const CONFIRMATION_MS = 5000;

/** The outcome of the last copy: which result, and whether it reached the clipboard. */
export interface CopyOutcome {
  readonly unit: string;
  readonly copied: boolean;
}

export interface ResultCopy {
  /**
   * The outcome of the last copy only. It is a list of at most one, so each copy renders a fresh
   * message that a live region announces again; it empties after `CONFIRMATION_MS` and whenever
   * the source changes.
   */
  readonly outcomes: Signal<readonly CopyOutcome[]>;

  /** Copies a result's text, without the `≈` marker, and records the outcome. */
  copy: (result: Result) => Promise<void>;
}

/**
 * Copying a result to the clipboard with a confirmation to show. Call it in an injection context
 * (a field initialiser). A copy whose `source` changed while it was pending is dropped.
 */
export function resultCopy(source: Signal<unknown>): ResultCopy {
  const clipboard = inject(DOCUMENT).defaultView?.navigator.clipboard;
  const outcomes = linkedSignal<unknown, readonly CopyOutcome[]>({
    source,
    computation: () => [],
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  inject(DestroyRef).onDestroy(() => {
    clearTimeout(timer);
  });

  /** Writes to the clipboard; `false` when there is none or it refuses. */
  async function write(text: string): Promise<boolean> {
    try {
      await clipboard?.writeText(text);
      return clipboard !== undefined;
    } catch {
      return false;
    }
  }

  return {
    outcomes: outcomes.asReadonly(),
    async copy(result: Result): Promise<void> {
      const text = result.approximate ? result.value.slice(APPROXIMATE_MARK.length) : result.value;
      const forSource = source();
      const copied = await write(text);
      if (source() !== forSource) {
        return;
      }
      outcomes.set([{ unit: result.label, copied }]);
      clearTimeout(timer);
      timer = setTimeout(() => {
        outcomes.set([]);
      }, CONFIRMATION_MS);
    },
  };
}
