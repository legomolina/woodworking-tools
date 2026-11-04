import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { translocoTesting } from '../../../testing/transloco-testing';
import type { ImperialPrecision } from '../../shared/measurement/show-length.calc';
import { SettingsStore } from './settings-store';

function configure(browserLanguages: readonly string[]): void {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browserLanguages);
  TestBed.configureTestingModule({ imports: [translocoTesting()] });
}

function setUp(browserLanguages: readonly string[]): SettingsStore {
  configure(browserLanguages);
  return TestBed.inject(SettingsStore);
}

describe('SettingsStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Unit System', () => {
    it('defaults to Imperial for an en-US browser', () => {
      const store = setUp(['en-US']);

      expect(store.unitSystem()).toBe('imperial');
    });

    it.each(['en-GB', 'es-ES'])('defaults to Metric for an %s browser', (browserLang) => {
      const store = setUp([browserLang]);

      expect(store.unitSystem()).toBe('metric');
    });

    it.each([
      ['es-ES', 'imperial'],
      ['en-US', 'metric'],
    ] as const)('can be changed from the %s default to %s', (browserLang, unitSystem) => {
      const store = setUp([browserLang]);

      store.setUnitSystem(unitSystem);

      expect(store.unitSystem()).toBe(unitSystem);
    });
  });

  describe('Imperial precision', () => {
    it('defaults to sixteenths of an inch', () => {
      const store = setUp(['en-US']);

      expect(store.imperialPrecision()).toBe(16);
    });

    it.each([8, 32, 64] as const)('can be set to %i', (precision) => {
      const store = setUp(['en-US']);

      store.setImperialPrecision(precision);

      expect(store.imperialPrecision()).toBe(precision);
    });

    it('can be set back to 16', () => {
      const store = setUp(['en-US']);
      store.setImperialPrecision(8);

      store.setImperialPrecision(16);

      expect(store.imperialPrecision()).toBe(16);
    });

    it.each([0, -16, 4, 12, 128, 16.5, Number.NaN])(
      'rejects %s and keeps the current precision',
      (precision) => {
        const store = setUp(['en-US']);
        store.setImperialPrecision(32);

        expect(() => {
          store.setImperialPrecision(precision as ImperialPrecision);
        }).toThrow(RangeError);
        expect(store.imperialPrecision()).toBe(32);
      },
    );
  });

  describe('Language', () => {
    it("starts as Transloco's active language, not the browser's", () => {
      configure(['en-US']);
      TestBed.inject(TranslocoService).setActiveLang('es');

      const store = TestBed.inject(SettingsStore);

      expect(store.language()).toBe('es');
    });

    it("changes Transloco's active language", () => {
      const store = setUp(['en-US']);

      store.setLanguage('es');

      expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('es');
      expect(store.language()).toBe('es');
    });

    it('follows Transloco when another writer changes the language', () => {
      const store = setUp(['en-US']);

      TestBed.inject(TranslocoService).setActiveLang('es');

      expect(store.language()).toBe('es');
    });
  });

  it('writes nothing to browser storage', () => {
    localStorage.clear();
    sessionStorage.clear();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    // jsdom has no IndexedDB: stand one in so any use is recorded.
    const openDatabase = vi.fn();
    vi.stubGlobal('indexedDB', { open: openDatabase });
    const store = setUp(['en-US']);

    store.setUnitSystem('metric');
    store.setImperialPrecision(64);
    store.setLanguage('es');

    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
    expect(openDatabase).not.toHaveBeenCalled();
  });
});
