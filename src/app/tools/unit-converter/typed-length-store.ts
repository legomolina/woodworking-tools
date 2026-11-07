import { Service, signal } from '@angular/core';

/**
 * The length typed into the Unit Converter. It lives in memory for the browser
 * session: it survives navigation but not a reload, and nothing is written to
 * browser storage.
 */
@Service()
export class TypedLengthStore {
  private readonly textState = signal('');

  /** What was last typed, exactly as typed; empty until something is. */
  readonly text = this.textState.asReadonly();

  setText(text: string): void {
    this.textState.set(text);
  }
}
