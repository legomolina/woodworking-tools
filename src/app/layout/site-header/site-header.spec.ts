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

interface SlowPage {
  readonly loaded: Promise<typeof Blank>;
  readonly load: () => void;
}

/** Holds back the `/slow` page until `load()`, like a lazy-loaded chunk on a slow connection. */
function holdBackSlowPage(): SlowPage {
  let resolve: (page: typeof Blank) => void = () => undefined;
  const loaded = new Promise<typeof Blank>((resolveLoaded) => {
    resolve = resolveLoaded;
  });
  return {
    loaded,
    load: (): void => {
      resolve(Blank);
    },
  };
}

function setUp(tools: readonly ToolEntry[] = [testTool(), otherTool()]): {
  fixture: ComponentFixture<SiteHeader>;
  root: HTMLElement;
  slowPage: SlowPage;
} {
  const page = holdBackSlowPage();
  TestBed.configureTestingModule({
    imports: [translocoTesting()],
    providers: [
      provideRouter([
        { path: 'slow', loadComponent: async (): Promise<typeof Blank> => page.loaded },
        { path: '**', component: Blank },
      ]),
      { provide: TOOL_REGISTRY, useValue: tools },
    ],
  });
  const fixture = TestBed.createComponent(SiteHeader);
  return { fixture, root: fixture.nativeElement as HTMLElement, slowPage: page };
}

async function render(
  url = '/',
  tools?: readonly ToolEntry[],
): Promise<{ fixture: ComponentFixture<SiteHeader>; root: HTMLElement; slowPage: SlowPage }> {
  const rendered = setUp(tools);
  await TestBed.inject(Router).navigateByUrl(url);
  await rendered.fixture.whenStable();
  return rendered;
}

/** Lets a navigation that has just started run until it waits on `/slow`, then updates the view. */
async function settle(fixture: ComponentFixture<SiteHeader>): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve);
  });
  fixture.detectChanges();
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
function popoverToggleEvent(newState: 'open' | 'closed'): Event {
  return Object.assign(new Event('toggle'), {
    oldState: newState === 'open' ? 'closed' : 'open',
    newState,
  });
}

/**
 * Gives the Menu the part of the Popover API jsdom lacks: `showPopover()`,
 * `hidePopover()`, `:popover-open` and the `toggle` events the browser fires.
 */
function fakePopover(element: HTMLElement): void {
  let open = false;
  const matches = element.matches.bind(element);
  Object.assign(element, {
    matches: (selectors: string): boolean =>
      selectors === ':popover-open' ? open : matches(selectors),
    showPopover: (): void => {
      open = true;
      element.dispatchEvent(popoverToggleEvent('open'));
    },
    hidePopover: (): void => {
      open = false;
      element.dispatchEvent(popoverToggleEvent('closed'));
    },
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

  // jsdom has no Popover API: opening, Escape and closing when focus moves past
  // the Menu are covered by e2e/shell.spec.ts. This checks the state the button
  // announces.
  it('announces whether the Menu is open', async () => {
    const { fixture, root } = await render();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('false');

    menu(root).dispatchEvent(popoverToggleEvent('open'));
    await fixture.whenStable();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('true');

    menu(root).dispatchEvent(popoverToggleEvent('closed'));
    await fixture.whenStable();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the Menu as soon as a navigation starts, such as following one of its links', async () => {
    const { fixture, root, slowPage } = await render('/');
    fakePopover(menu(root));
    menu(root).showPopover();
    await fixture.whenStable();
    expect(menuButton(root).getAttribute('aria-expanded')).toBe('true');

    const navigation = TestBed.inject(Router).navigateByUrl('/slow');
    await settle(fixture);

    expect(menuButton(root).getAttribute('aria-expanded')).toBe('false');
    slowPage.load();
    await navigation;
  });

  it('keeps a Menu opened while the page is still loading open once it has loaded', async () => {
    const { fixture, root, slowPage } = setUp();
    const firstNavigation = TestBed.inject(Router).navigateByUrl('/slow');
    await settle(fixture);
    fakePopover(menu(root));
    menu(root).showPopover();
    await settle(fixture);

    slowPage.load();
    await firstNavigation;
    await fixture.whenStable();

    expect(menuButton(root).getAttribute('aria-expanded')).toBe('true');
  });

  it('has no axe violations', async () => {
    const { root } = await render('/test-tool');

    await expectNoAxeViolations(root);
  });
});
