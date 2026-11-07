import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { Icon } from '../icon/icon';
import { NavLink } from './nav-link';

@Component({ selector: 'wt-blank', template: '' })
class Blank {}

@Component({
  selector: 'wt-host',
  imports: [Icon, NavLink, RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Tools">
      <a wt-nav-link routerLink="/cut-optimizer" routerLinkActive ariaCurrentWhenActive="page">
        <wt-icon name="menu" />
        Cut Optimizer
      </a>
      <a wt-nav-link routerLink="/unit-converter" routerLinkActive ariaCurrentWhenActive="page">
        Unit Converter
      </a>
    </nav>
  `,
})
class Host {}

async function render(
  url: string,
): Promise<{ fixture: ComponentFixture<Host>; root: HTMLElement }> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'cut-optimizer', component: Blank },
        { path: 'unit-converter', component: Blank },
      ]),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

/** The links as `[text, href, aria-current]` triples. */
function links(root: HTMLElement): [string, string | null, string | null][] {
  return [...root.querySelectorAll('a')].map((link) => [
    link.textContent.trim(),
    link.getAttribute('href'),
    link.getAttribute('aria-current'),
  ]);
}

describe('NavLink', () => {
  it('shows the content it is given, icon included', async () => {
    const { root } = await render('/unit-converter');

    const [first] = root.querySelectorAll('a');
    expect(first.textContent.trim()).toBe('Cut Optimizer');
    expect(first.querySelectorAll('wt-icon svg')).toHaveLength(1);
  });

  // NavLink only styles its host: the current page is marked by `routerLinkActive`
  // (`ariaCurrentWhenActive="page"`), the attribute its styles key off. These two
  // tests pin that contract.
  it("marks only the current page's link as the current page", async () => {
    const { root } = await render('/cut-optimizer');

    expect(links(root)).toEqual([
      ['Cut Optimizer', '/cut-optimizer', 'page'],
      ['Unit Converter', '/unit-converter', null],
    ]);
  });

  it('moves the current page mark when the user moves to another page', async () => {
    const { fixture, root } = await render('/cut-optimizer');

    root.querySelectorAll('a')[1].click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/unit-converter');
    expect(links(root)).toEqual([
      ['Cut Optimizer', '/cut-optimizer', null],
      ['Unit Converter', '/unit-converter', 'page'],
    ]);
  });

  it('has no axe violations', async () => {
    const { root } = await render('/cut-optimizer');

    await expectNoAxeViolations(root);
  });
});
