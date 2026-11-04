import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
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
});
