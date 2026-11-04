import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { otherTool, testTool } from '../../testing/test-tool/test-tool';
import { TestToolSettings } from '../../testing/test-tool/test-tool-settings';
import { expectNoAxeViolations } from '../../testing/expect-no-axe-violations';
import { translocoTesting } from '../../testing/transloco-testing';
import { App } from '../app';
import { appRoutes } from '../app.routes';
import type { ToolEntry } from '../core/tool-registry/tool-entry';
import { SettingsStore } from '../core/settings/settings-store';
import { TOOL_REGISTRY } from '../core/tool-registry/tool-registry';

async function navigate(fixture: ComponentFixture<App>, url: string): Promise<void> {
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
}

/** The whole app at `url` (the settings page unless given), with only `tools` registered. */
async function openSettings(
  tools: readonly ToolEntry[] = [testTool()],
  url = '/settings',
): Promise<{ page: HTMLElement; fixture: ComponentFixture<App> }> {
  // An en-GB browser starts in Metric.
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB']);
  TestBed.configureTestingModule({
    imports: [translocoTesting()],
    providers: [provideRouter(appRoutes(tools)), { provide: TOOL_REGISTRY, useValue: tools }],
  });
  const fixture = TestBed.createComponent(App);
  await navigate(fixture, url);
  return { page: fixture.nativeElement as HTMLElement, fixture };
}

/** The text of the elements an element's `aria-labelledby` points at. */
function accessibleName(page: HTMLElement, element: Element): string {
  return (element.getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .map((id) => page.querySelector(`#${id}`)?.textContent.trim())
    .join(' ');
}

/** The radio buttons inside the group named `name`, as `[label, checked]` pairs. */
function radios(page: HTMLElement, name: string): [string, boolean][] {
  const group = [...page.querySelectorAll('[role="radiogroup"]')].find(
    (candidate) => accessibleName(page, candidate) === name,
  );
  return [...(group?.querySelectorAll('label') ?? [])].map((label) => [
    label.textContent.trim(),
    label.querySelector('input')?.checked ?? false,
  ]);
}

function radio(page: HTMLElement, label: string): HTMLInputElement {
  const match = [...page.querySelectorAll('label')].find(
    (candidate) => candidate.textContent.trim() === label,
  );
  const input = match?.querySelector('input');
  if (!input) {
    throw new Error(`No radio button labelled "${label}".`);
  }
  return input;
}

/** The select whose `<label>` reads `label`. */
function select(page: HTMLElement, label: string): HTMLSelectElement {
  const match = [...page.querySelectorAll('main label')].find(
    (candidate) => candidate.textContent.trim() === label,
  );
  const control = page.querySelector(`#${match?.getAttribute('for') ?? 'missing'}`);
  if (!(control instanceof HTMLSelectElement)) {
    throw new Error(`No select labelled "${label}".`);
  }
  return control;
}

async function choose(
  fixture: ComponentFixture<App>,
  control: HTMLSelectElement,
  value: string,
): Promise<void> {
  control.value = value;
  control.dispatchEvent(new Event('change'));
  await fixture.whenStable();
}

/** A test Tool with a settings section, plus one without. */
function toolsWithSettings(
  loadSettingsSection = async (): Promise<typeof TestToolSettings> =>
    Promise.resolve(TestToolSettings),
): ToolEntry[] {
  return [testTool({ loadSettingsSection }), otherTool()];
}

/** Each section of the page as its heading and the labels of its controls. */
function sections(page: HTMLElement): { heading: string; labels: string[] }[] {
  return [...page.querySelectorAll('main section')].map((section) => ({
    heading: section.querySelector('h2')?.textContent.trim() ?? '',
    labels: [...section.querySelectorAll('label')].map((label) => label.textContent.trim()),
  }));
}

describe('the settings page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is served at /settings with "Settings" as its one h1', async () => {
    const { page } = await openSettings();

    expect(page.querySelector('main h1')?.textContent.trim()).toBe('Settings');
    expect(page.querySelectorAll('h1')).toHaveLength(1);
  });

  it("shows the store's Unit System and changes it when the user picks another", async () => {
    const { page, fixture } = await openSettings();
    expect(radios(page, 'Unit System')).toEqual([
      ['Metric', true],
      ['Imperial', false],
    ]);

    radio(page, 'Imperial').click();
    await fixture.whenStable();

    expect(TestBed.inject(SettingsStore).unitSystem()).toBe('imperial');
    expect(radios(page, 'Unit System')).toEqual([
      ['Metric', false],
      ['Imperial', true],
    ]);
  });

  it("shows the store's Imperial precision and changes it when the user picks another", async () => {
    const { page, fixture } = await openSettings();
    const precision = select(page, 'Imperial precision');
    expect([...precision.options].map((option) => option.textContent.trim())).toEqual([
      '1/8 in',
      '1/16 in',
      '1/32 in',
      '1/64 in',
    ]);
    expect(precision.selectedOptions.item(0)?.textContent.trim()).toBe('1/16 in');

    await choose(fixture, precision, '32');

    expect(TestBed.inject(SettingsStore).imperialPrecision()).toBe(32);
  });

  it('switches the language, translating the visible text in place', async () => {
    const { page, fixture } = await openSettings();
    const language = select(page, 'Language');
    expect([...language.options].map((option) => option.textContent.trim())).toEqual([
      'English',
      'Español',
    ]);

    await choose(fixture, language, 'es');

    expect(TestBed.inject(SettingsStore).language()).toBe('es');
    expect(page.querySelector('main h1')?.textContent.trim()).toBe('Ajustes');
    expect(radios(page, 'Sistema de medida')).toEqual([
      ['Métrico', true],
      ['Imperial', false],
    ]);
    expect(select(page, 'Precisión imperial').selectedOptions.item(0)?.textContent.trim()).toBe(
      '1/16 pulg.',
    );
    expect(select(page, 'Idioma')).toBe(language);
  });

  it("renders each Tool's settings section, under the Tool's name, after the general settings", async () => {
    const { page } = await openSettings(toolsWithSettings());

    expect(sections(page)).toEqual([
      {
        heading: 'General',
        labels: ['Metric', 'Imperial', 'Imperial precision', 'Language'],
      },
      { heading: 'Test Tool', labels: ['Test setting'] },
    ]);
  });

  it("loads a Tool's settings section only when the settings page is visited", async () => {
    const loadSettingsSection = vi.fn(async () => Promise.resolve(TestToolSettings));
    const { fixture } = await openSettings(toolsWithSettings(loadSettingsSection), '/');
    expect(loadSettingsSection).not.toHaveBeenCalled();

    await navigate(fixture, '/settings');

    expect(loadSettingsSection).toHaveBeenCalledOnce();
  });

  it('keeps what the user typed in a Tool section when the language changes', async () => {
    const { page, fixture } = await openSettings(toolsWithSettings());
    const field = page.querySelector<HTMLInputElement>('#test-setting');
    expect(field).not.toBeNull();
    field!.value = '3.2';

    await choose(fixture, select(page, 'Language'), 'es');

    expect(page.querySelector('main h1')?.textContent.trim()).toBe('Ajustes');
    expect(page.querySelector<HTMLInputElement>('#test-setting')?.value).toBe('3.2');
  });

  it('has no WCAG AA violations', async () => {
    const { page } = await openSettings(toolsWithSettings());

    await expectNoAxeViolations(page);
  });
});
