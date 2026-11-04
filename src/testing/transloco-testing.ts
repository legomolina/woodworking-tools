import type { ModuleWithProviders } from '@angular/core';
import type { Translation, TranslocoTestingOptions } from '@jsverse/transloco';
import { TranslocoTestingModule } from '@jsverse/transloco';
import en from '../../public/i18n/en.json';
import es from '../../public/i18n/es.json';
import { SOURCE_LANG } from '../app/core/i18n/langs';
import { translocoAppConfig } from '../app/core/i18n/transloco-app-config';

/**
 * Transloco for specs, loaded synchronously with the real app-wide translation
 * files, so tests assert on the copy users see. English is active; switch with
 * `TranslocoService.setActiveLang('es')`.
 *
 * A Tool's spec passes its scope's files keyed `<scope>/<lang>`:
 * `translocoTesting({ 'unit-converter/en': unitConverterEn, … })`.
 */
export function translocoTesting(
  scopes: Readonly<Record<string, Translation>> = {},
): ModuleWithProviders<TranslocoTestingModule> {
  const options: TranslocoTestingOptions = {
    langs: { en, es, ...scopes },
    translocoConfig: translocoAppConfig(SOURCE_LANG),
    preloadLangs: true,
  };
  return TranslocoTestingModule.forRoot(options);
}
