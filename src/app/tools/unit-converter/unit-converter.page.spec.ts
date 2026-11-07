import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import unitConverterEn from '../../../../public/i18n/unit-converter/en.json';
import unitConverterEs from '../../../../public/i18n/unit-converter/es.json';
import { expectNoAxeViolations } from '../../../testing/expect-no-axe-violations';
import { translocoTesting } from '../../../testing/transloco-testing';
import UnitConverterPage from './unit-converter.page';

function render(): ComponentFixture<UnitConverterPage> {
  TestBed.configureTestingModule({
    imports: [
      translocoTesting({
        'unit-converter/en': unitConverterEn,
        'unit-converter/es': unitConverterEs,
      }),
    ],
  });
  return TestBed.createComponent(UnitConverterPage);
}

function headings(fixture: ComponentFixture<UnitConverterPage>): string[] {
  const root = fixture.nativeElement as HTMLElement;
  return [...root.querySelectorAll('h1')].map((h1) => h1.textContent.trim());
}

async function type(fixture: ComponentFixture<UnitConverterPage>, text: string): Promise<void> {
  const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
  input.value = text;
  input.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

function rows(fixture: ComponentFixture<UnitConverterPage>): string[][] {
  const root = fixture.nativeElement as HTMLElement;
  return [...root.querySelectorAll('dl > div')].map((row) => [
    row.querySelector('dt')!.textContent.trim(),
    row.querySelector('dd')!.textContent.trim(),
  ]);
}

function pageText(fixture: ComponentFixture<UnitConverterPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent;
}

function field(fixture: ComponentFixture<UnitConverterPage>): HTMLInputElement {
  return (fixture.nativeElement as HTMLElement).querySelector('input')!;
}

describe('UnitConverterPage', () => {
  it("shows the Tool's name as its only h1 in English", async () => {
    const fixture = render();
    await fixture.whenStable();

    expect(headings(fixture)).toEqual(['Unit Converter']);
  });

  it("shows the Tool's name as its only h1 in Spanish", async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect(headings(fixture)).toEqual(['Conversor de unidades']);
  });

  it('introduces the Tool in English', async () => {
    const fixture = render();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Type a length and see it in every unit at once.',
    );
  });

  it('introduces the Tool in Spanish', async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Escribe una longitud y mírala en todas las unidades a la vez.',
    );
  });

  it('has no accessibility violations', async () => {
    const fixture = render();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });

  it('has a labelled length field', async () => {
    const fixture = render();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('label')!.textContent).toBe('Length');
    expect(root.querySelector('input')!.labels).toHaveLength(1);
  });

  it('shows neither results nor a message while the field is empty', async () => {
    const fixture = render();
    await fixture.whenStable();

    expect(rows(fixture)).toEqual([]);
    expect(pageText(fixture)).not.toContain("can't");
  });

  describe('under Imperial', () => {
    it('converts 3 1/2" into every unit, marking only the rounded one', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('imperial');
      await type(fixture, '3 1/2"');

      expect(rows(fixture)).toEqual([
        ['Fractional inches', '3 1/2"'],
        ['Feet and inches', '3 1/2"'],
        ['Decimal inches', '3.5"'],
        ['Millimetres', '88.9 mm'],
        ['Centimetres', '8.89 cm'],
        ['Metres', '≈ 0.089 m'],
      ]);
    });

    it('reads a bare number as inches', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('imperial');
      await type(fixture, '3 1/2');

      expect(rows(fixture)[0]).toEqual(['Fractional inches', '3 1/2"']);
    });

    it('rounds to the global Imperial precision', async () => {
      const fixture = render();
      const settings = TestBed.inject(SettingsStore);
      settings.setUnitSystem('imperial');
      await type(fixture, '90 mm');
      expect(rows(fixture)[0]).toEqual(['Fractional inches', '≈ 3 9/16"']);

      settings.setImperialPrecision(64);
      await fixture.whenStable();

      expect(rows(fixture)[0]).toEqual(['Fractional inches', '≈ 3 35/64"']);
    });
  });

  describe('the Imperial precision control', () => {
    function precisionSelect(fixture: ComponentFixture<UnitConverterPage>): HTMLSelectElement {
      const root = fixture.nativeElement as HTMLElement;
      const label = [...root.querySelectorAll('label')].find(
        (candidate) => candidate.textContent.trim() === 'Imperial precision',
      );
      return root.querySelector<HTMLSelectElement>(`#${label?.getAttribute('for') ?? 'missing'}`)!;
    }

    async function choose(
      fixture: ComponentFixture<UnitConverterPage>,
      denominator: string,
    ): Promise<void> {
      const select = precisionSelect(fixture);
      select.value = denominator;
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    }

    it('reflects the global setting', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setImperialPrecision(32);
      await fixture.whenStable();

      expect(precisionSelect(fixture).value).toBe('32');
    });

    it('follows a change made elsewhere', async () => {
      const fixture = render();
      await fixture.whenStable();
      TestBed.inject(SettingsStore).setImperialPrecision(8);
      await fixture.whenStable();

      expect(precisionSelect(fixture).value).toBe('8');
    });

    it('offers every precision as a fraction of an inch', async () => {
      const fixture = render();
      await fixture.whenStable();

      expect(
        [...precisionSelect(fixture).options].map((option) => option.textContent.trim()),
      ).toEqual(['1/8 in', '1/16 in', '1/32 in', '1/64 in']);
    });

    it('changes the global setting and updates the fractional results from 1/16 to 1/64', async () => {
      const fixture = render();
      const settings = TestBed.inject(SettingsStore);
      settings.setUnitSystem('imperial');
      await type(fixture, '90 mm');
      expect(rows(fixture)[0]).toEqual(['Fractional inches', '≈ 3 9/16"']);

      await choose(fixture, '64');

      expect(settings.imperialPrecision()).toBe(64);
      expect(rows(fixture)[0]).toEqual(['Fractional inches', '≈ 3 35/64"']);
    });

    it('updates the feet-and-inches result too', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('imperial');
      await type(fixture, '2000 mm');
      expect(rows(fixture)[1]).toEqual(['Feet and inches', '≈ 6\' 6 3/4"']);

      await choose(fixture, '64');

      expect(rows(fixture)[1]).toEqual(['Feet and inches', '≈ 6\' 6 47/64"']);
    });

    it('is labelled in Spanish', async () => {
      const fixture = render();
      TestBed.inject(TranslocoService).setActiveLang('es');
      await fixture.whenStable();

      const root = fixture.nativeElement as HTMLElement;
      const select = root.querySelector('select')!;
      expect(select.labels[0].textContent.trim()).toBe('Precisión imperial');
      expect(select.getAttribute('aria-describedby')).not.toBeNull();
      expect(pageText(fixture)).toContain(
        'Fracción más pequeña que se muestra en los resultados de pulgadas fraccionarias y de pies y pulgadas.',
      );
      expect([...select.options].map((option) => option.textContent.trim())).toEqual([
        '1/8 pulg.',
        '1/16 pulg.',
        '1/32 pulg.',
        '1/64 pulg.',
      ]);
    });
  });

  describe('under Metric', () => {
    it('reads a bare number as millimetres and lists Metric units first', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');

      expect(rows(fixture)).toEqual([
        ['Millimetres', '89 mm'],
        ['Centimetres', '8.9 cm'],
        ['Metres', '0.089 m'],
        ['Fractional inches', '≈ 3 1/2"'],
        ['Feet and inches', '≈ 3 1/2"'],
        ['Decimal inches', '≈ 3.504"'],
      ]);
    });

    it('lets an explicit unit win', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '3 1/2"');

      expect(rows(fixture)[0]).toEqual(['Millimetres', '88.9 mm']);
    });

    it('converts zero exactly', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '0');

      expect(rows(fixture).map(([, value]) => value)).toEqual([
        '0 mm',
        '0 cm',
        '0 m',
        '0"',
        '0"',
        '0"',
      ]);
    });
  });

  it('replaces the results with a message when the text cannot be read', async () => {
    const fixture = render();
    await type(fixture, '3 1/2"');
    await type(fixture, 'abc');

    expect(rows(fixture)).toEqual([]);
    expect(pageText(fixture)).toContain("That length can't be read.");
  });

  it('treats whitespace-only text as empty', async () => {
    const fixture = render();
    await type(fixture, '   ');

    expect(rows(fixture)).toEqual([]);
    expect(pageText(fixture)).not.toContain("can't");
  });

  it('shows 6\' 4 1/4" as feet and inches', async () => {
    const fixture = render();
    TestBed.inject(SettingsStore).setUnitSystem('imperial');
    await type(fixture, '6\' 4 1/4"');

    expect(rows(fixture)[1]).toEqual(['Feet and inches', '6\' 4 1/4"']);
    expect(rows(fixture)[2]).toEqual(['Decimal inches', '76.25"']);
  });

  it('replaces the results with a message when the length is negative', async () => {
    const fixture = render();
    await type(fixture, '-5');

    expect(rows(fixture)).toEqual([]);
    expect(pageText(fixture)).toContain("A length can't be negative.");
  });

  it('marks the field invalid for unreadable text and valid again once corrected', async () => {
    const fixture = render();
    await type(fixture, 'abc');

    expect(field(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(field(fixture).getAttribute('aria-describedby')).toBe('length-hint length-error');

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[role="alert"], [aria-live]:not(dl)')).toHaveLength(1);

    await type(fixture, '12');

    expect(field(fixture).hasAttribute('aria-invalid')).toBe(false);
  });

  it('marks the field invalid for a negative length and valid again once corrected', async () => {
    const fixture = render();
    await type(fixture, '-5');

    expect(field(fixture).getAttribute('aria-invalid')).toBe('true');

    await type(fixture, '5');

    expect(field(fixture).hasAttribute('aria-invalid')).toBe(false);
  });

  it('clears the message when the field is emptied', async () => {
    const fixture = render();
    await type(fixture, 'abc');
    await type(fixture, '');

    expect(pageText(fixture)).not.toContain("can't");
  });

  it('announces results politely', async () => {
    const fixture = render();
    await type(fixture, '5');

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('dl')!.getAttribute('aria-live')).toBe('polite');
  });

  describe('copying a result', () => {
    function stubClipboard(writeText = vi.fn().mockResolvedValue(undefined)): typeof writeText {
      vi.stubGlobal('navigator', { clipboard: { writeText } });
      return writeText;
    }

    function copyButton(fixture: ComponentFixture<UnitConverterPage>, name: string): HTMLElement {
      const match = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
        (button) => button.getAttribute('aria-label') === name,
      );
      if (!match) {
        throw new Error(`No button named ${name}.`);
      }
      return match;
    }

    function status(fixture: ComponentFixture<UnitConverterPage>): string {
      return (fixture.nativeElement as HTMLElement)
        .querySelector('[role="status"]')!
        .textContent.trim();
    }

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('gives every result a copy control named after its unit', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');

      const names = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].map(
        (button) => button.getAttribute('aria-label'),
      );
      expect(names).toEqual([
        'Copy millimetres',
        'Copy centimetres',
        'Copy metres',
        'Copy fractional inches',
        'Copy feet and inches',
        'Copy decimal inches',
      ]);
    });

    it('shows every copy control in the small size', async () => {
      const fixture = render();
      await type(fixture, '89');

      const sizes = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].map(
        (button) => button.getAttribute('size'),
      );
      expect(sizes).toHaveLength(6);
      expect(new Set(sizes)).toEqual(new Set(['small']));
    });

    it('writes an exact result to the clipboard as shown', async () => {
      const writeText = stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '3 1/2"');

      copyButton(fixture, 'Copy millimetres').click();
      await fixture.whenStable();

      expect(writeText).toHaveBeenCalledExactlyOnceWith('88.9 mm');
    });

    it('writes an approximate result without the ≈ marker', async () => {
      const writeText = stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '3 1/2"');

      expect(rows(fixture)[2]).toEqual(['Metres', '≈ 0.089 m']);
      copyButton(fixture, 'Copy metres').click();
      await fixture.whenStable();

      expect(writeText).toHaveBeenCalledExactlyOnceWith('0.089 m');
    });

    it('confirms the copy in a status message', async () => {
      stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');
      expect(status(fixture)).toBe('');

      copyButton(fixture, 'Copy centimetres').click();
      await fixture.whenStable();

      expect(status(fixture)).toBe('Copied centimetres');
    });

    it('removes the confirmation after a few seconds', async () => {
      stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      copyButton(fixture, 'Copy centimetres').click();
      await vi.advanceTimersByTimeAsync(4900);
      expect(status(fixture)).toBe('Copied centimetres');
      await vi.advanceTimersByTimeAsync(200);
      vi.useRealTimers();
      await fixture.whenStable();

      expect(status(fixture)).toBe('');
    });

    it('keeps a second confirmation for its full time after a repeated copy', async () => {
      stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      copyButton(fixture, 'Copy centimetres').click();
      await vi.advanceTimersByTimeAsync(3000);
      copyButton(fixture, 'Copy metres').click();
      await vi.advanceTimersByTimeAsync(3000);
      vi.useRealTimers();
      await fixture.whenStable();

      expect(status(fixture)).toBe('Copied metres');
    });

    it('drops the confirmation when the length changes', async () => {
      stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');
      copyButton(fixture, 'Copy centimetres').click();
      await fixture.whenStable();

      await type(fixture, '90');

      expect(status(fixture)).toBe('');
    });

    it('says so when there is no clipboard', async () => {
      vi.stubGlobal('navigator', {});
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');

      copyButton(fixture, 'Copy centimetres').click();
      await fixture.whenStable();

      expect(status(fixture)).toBe("Couldn't copy centimetres");
    });

    it('says so when the clipboard refuses', async () => {
      stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      await type(fixture, '89');

      copyButton(fixture, 'Copy centimetres').click();
      await fixture.whenStable();

      expect(status(fixture)).toBe("Couldn't copy centimetres");
    });

    it('is named and confirmed in Spanish', async () => {
      stubClipboard();
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      TestBed.inject(TranslocoService).setActiveLang('es');
      await fixture.whenStable();
      await type(fixture, '89');

      copyButton(fixture, 'Copiar milímetros').click();
      await fixture.whenStable();

      expect(status(fixture)).toBe('Copiado: milímetros');
    });

    it('has no accessibility violations once confirmed', async () => {
      stubClipboard();
      const fixture = render();
      await type(fixture, '3 1/2"');
      copyButton(fixture, 'Copy millimetres').click();
      await fixture.whenStable();

      await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
    });
  });

  describe('in Spanish', () => {
    it('shows Spanish labels and number formatting', async () => {
      const fixture = render();
      TestBed.inject(SettingsStore).setUnitSystem('metric');
      TestBed.inject(TranslocoService).setActiveLang('es');
      await fixture.whenStable();
      await type(fixture, '3 1/2"');

      expect(rows(fixture)[0]).toEqual(['Milímetros', '88,9 mm']);
      expect(rows(fixture)[3]).toEqual(['Pulgadas fraccionarias', '3 1/2"']);
    });

    it('shows the unreadable message in Spanish', async () => {
      const fixture = render();
      TestBed.inject(TranslocoService).setActiveLang('es');
      await fixture.whenStable();
      await type(fixture, 'abc');

      expect(pageText(fixture)).toContain('No se puede leer esa longitud.');
    });

    it('shows the messages in Spanish', async () => {
      const fixture = render();
      TestBed.inject(TranslocoService).setActiveLang('es');
      await fixture.whenStable();
      await type(fixture, '-5');

      expect(pageText(fixture)).toContain('Una longitud no puede ser negativa.');
    });
  });

  it('shows the same text and results when the page is opened again in the session', async () => {
    const first = render();
    await type(first, '3 1/2"');
    first.destroy();

    const second = TestBed.createComponent(UnitConverterPage);
    await second.whenStable();

    expect(field(second).value).toBe('3 1/2"');
    expect(rows(second)).toContainEqual(['Millimetres', '88.9 mm']);
  });

  it('starts empty in a fresh app', async () => {
    const first = render();
    await type(first, '3 1/2"');
    expect(field(first).value).toBe('3 1/2"');
    TestBed.resetTestingModule();

    const fresh = render();
    await fresh.whenStable();

    expect(field(fresh).value).toBe('');
    expect(rows(fresh)).toEqual([]);
  });

  it('has no accessibility violations with results shown', async () => {
    const fixture = render();
    await type(fixture, '3 1/2"');

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });

  it('has no accessibility violations with a message shown', async () => {
    const fixture = render();
    await type(fixture, 'abc');

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });
});
