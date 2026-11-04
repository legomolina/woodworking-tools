import type { ModuleWithProviders } from '@angular/core';
import type { Translation, TranslocoTestingOptions } from '@jsverse/transloco';
import { TranslocoTestingModule } from '@jsverse/transloco';
import en from '../../public/i18n/en.json';
import es from '../../public/i18n/es.json';
import type { Lang } from '../app/core/i18n/langs';
import { SOURCE_LANG } from '../app/core/i18n/langs';
import { translocoAppConfig } from '../app/core/i18n/transloco-app-config';
import { TEST_TOOL_TRANSLATIONS } from './test-tool/test-tool';

function isGroup(value: unknown): value is Translation {
  return typeof value === 'object' && value !== null;
}

/** `extra` laid over `base`, merging nested groups instead of replacing them. */
function merged(base: Translation, extra: Translation): Translation {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(extra) as [string, unknown][]) {
    const current = result[key];
    result[key] = isGroup(current) && isGroup(value) ? merged(current, value) : value;
  }
  return result;
}

const APP_WIDE: Readonly<Record<Lang, Translation>> = {
  en: merged(en, TEST_TOOL_TRANSLATIONS.en),
  es: merged(es, TEST_TOOL_TRANSLATIONS.es),
};

/**
 * Transloco for specs, loaded synchronously with the real app-wide translation
 * files (plus the test-only Tool's name and description, see `testTool()`), so
 * tests assert on the copy users see. English is active; switch with
 * `TranslocoService.setActiveLang('es')`.
 *
 * A Tool's spec passes its scope's files keyed `<scope>/<lang>`:
 * `translocoTesting({ 'unit-converter/en': unitConverterEn, … })`.
 */
export function translocoTesting(
  scopes: Readonly<Record<string, Translation>> = {},
): ModuleWithProviders<TranslocoTestingModule> {
  const options: TranslocoTestingOptions = {
    langs: { ...APP_WIDE, ...scopes },
    translocoConfig: translocoAppConfig(SOURCE_LANG),
    preloadLangs: true,
  };
  return TranslocoTestingModule.forRoot(options);
}
