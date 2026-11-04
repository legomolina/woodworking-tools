import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { expectNoAxeViolations } from '../testing/expect-no-axe-violations';
import { translocoTesting } from '../testing/transloco-testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, translocoTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows the placeholder page in English', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('Woodworking Tools');
    expect(compiled.querySelector('p')?.textContent).toBe(
      'Calculators and utilities for woodworkers. Coming soon.',
    );
  });

  it('switches the visible text to Spanish at runtime', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toBe(
      'Calculadoras y utilidades para carpinteros. Próximamente.',
    );
  });

  it('has no WCAG AA violations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });
});
