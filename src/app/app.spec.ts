import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expectNoAxeViolations } from '../testing/expect-no-axe-violations';
import type { ToolEntry } from './core/tool-registry/tool-entry';
import { otherTool, testTool } from '../testing/test-tool/test-tool';
import { translocoTesting } from '../testing/transloco-testing';
import { App } from './app';
import { appRoutes } from './app.routes';
import { TOOL_REGISTRY } from './core/tool-registry/tool-registry';

async function navigate(fixture: ComponentFixture<App>, url: string): Promise<void> {
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
}

/** The whole app (shell and routes) with only test Tools registered. */
async function setUp(
  url: string,
  tools: readonly ToolEntry[] = [testTool(), otherTool()],
): Promise<{ page: HTMLElement; fixture: ComponentFixture<App> }> {
  TestBed.configureTestingModule({
    imports: [translocoTesting()],
    providers: [provideRouter(appRoutes(tools)), { provide: TOOL_REGISTRY, useValue: tools }],
  });
  const fixture = TestBed.createComponent(App);
  await navigate(fixture, url);
  return { page: fixture.nativeElement as HTMLElement, fixture };
}

describe('the app shell', () => {
  describe('home page', () => {
    it("lists every registered Tool with its name and description, linking to the Tool's page", async () => {
      const { page } = await setUp('/');

      const cards = [...page.querySelectorAll<HTMLAnchorElement>('main li a')];
      expect(
        cards.map((card) => ({
          href: card.getAttribute('href'),
          name: card.querySelector('h2')?.textContent.trim(),
          description: card.querySelector('p')?.textContent.trim(),
        })),
      ).toEqual([
        { href: '/test-tool', name: 'Test Tool', description: 'A Tool for tests.' },
        { href: '/other-tool', name: 'Other Tool', description: 'Another Tool for tests.' },
      ]);
    });

    it('says the Tools are on their way while none is registered', async () => {
      const { page } = await setUp('/', []);

      expect(page.querySelector('main ul, header nav')).toBeNull();
      expect([...page.querySelectorAll('main p')].map((p) => p.textContent.trim())).toEqual([
        'Quick, exact answers for the workshop: convert measurements and plan your cuts.',
        'The first Tools are on their way.',
      ]);
    });
  });

  it("renders a Tool's page inside the main landmark, with the Tool's h1 as the page's only h1", async () => {
    const { page } = await setUp('/test-tool');

    expect(page.querySelector('main h1')?.textContent).toBe('Test Tool');
    expect(page.querySelectorAll('h1')).toHaveLength(1);
  });

  it('links the brand to the home page from any page', async () => {
    const { page } = await setUp('/test-tool');

    const brand = page.querySelector<HTMLAnchorElement>('header a[href="/"]');
    expect(brand?.textContent.trim()).toBe('Woodworking Tools');
  });

  it("marks the current Tool's link in the Tools navigation", async () => {
    const { page } = await setUp('/test-tool');

    const links = [...page.querySelectorAll('header nav a')];
    expect(
      links.map((link) => [link.textContent.trim(), link.getAttribute('aria-current')]),
    ).toEqual([
      ['Test Tool', 'page'],
      ['Other Tool', null],
    ]);
  });

  it('links to the settings from the header', async () => {
    const { page } = await setUp('/');

    const settings = [...page.querySelectorAll('header a')].filter(
      (link) => link.textContent.trim() === 'Settings',
    );
    expect(settings.map((link) => link.getAttribute('href'))).toEqual(['/settings']);
  });

  it('has a Menu button that opens a popover with the Tools and the settings', async () => {
    const { page } = await setUp('/');

    const button = [...page.querySelectorAll('button')].find(
      (candidate) => candidate.textContent.trim() === 'Menu',
    );
    const menu = page.querySelector(`#${button?.getAttribute('popovertarget') ?? 'missing'}`);
    expect(menu?.getAttribute('popover')).toBe('auto');
    expect(
      [...(menu?.querySelectorAll('a') ?? [])].map((link) => link.getAttribute('href')),
    ).toEqual(['/test-tool', '/other-tool', '/settings']);
  });

  it('moves focus to the main content with the skip link, without leaving the page', async () => {
    const { page, fixture } = await setUp('/test-tool');
    const skipLink = page.querySelector<HTMLAnchorElement>('a[href="#main-content"]');

    skipLink?.click();
    await fixture.whenStable();

    expect(skipLink?.textContent.trim()).toBe('Skip to main content');
    expect(document.activeElement).toBe(page.querySelector('main'));
    expect(TestBed.inject(Router).url).toBe('/test-tool');
  });

  it('moves focus to the main content after moving to another page, so the reader starts there', async () => {
    const { page, fixture } = await setUp('/no-such-page');
    expect(document.activeElement).not.toBe(page.querySelector('main'));

    await navigate(fixture, '/');

    expect(document.activeElement).toBe(page.querySelector('main'));
  });

  it("switches the page's language from the footer", async () => {
    const { page, fixture } = await setUp('/');
    const select = page.querySelector<HTMLSelectElement>('footer select');
    expect(select?.value).toBe('en');

    select!.value = 'es';
    select!.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(page.querySelector('label[for="language"]')?.textContent.trim()).toBe('Idioma');
    expect(page.querySelector('main li h2')?.textContent).toBe('Herramienta de prueba');
  });

  it('shows a page not found, with a way home, at an unknown address', async () => {
    const { page } = await setUp('/no-such-page');

    expect(page.querySelector('main h1')?.textContent).toBe('Page not found');
    expect(page.querySelector('main a')?.getAttribute('href')).toBe('/');
  });

  it.each(['/', '/test-tool', '/no-such-page'])('has no WCAG AA violations at %s', async (url) => {
    const { page } = await setUp(url);

    await expectNoAxeViolations(page);
  });
});
