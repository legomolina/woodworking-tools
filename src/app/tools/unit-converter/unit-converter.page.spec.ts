import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import en from '../../../../public/i18n/en.json';
import es from '../../../../public/i18n/es.json';
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

describe('UnitConverterPage', () => {
  it("shows the Tool's name as its only h1 in English", async () => {
    const fixture = render();
    await fixture.whenStable();

    const headings = [...(fixture.nativeElement as HTMLElement).querySelectorAll('h1')];
    expect(headings.map((h1) => h1.textContent.trim())).toEqual([en.tools.unitConverter.name]);
    expect(en.tools.unitConverter.name).toBe('Unit Converter');
  });

  it("shows the Tool's name as its only h1 in Spanish", async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    const headings = [...(fixture.nativeElement as HTMLElement).querySelectorAll('h1')];
    expect(headings.map((h1) => h1.textContent.trim())).toEqual(['Conversor de unidades']);
    expect(es.tools.unitConverter.name).toBe('Conversor de unidades');
  });

  it('introduces the Tool in the active language', async () => {
    const fixture = render();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(unitConverterEn.intro);
  });

  it('has no accessibility violations', async () => {
    const fixture = render();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });
});
