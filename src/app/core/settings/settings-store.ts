import { inject, Service, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { getBrowserCultureLang, TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';
import type { ImperialPrecision } from '../../shared/measurement/show-length.calc';
import { IMPERIAL_PRECISIONS } from '../../shared/measurement/show-length.calc';
import type { UnitSystem } from '../../shared/measurement/unit-system';
import type { Lang } from '../i18n/langs';
import { LANGS } from '../i18n/langs';

/** Lengths are shown to the nearest 1/16" until the user picks another precision. */
const DEFAULT_PRECISION: ImperialPrecision = 16;

/** Imperial for a US English browser (`en-US`), Metric for every other locale. */
function defaultUnitSystem(browserLocale: string | undefined): UnitSystem {
  return browserLocale?.toLowerCase() === 'en-us' ? 'imperial' : 'metric';
}

function isLang(lang: string): lang is Lang {
  return (LANGS as readonly string[]).includes(lang);
}

/**
 * App-wide settings every Tool reads. They live in memory for the browser
 * session: they survive navigation but not a reload, and nothing is written
 * to browser storage.
 *
 * The language is Transloco's active language: setting it here switches
 * Transloco, and a switch made directly on Transloco shows up here.
 */
@Service()
export class SettingsStore {
  private readonly transloco = inject(TranslocoService);

  private readonly unitSystemState = signal(defaultUnitSystem(getBrowserCultureLang()));

  private readonly precisionState = signal(DEFAULT_PRECISION);

  /** The preferred Unit System. */
  readonly unitSystem = this.unitSystemState.asReadonly();

  /** The denominator Imperial lengths are rounded to: 16 shows lengths to the nearest 1/16". */
  readonly precision = this.precisionState.asReadonly();

  /** The language the UI is shown in. */
  readonly language = toSignal(this.transloco.langChanges$.pipe(filter(isLang)), {
    requireSync: true,
  });

  setUnitSystem(unitSystem: UnitSystem): void {
    this.unitSystemState.set(unitSystem);
  }

  /** @throws RangeError when `precision` is not 8, 16, 32 or 64. */
  setPrecision(precision: ImperialPrecision): void {
    if (!IMPERIAL_PRECISIONS.includes(precision)) {
      throw new RangeError(`Imperial precision must be one of ${IMPERIAL_PRECISIONS.join(', ')}`);
    }
    this.precisionState.set(precision);
  }

  setLanguage(language: Lang): void {
    this.transloco.setActiveLang(language);
  }
}
