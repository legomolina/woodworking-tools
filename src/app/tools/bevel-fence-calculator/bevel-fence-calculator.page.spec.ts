import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import bevelEn from '../../../../public/i18n/bevel-fence-calculator/en.json';
import bevelEs from '../../../../public/i18n/bevel-fence-calculator/es.json';
import { expectNoAxeViolations } from '../../../testing/expect-no-axe-violations';
import { translocoTesting } from '../../../testing/transloco-testing';
import BevelFenceCalculatorPage from './bevel-fence-calculator.page';

function render(): ComponentFixture<BevelFenceCalculatorPage> {
  TestBed.configureTestingModule({
    imports: [
      translocoTesting({
        'bevel-fence-calculator/en': bevelEn,
        'bevel-fence-calculator/es': bevelEs,
      }),
    ],
  });
  TestBed.inject(SettingsStore).setUnitSystem('metric');
  return TestBed.createComponent(BevelFenceCalculatorPage);
}

function headings(fixture: ComponentFixture<BevelFenceCalculatorPage>): string[] {
  const root = fixture.nativeElement as HTMLElement;
  return [...root.querySelectorAll('h1')].map((h1) => h1.textContent.trim());
}

async function type(
  fixture: ComponentFixture<BevelFenceCalculatorPage>,
  name: string,
  text: string,
): Promise<void> {
  await fixture.whenStable();
  const field = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${name}`)!;
  field.value = text;
  field.dispatchEvent(new Event('input'));
  await fixture.whenStable();
}

async function chooseShortFace(fixture: ComponentFixture<BevelFenceCalculatorPage>): Promise<void> {
  await fixture.whenStable();
  const radio = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
    'input[type="radio"][value="short"]',
  )!;
  radio.click();
  await fixture.whenStable();
}

async function fill(
  fixture: ComponentFixture<BevelFenceCalculatorPage>,
  values: { angle?: string; thickness?: string; length?: string },
): Promise<void> {
  await type(fixture, 'bevel-angle', values.angle ?? '45');
  await type(fixture, 'thickness', values.thickness ?? '19');
  await type(fixture, 'length', values.length ?? '300');
}

/** Each result section as its heading and the label/value pairs under it. */
function sections(fixture: ComponentFixture<BevelFenceCalculatorPage>): Record<string, string[][]> {
  const root = fixture.nativeElement as HTMLElement;
  return Object.fromEntries(
    [...root.querySelectorAll('section')].map((section) => [
      section.querySelector('h2')?.textContent.trim() ?? '',
      [...section.querySelectorAll('dl > div')].map((row) => [
        row.querySelector('dt')!.textContent.trim(),
        row.querySelector('dd')!.textContent.trim(),
      ]),
    ]),
  );
}

function input(
  fixture: ComponentFixture<BevelFenceCalculatorPage>,
  name: string,
): HTMLInputElement {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${name}`)!;
}

function alerts(fixture: ComponentFixture<BevelFenceCalculatorPage>): string[] {
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('[role="alert"]')].map((a) =>
    a.textContent.trim(),
  );
}

function pageText(fixture: ComponentFixture<BevelFenceCalculatorPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent;
}

