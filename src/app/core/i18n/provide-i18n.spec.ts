import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import en from '../../../../public/i18n/en.json';
import es from '../../../../public/i18n/es.json';
import { provideI18n } from './provide-i18n';

const SPANISH_INTRO =
  'Respuestas rápidas y exactas para el taller: convierte medidas y planifica tus cortes.';
const ENGLISH_INTRO =
  'Quick, exact answers for the workshop: convert measurements and plan your cuts.';

function setUp(browserLanguages: readonly string[]): {
  http: HttpTestingController;
  transloco: TranslocoService;
  document: Document;
  initialized: Promise<unknown>;
} {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browserLanguages);
  TestBed.configureTestingModule({ providers: [provideI18n(), provideHttpClientTesting()] });
  return {
    http: TestBed.inject(HttpTestingController),
    transloco: TestBed.inject(TranslocoService),
    document: TestBed.inject(DOCUMENT),
    initialized: TestBed.inject(ApplicationInitStatus).donePromise,
  };
}

describe('provideI18n', () => {
  beforeEach(() => {
    // <html> outlives each test: start from a language no test expects.
    document.documentElement.lang = 'xx';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['es-ES', 'es-MX'])(
    'loads Spanish before the app starts for a %s browser',
    async (browserLang) => {
      const { http, transloco, initialized } = setUp([browserLang, 'en-US']);

      http.expectOne('/i18n/es.json').flush(es);
      await initialized;

      expect(transloco.translate('home.intro')).toBe(SPANISH_INTRO);
    },
  );

  it.each(['en-US', 'fr-FR'])(
    'loads English before the app starts for a %s browser',
    async (browserLang) => {
      const { http, transloco, initialized } = setUp([browserLang]);

      http.expectOne('/i18n/en.json').flush(en);
      await initialized;

      expect(transloco.translate('home.intro')).toBe(ENGLISH_INTRO);
    },
  );

  it('still starts the app when no translation file can be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { http, initialized } = setUp(['es-ES']);

    // Transloco retries each file, then falls back to English: fail every attempt.
    for (const url of ['/i18n/es.json', '/i18n/en.json']) {
      let requests = http.match(url);
      expect(requests.length).toBeGreaterThan(0);
      while (requests.length > 0) {
        requests.forEach((request) => {
          request.flush(null, { status: 503, statusText: 'Unavailable' });
        });
        requests = http.match(url);
      }
    }

    await initialized;
    expect(TestBed.inject(ApplicationInitStatus).done).toBe(true);
  });

  it("loads a Tool's scope from its own folder", async () => {
    const { http, transloco } = setUp(['es-ES']);
    http.expectOne('/i18n/es.json').flush(es);

    const loaded = firstValueFrom(transloco.load('cut-optimizer/es'));
    http.expectOne('/i18n/cut-optimizer/es.json').flush({ title: 'Optimizador de cortes' });
    await loaded;

    expect(transloco.translate('title', {}, 'cut-optimizer/es')).toBe('Optimizador de cortes');
  });

  it('declares the starting language as the document language', () => {
    const { document } = setUp(['es-MX']);

    expect(document.documentElement.lang).toBe('es');
  });

  it('keeps the document language in step with the active language', () => {
    const { transloco, document } = setUp(['en-US']);

    transloco.setActiveLang('es');

    expect(document.documentElement.lang).toBe('es');
  });
});
