import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import type { Observable } from 'rxjs';

/**
 * Fetches translation files from `public/i18n/`: `<lang>.json` for app-wide
 * text and `<tool-name>/<lang>.json` for a Tool's scope.
 */
@Service()
export class TranslationLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(path: string): Observable<Translation> {
    return this.http.get<Translation>(`/i18n/${path}.json`);
  }
}
