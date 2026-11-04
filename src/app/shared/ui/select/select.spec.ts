import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { Select } from './select';
import type { SelectOption } from './select';

const LANGUAGES: readonly SelectOption[] = [
  { value: 'en', label: 'English', lang: 'en' },
  { value: 'es', label: 'Español', lang: 'es' },
];

const PRECISIONS: readonly SelectOption[] = [
  { value: '8', label: '1/8 in' },
  { value: '16', label: '1/16 in' },
];

@Component({
  selector: 'wt-host',
  imports: [Select],
  template: `
    <label for="choice">Choice</label>
    <select
      wt-select
      id="choice"
      [measurement]="measurement()"
      [options]="options()"
      [(value)]="value"
    ></select>
  `,
})
class Host {
  readonly options = signal<readonly SelectOption[]>(LANGUAGES);
  readonly value = signal('es');
  readonly measurement = signal(false);
}

async function render(
  setup: { options?: readonly SelectOption[]; value?: string; measurement?: boolean } = {},
): Promise<{ fixture: ComponentFixture<Host>; select: HTMLSelectElement }> {
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  host.options.set(setup.options ?? LANGUAGES);
  host.value.set(setup.value ?? 'es');
  host.measurement.set(setup.measurement ?? false);
  await fixture.whenStable();
  const select = (fixture.nativeElement as HTMLElement).querySelector('select');
  if (!select) {
    throw new Error('No select rendered.');
  }
  return { fixture, select };
}

/** The options as `[label, value, lang, selected]` tuples. */
function optionTuples(select: HTMLSelectElement): [string, string, string | null, boolean][] {
  return [...select.options].map((option) => [
    option.textContent.trim(),
    option.value,
    option.getAttribute('lang'),
    option.selected,
  ]);
}

describe('Select', () => {
  it('lists one option per choice, in order, with the bound value selected', async () => {
    const { select } = await render();

    expect(optionTuples(select)).toEqual([
      ['English', 'en', 'en', false],
      ['Español', 'es', 'es', true],
    ]);
  });

  it('marks no language on an option whose label is in the page language', async () => {
    const { select } = await render({ options: PRECISIONS, value: '16' });

    expect(optionTuples(select)).toEqual([
      ['1/8 in', '8', null, false],
      ['1/16 in', '16', null, true],
    ]);
  });

  it('sets the bound value when the user chooses an option', async () => {
    const { fixture, select } = await render();

    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('en');
    expect(select.selectedOptions[0].textContent.trim()).toBe('English');
  });

  it('selects the option whose value is set from outside', async () => {
    const { fixture, select } = await render();

    fixture.componentInstance.value.set('en');
    await fixture.whenStable();

    expect(select.value).toBe('en');
  });

  it('reflects whether its options are measurements', async () => {
    const { fixture, select } = await render();
    expect(select.hasAttribute('measurement')).toBe(false);

    fixture.componentInstance.measurement.set(true);
    await fixture.whenStable();

    expect(select.hasAttribute('measurement')).toBe(true);
  });

  it('has no axe violations', async () => {
    const { fixture } = await render();

    await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
  });
});
