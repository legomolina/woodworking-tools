import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { translocoTesting } from '../../../testing/transloco-testing';
import type { ImperialPrecision } from '../../shared/measurement/show-length.calc';
import { SettingsStore } from './settings-store';

function setUp(browserLanguages: readonly string[]): SettingsStore {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browserLanguages);
  TestBed.configureTestingModule({ imports: [translocoTesting()] });
  return TestBed.inject(SettingsStore);
}

describe('SettingsStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

    it('can be changed', () => {
      const store = setUp(['es-ES']);

      store.setUnitSystem('imperial');

      expect(store.unitSystem()).toBe('imperial');
    });
  });

  describe('Imperial precision', () => {
    it('defaults to sixteenths of an inch', () => {
      const store = setUp(['en-US']);

      expect(store.precision()).toBe(16);
    });

    it.each([8, 32, 64] as const)('can be set to %i', (precision) => {
      const store = setUp(['en-US']);

      store.setPrecision(precision);

      expect(store.precision()).toBe(precision);
    });

    it.each([0, 4, 12, 128, 16.5])('rejects %s and keeps the current precision', (precision) => {
      const store = setUp(['en-US']);
      store.setPrecision(32);

      expect(() => {
        store.setPrecision(precision as ImperialPrecision);
      }).toThrow(RangeError);
      expect(store.precision()).toBe(32);
    });
  });

  describe('language', () => {
    it("starts as Transloco's active language", () => {
      const store = setUp(['en-US']);

      expect(store.language()).toBe('en');
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
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const store = setUp(['en-US']);

    store.setUnitSystem('metric');
    store.setPrecision(64);
    store.setLanguage('es');

    expect(setItem).not.toHaveBeenCalled();
  });
});
