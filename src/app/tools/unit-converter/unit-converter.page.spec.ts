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

  it('clears the message when the field is emptied', async () => {
    const fixture = render();
    await type(fixture, 'abc');
    await type(fixture, '');

    expect(pageText(fixture)).not.toContain("can't");
  });

  it('announces results and messages politely', async () => {
    const fixture = render();
    await type(fixture, '5');

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('dl')!.getAttribute('aria-live')).toBe('polite');
    expect(root.querySelector('div[aria-live]')!.getAttribute('aria-live')).toBe('polite');
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