describe('BevelFenceCalculatorPage', () => {
  it("shows the Tool's name as its only h1 in English", async () => {
    const fixture = render();
    await fixture.whenStable();

    expect(headings(fixture)).toEqual(['Bevel Fence Calculator']);
  });

  it("shows the Tool's name as its only h1 in Spanish", async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect(headings(fixture)).toEqual(['Calculadora de guía paralela para bisel']);
  });

  it('introduces the Tool in English', async () => {
    const fixture = render();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Find where to set the Fence for a Bevel Cut, so the Part ends up the length you want',
    );
  });

  it('introduces the Tool in Spanish', async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Averigua dónde colocar la guía paralela para un corte a bisel, de modo que la pieza quede',
    );
  });

  it('has no accessibility violations', async () => {
    const fixture = render();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });

  it('shows the Fence Position in every unit and the Short Face in millimetres from a Long Face', async () => {
    const fixture = render();
    await fill(fixture, {});

    expect(sections(fixture)).toEqual({
      'Fence Position': [
        ['Millimetres', '281 mm'],
        ['Centimetres', '28.1 cm'],
        ['Metres', '0.281 m'],
        ['Fractional inches', '≈ 11 1/16"'],
        ['Feet and inches', '≈ 11 1/16"'],
        ['Decimal inches', '≈ 11.063"'],
      ],
      'Short Face': [['Millimetres', '281 mm']],
    });
  });

  it('shows the Long Face when the length given is the Short Face', async () => {
    const fixture = render();
    await fill(fixture, { length: '281' });
    await chooseShortFace(fixture);

    const shown = sections(fixture);
    expect(shown['Fence Position'][0]).toEqual(['Millimetres', '281 mm']);
    expect(shown['Long Face'][0]).toEqual(['Millimetres', '300 mm']);
  });

  it('shows no result and no message while a value is empty', async () => {
    const fixture = render();
    await type(fixture, 'bevel-angle', '45');
    await type(fixture, 'thickness', '19');

    expect(sections(fixture)).toEqual({ '': [] });
    expect(alerts(fixture)).toEqual([]);
  });

  it('shows a message on the Bevel Angle field only, described by it', async () => {
    const fixture = render();
    await fill(fixture, { angle: '50' });

    expect(alerts(fixture)).toEqual(['The Bevel Angle must be between 0° and 45°.']);
    expect(input(fixture, 'bevel-angle').getAttribute('aria-invalid')).toBe('true');
    expect(input(fixture, 'bevel-angle').getAttribute('aria-describedby')).toContain(
      'bevel-angle-error',
    );
    expect(input(fixture, 'thickness').getAttribute('aria-invalid')).toBeNull();
    expect(input(fixture, 'length').getAttribute('aria-invalid')).toBeNull();
  });

  it('shows a message on the Thickness for text that cannot be read', async () => {
    const fixture = render();
    await fill(fixture, { thickness: 'abc' });

    expect(alerts(fixture)[0]).toContain("That length can't be read.");
    expect(input(fixture, 'thickness').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows a message on the length for a zero length', async () => {
    const fixture = render();
    await fill(fixture, { length: '0' });

    expect(alerts(fixture)).toEqual(['A length must be greater than zero.']);
    expect(input(fixture, 'length').getAttribute('aria-invalid')).toBe('true');
  });

  it('states the minimum Long Face when the Long Face is too short', async () => {
    const fixture = render();
    await fill(fixture, { length: '19' });

    expect(alerts(fixture)).toEqual([
      'At 45° the Long Face must be longer than 19 mm. Try a longer length or a smaller Bevel Angle.',
    ]);
    expect(input(fixture, 'length').getAttribute('aria-describedby')).toContain('length-error');
  });

  it('chooses the Long Face by default', async () => {
    const fixture = render();
    await fixture.whenStable();

    const radio = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="radio"][value="long"]',
    )!;
    expect(radio.checked).toBe(true);
  });

  it('announces results politely', async () => {
    const fixture = render();
    await fill(fixture, {});

    const lists = (fixture.nativeElement as HTMLElement).querySelectorAll('section dl');
    expect([...lists].map((list) => list.getAttribute('aria-live'))).toEqual(['polite', 'polite']);
  });

  it('names the length field after the face chosen', async () => {
    const fixture = render();
    await fixture.whenStable();
    const label = (): string | undefined =>
      (fixture.nativeElement as HTMLElement)
        .querySelector('label[for="length"]')
        ?.textContent.trim();

    expect(label()).toBe('Long Face length');

    await chooseShortFace(fixture);

    expect(label()).toBe('Short Face length');
  });

  it('explains how the other face relates to the Fence Position', async () => {
    const fixture = render();
    await fill(fixture, {});

    expect(pageText(fixture)).toContain('The Short Face equals the Fence Position.');

    await chooseShortFace(fixture);

    expect(pageText(fixture)).toContain(
      'The Long Face is the Short Face plus Thickness × tan of the Bevel Angle.',
    );
  });

  it('describes the Fence Position and reads the unit of the Bevel Angle with its field', async () => {
    const fixture = render();
    await fill(fixture, {});

    expect(pageText(fixture)).toContain(
      "Distance from the blade to the Fence, as read on your saw's ruler.",
    );
    expect(input(fixture, 'bevel-angle').getAttribute('aria-describedby')).toContain(
      'bevel-angle-unit',
    );
  });

  it('shows the note while there is no result', async () => {
    const fixture = render();
    await fixture.whenStable();

    expect(pageText(fixture)).toContain('Check your saw.');
  });

  it('states the Bevel Angle in the minimum Long Face message in Spanish format', async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fill(fixture, { angle: '22,5', thickness: '40', length: '10' });

    expect(alerts(fixture)).toEqual([
      'Con 22,5° la cara larga debe medir más de 16,6 mm. Prueba con una longitud mayor o un ángulo de bisel menor.',
    ]);
  });

  it("shows the note about the ruler's zero", async () => {
    const fixture = render();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "The blade is taken to meet the table at the ruler's zero at every Bevel Angle.",
    );
  });

  it('shows results in the preferred Unit System first', async () => {
    const fixture = render();
    TestBed.inject(SettingsStore).setUnitSystem('imperial');
    await fill(fixture, { thickness: '0.75', length: '12' });

    expect(sections(fixture)['Fence Position'][0][0]).toBe('Fractional inches');
  });

  it('shows labels, results and number formatting in Spanish', async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fill(fixture, { angle: '45', thickness: '19', length: '300,5' });

    const shown = sections(fixture);
    expect(shown['Posición de la guía paralela'][1]).toEqual(['Centímetros', '28,15 cm']);
    expect(shown['Cara corta'][0]).toEqual(['Milímetros', '281,5 mm']);
  });

  it('shows messages in Spanish', async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fill(fixture, { angle: '50' });

    expect(alerts(fixture)).toEqual(['El ángulo de bisel debe estar entre 0° y 45°.']);
  });

  it('has no accessibility violations with results', async () => {
    const fixture = render();
    await fill(fixture, {});

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });

  it('has no accessibility violations with a message', async () => {
    const fixture = render();
    await fill(fixture, { length: '19' });

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });
});
