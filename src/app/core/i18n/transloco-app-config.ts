import type { TranslocoConfig } from '@jsverse/transloco';
import { translocoConfig } from '@jsverse/transloco';
import type { Lang } from './langs';
import { LANGS, SOURCE_LANG } from './langs';

/** Transloco settings shared by the app and by specs (`src/testing/`). */
export function translocoAppConfig(activeLang: Lang): TranslocoConfig {
  return translocoConfig({
    availableLangs: [...LANGS],
    defaultLang: activeLang,
    fallbackLang: SOURCE_LANG,
    // The language can be switched in-app, so templates must follow it.
    reRenderOnLangChange: true,
    missingHandler: { useFallbackTranslation: false },
  });
}
