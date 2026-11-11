import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
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
  return TestBed.createComponent(BevelFenceCalculatorPage);
}

function headings(fixture: ComponentFixture<BevelFenceCalculatorPage>): string[] {
  const root = fixture.nativeElement as HTMLElement;
  return [...root.querySelectorAll('h1')].map((h1) => h1.textContent.trim());
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
      'Find where to set the Fence for a Bevel Cut.',
    );
  });

  it('introduces the Tool in Spanish', async () => {
    const fixture = render();
    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Averigua dónde colocar la guía paralela para un corte a bisel.',
    );
  });

  it('has no accessibility violations', async () => {
    const fixture = render();
    await fixture.whenStable();

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });
});
