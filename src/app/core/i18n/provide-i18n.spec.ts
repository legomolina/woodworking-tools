import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import en from '../../../../public/i18n/en.json';
import es from '../../../../public/i18n/es.json';
import { provideI18n } from './provide-i18n';

function setUp(browserLanguages: readonly string[]): {
  http: HttpTestingController;
  transloco: TranslocoService;
  document: Document;
} {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browserLanguages);
  TestBed.configureTestingModule({ providers: [provideI18n(), provideHttpClientTesting()] });
  return {
    http: TestBed.inject(HttpTestingController),
    transloco: TestBed.inject(TranslocoService),
    document: TestBed.inject(DOCUMENT),
  };
}

describe('provideI18n', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in Spanish and loads the Spanish file for a Spanish browser', async () => {
    const { http, transloco } = setUp(['es-MX', 'en-US']);

    const loaded = firstValueFrom(transloco.load(transloco.getActiveLang()));
    http.expectOne('/i18n/es.json').flush(es);
    await loaded;

    expect(transloco.translate('placeholder.intro')).toBe(
      'Calculadoras y utilidades para carpinteros. Próximamente.',
    );
  });

  it('starts in English for a browser in another language', async () => {
    const { http, transloco } = setUp(['fr-FR']);

    const loaded = firstValueFrom(transloco.load(transloco.getActiveLang()));
    http.expectOne('/i18n/en.json').flush(en);
    await loaded;

    expect(transloco.translate('placeholder.intro')).toBe(
      'Calculators and utilities for woodworkers. Coming soon.',
    );
  });

  it('keeps the document language in step with the active language', () => {
    const { transloco, document } = setUp(['en-US']);
    expect(document.documentElement.lang).toBe('en');

    transloco.setActiveLang('es');

    expect(document.documentElement.lang).toBe('es');
  });
});
