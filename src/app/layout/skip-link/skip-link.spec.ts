import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { expectNoAxeViolations } from '../../../testing/expect-no-axe-violations';
import { translocoTesting } from '../../../testing/transloco-testing';
import { SkipLink } from './skip-link';

@Component({
  selector: 'wt-host',
  imports: [SkipLink],
  template: `
    <wt-skip-link [target]="main" />
    <header><a href="/">Home</a></header>
    <main #main id="page-content" tabindex="-1"><h1>Page</h1></main>
  `,
})
class Host {}

async function render(): Promise<{
  fixture: ComponentFixture<Host>;
  root: HTMLElement;
  link: HTMLAnchorElement;
}> {
  TestBed.configureTestingModule({ imports: [translocoTesting()] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const link = root.querySelector<HTMLAnchorElement>('wt-skip-link a');
  if (!link) {
    throw new Error('No skip link rendered.');
  }
  return { fixture, root, link };
}

describe('SkipLink', () => {
  it("is the page's first link, pointing at the main content", async () => {
    const { root, link } = await render();

    expect(root.querySelector('a')).toBe(link);
    expect(link.textContent.trim()).toBe('Skip to main content');
    expect(link.getAttribute('href')).toBe('#page-content');
  });

  it('is translated', async () => {
    const { fixture, link } = await render();

    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();

    expect(link.textContent.trim()).toBe('Saltar al contenido principal');
  });

  it('moves focus to the main content instead of following the fragment', async () => {
    const { root, link } = await render();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(click);

    expect(document.activeElement).toBe(root.querySelector('main'));
    expect(click.defaultPrevented).toBe(true);
  });

  it('has no axe violations', async () => {
    const { root } = await render();

    await expectNoAxeViolations(root);
  });
});
