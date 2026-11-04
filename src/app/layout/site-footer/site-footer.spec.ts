import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { SettingsStore } from '../../core/settings/settings-store';
import { expectNoAxeViolations } from '../../../testing/expect-no-axe-violations';
import { translocoTesting } from '../../../testing/transloco-testing';
import { SiteFooter } from './site-footer';

async function render(): Promise<{
  fixture: ComponentFixture<SiteFooter>;
  root: HTMLElement;
  select: HTMLSelectElement;
}> {
  TestBed.configureTestingModule({ imports: [translocoTesting()] });
  const fixture = TestBed.createComponent(SiteFooter);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const select = root.querySelector('select');
  if (!select) {
    throw new Error('No language picker rendered.');
  }
  return { fixture, root, select };
}

async function choose(
  fixture: ComponentFixture<SiteFooter>,
  select: HTMLSelectElement,
  value: string,
): Promise<void> {
  select.value = value;
  select.dispatchEvent(new Event('change'));
  await fixture.whenStable();
}

describe('SiteFooter', () => {
  it('is a footer saying nothing typed leaves the browser', async () => {
    const { root } = await render();

    expect(root.querySelector('footer p')?.textContent.trim()).toBe(
      'Runs entirely in your browser. Nothing you type is sent anywhere.',
    );
  });

  it('has a labelled language picker offering each language in itself, with the current one selected', async () => {
    const { select } = await render();

    expect([...select.labels].map((label) => label.textContent.trim())).toEqual(['Language']);
    expect(
      [...select.options].map((option) => [
        option.textContent.trim(),
        option.getAttribute('lang'),
        option.selected,
      ]),
    ).toEqual([
      ['English', 'en', true],
      ['Español', 'es', false],
    ]);
  });

  it('switches the language when the user picks another one', async () => {
    const { fixture, root, select } = await render();

    await choose(fixture, select, 'es');

    expect(TestBed.inject(SettingsStore).language()).toBe('es');
    expect([...select.labels].map((label) => label.textContent.trim())).toEqual(['Idioma']);
    expect(root.querySelector('footer p')?.textContent.trim()).toBe(
      'Funciona por completo en tu navegador. Nada de lo que escribes se envía a ningún sitio.',
    );
  });

  it('selects the language switched from elsewhere', async () => {
    const { fixture, select } = await render();

    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect(select.value).toBe('es');
  });

  it('ignores a value that is not a language the UI ships in', async () => {
    const { fixture, select } = await render();
    select.add(new Option('Klingon', 'tlh'));

    await choose(fixture, select, 'tlh');

    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('en');
  });

  it('has no axe violations', async () => {
    const { root } = await render();

    await expectNoAxeViolations(root);
  });
});
