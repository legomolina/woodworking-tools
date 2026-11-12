import { Service, signal } from '@angular/core';
import type { BevelFace } from './bevel-fence.calc';

/**
 * What was typed on the Bevel Fence Calculator page and the face chosen. It
 * lives in memory for the browser session: it survives leaving the Tool and
 * coming back, not a reload, and nothing is written to browser storage.
 */
@Service()
export class BevelFenceCalculatorStore {
  private readonly bevelAngleState = signal('');
  private readonly thicknessState = signal('');
  private readonly lengthState = signal('');
  private readonly givenFaceState = signal<BevelFace>('long');

  readonly bevelAngle = this.bevelAngleState.asReadonly();
  readonly thickness = this.thicknessState.asReadonly();
  readonly length = this.lengthState.asReadonly();
  /** The face whose length is typed. */
  readonly givenFace = this.givenFaceState.asReadonly();

  setBevelAngle(text: string): void {
    this.bevelAngleState.set(text);
  }

  setThickness(text: string): void {
    this.thicknessState.set(text);
  }

  setLength(text: string): void {
    this.lengthState.set(text);
  }

  setGivenFace(face: BevelFace): void {
    this.givenFaceState.set(face);
  }
}
