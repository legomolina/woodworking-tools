import { provideHttpClient } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import {
  DOCUMENT,
  DestroyRef,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { getBrowserLang, provideTransloco, TranslocoService } from '@jsverse/transloco';
import { initialLang } from './initial-lang';
import { translocoAppConfig } from './transloco-app-config';
import { TranslationLoader } from './translation-loader';

/**
 * Runtime translation (ADR 0001): starts in the browser's language, loads
 * translation files on demand and keeps `<html lang>` on the active language,
 * so assistive technology reads the page in the right language.
 */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(),
    provideTransloco({
      config: translocoAppConfig(initialLang(getBrowserLang())),
      loader: TranslationLoader,
    }),
    provideEnvironmentInitializer(() => {
      const root = inject(DOCUMENT).documentElement;
      const subscription = inject(TranslocoService).langChanges$.subscribe((lang) => {
        root.lang = lang;
      });
      inject(DestroyRef).onDestroy(() => {
        subscription.unsubscribe();
      });
    }),
  ]);
}
