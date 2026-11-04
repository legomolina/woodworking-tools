import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { ToolEntry } from '../../core/tool-registry/tool-entry';
import { TOOL_REGISTRY } from '../../core/tool-registry/tool-registry';
import { expectNoAxeViolations } from '../../../testing/expect-no-axe-violations';
import { otherTool, testTool } from '../../../testing/test-tool/test-tool';
import { translocoTesting } from '../../../testing/transloco-testing';
import { SiteHeader } from './site-header';

@Component({ selector: 'wt-blank', template: '' })
class Blank {}

async function render(
  url = '/',
  tools: readonly ToolEntry[] = [testTool(), otherTool()],
): Promise<{ fixture: ComponentFixture<SiteHeader>; root: HTMLElement }> {
  TestBed.configureTestingModule({
    imports: [translocoTesting()],
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      { provide: TOOL_REGISTRY, useValue: tools },
    ],
  });
  const fixture = TestBed.createComponent(SiteHeader);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

/** The links in `container` as `[text, href, aria-current]` triples. */
function links(container: Element | null): [string, string | null, string | null][] {
  return [...(container?.querySelectorAll('a') ?? [])].map((link) => [
    link.textContent.trim(),
    link.getAttribute('href'),
    link.getAttribute('aria-current'),
  ]);
}

function menuButton(root: HTMLElement): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (candidate) => candidate.textContent.trim() === 'Menu',
  );
  if (!button) {
    throw new Error('No Menu button rendered.');
  }
  return button;
}

function menu(root: HTMLElement): HTMLElement {
  const target = root.querySelector<HTMLElement>(
    `#${menuButton(root).getAttribute('popovertarget') ?? 'missing'}`,
  );
  if (!target) {
    throw new Error("The Menu button's popover target is missing.");
  }
  return target;
}

/** What the browser fires on the Menu popover when it opens or closes. */
function toggle(newState: 'open' | 'closed'): Event {
  return Object.assign(new Event('toggle'), {
    oldState: newState === 'open' ? 'closed' : 'open',
    newState,
  });
}

describe('SiteHeader', () => {
  it('links the brand to the home page', async () => {
    const { root } = await render('/test-tool');

    expect(links(root.querySelector('header')).slice(0, 1)).toEqual([
      ['Woodworking Tools', '/', null],
    ]);
  });

  it('has a Tools navigation with a link to each Tool, marking the current one', async () => {
    const { root } = await render('/test-tool');

    const nav = root.querySelector('header nav');
    expect(nav?.getAttribute('aria-label')).toBe('Tools');
    expect(links(nav)).toEqual([
      ['Test Tool', '/test-tool', 'page'],
      ['Other Tool', '/other-tool', null],
    ]);
  });

  it('has no Tools navigation while no Tool is registered', async () => {
    const { root } = await render('/', []);

    expect(root.querySelectorAll('nav')).toHaveLength(0);
    expect(links(menu(root))).toEqual([['Settings', '/settings', null]]);
  });

  it('links to the settings, marked while on the settings page', async () => {
    const { root } = await render('/settings');

    const settings = links(root.querySelector('header')).filter(([text]) => text === 'Settings');
    expect(settings).toEqual([['Settings', '/settings', 'page']]);
  });

  it('has a Menu button that controls a popover with the Tools and the settings', async () => {
    const { root } = await render('/other-tool');

    expect(menu(root).getAttribute('popover')).toBe('auto');
    expect(menu(root).querySelector('nav')?.getAttribute('aria-label')).toBe('Tools');
    expect(links(menu(root))).toEqual([
      ['Test Tool', '/test-tool', null],
      ['Other Tool', '/other-tool', 'page'],
      ['Settings', '/settings', null],
    ]);
  });

  // jsdom has no Popover API: opening, closing, Escape and light dismiss are
  // covered by e2e/shell.spec.ts. This checks the state the button announces.
  it('announces whether the Menu is open', async () => {
    const { fixture, root } = await render();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('false');

    menu(root).dispatchEvent(toggle('open'));
    await fixture.whenStable();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('true');

    menu(root).dispatchEvent(toggle('closed'));
    await fixture.whenStable();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('false');
  });

  it('has no axe violations', async () => {
    const { root } = await render('/test-tool');

    await expectNoAxeViolations(root);
  });
});
