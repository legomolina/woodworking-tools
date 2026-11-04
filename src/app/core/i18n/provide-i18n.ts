import { provideHttpClient } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import {
  DOCUMENT,
  DestroyRef,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideEnvironmentInitializer,
} from '@angular/core';
import { getBrowserLang, provideTransloco, TranslocoService } from '@jsverse/transloco';
import { catchError, firstValueFrom, of } from 'rxjs';
import { initialLang } from './initial-lang';
import { translocoAppConfig } from './transloco-app-config';
import { TranslationLoader } from './translation-loader';

/**
 * Runtime translation (ADR 0001): starts in the browser's language, loads
 * translation files on demand and keeps `<html lang>` on the active language,
 * so assistive technology reads the page in the right language.
 *
 * The starting language is loaded before the first render, so text never
 * appears empty while its file is in flight. If no file can be loaded the app
 * still starts (Transloco reports the error) rather than staying blank.
 */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(),
    provideTransloco({
      config: translocoAppConfig(initialLang(getBrowserLang())),
      loader: TranslationLoader,
    }),
    provideAppInitializer(async () => {
      const transloco = inject(TranslocoService);
      return firstValueFrom(
        transloco.load(transloco.getActiveLang()).pipe(catchError(() => of(undefined))),
        { defaultValue: undefined },
      );
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
