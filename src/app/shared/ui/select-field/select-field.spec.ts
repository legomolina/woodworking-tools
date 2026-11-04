import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import type { SelectOption } from '../select/select';
import { SelectField } from './select-field';

const PRECISIONS: readonly SelectOption[] = [
  { value: '8', label: '1/8 in' },
  { value: '16', label: '1/16 in' },
  { value: '32', label: '1/32 in' },
];

@Component({
  selector: 'wt-host',
  imports: [SelectField],
  template: `
    <wt-select-field
      name="precision"
      label="Imperial precision"
      [hint]="hint()"
      [measurement]="measurement()"
      [options]="options"
      [(value)]="precision"
    />
  `,
})
class Host {
  readonly options = PRECISIONS;
  readonly precision = signal('16');
  readonly hint = signal<string | undefined>(undefined);
  readonly measurement = signal(false);
}

async function render(
  setup: { hint?: string; measurement?: boolean } = {},
): Promise<{ fixture: ComponentFixture<Host>; root: HTMLElement; select: HTMLSelectElement }> {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.hint.set(setup.hint);
  fixture.componentInstance.measurement.set(setup.measurement ?? false);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const select = root.querySelector('select');
  if (!select) {
    throw new Error('No select rendered.');
  }
  return { fixture, root, select };
}

function describedBy(root: HTMLElement, element: Element): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter((id) => id !== '')
    .map((id) => root.querySelector(`#${id}`)?.textContent.trim())
    .join(' ');
}

function selectedLabel(select: HTMLSelectElement): string {
  return select.selectedOptions[0].textContent.trim();
}

describe('SelectField', () => {
  it('labels its select and lists the options, with the bound value selected', async () => {
    const { select } = await render();

    expect(select.id).toBe('precision');
    expect([...select.labels].map((label) => label.textContent.trim())).toEqual([
      'Imperial precision',
    ]);
    expect([...select.options].map((option) => option.textContent.trim())).toEqual([
      '1/8 in',
      '1/16 in',
      '1/32 in',
    ]);
    expect(selectedLabel(select)).toBe('1/16 in');
  });

  it('sets the bound value when the user picks an option', async () => {
    const { fixture, select } = await render();

    select.value = '32';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.precision()).toBe('32');
  });

  it('selects the option whose value is set from outside', async () => {
    const { fixture, select } = await render();

    fixture.componentInstance.precision.set('8');
    await fixture.whenStable();

    expect(selectedLabel(select)).toBe('1/8 in');
  });

  it('is described by its hint', async () => {
    const { root, select } = await render({ hint: 'How finely imperial results are rounded.' });

    expect(describedBy(root, select)).toBe('How finely imperial results are rounded.');
  });

  it('shows no hint and has no description when it has no hint', async () => {
    const { root, select } = await render();

    expect(select.hasAttribute('aria-describedby')).toBe(false);
    expect(root.querySelector('p')).toBeNull();
  });

  it('has no description when its hint is empty', async () => {
    const { select } = await render({ hint: '' });

    expect(select.hasAttribute('aria-describedby')).toBe(false);
  });

  it('marks the select as a measurement when asked, so it uses the mono face', async () => {
    const { select } = await render({ measurement: true });

    expect(select.hasAttribute('measurement')).toBe(true);
  });

  it('does not mark the select as a measurement by default', async () => {
    const { select } = await render();

    expect(select.hasAttribute('measurement')).toBe(false);
  });

  it('has no axe violations', async () => {
    const { root } = await render({ hint: 'How finely imperial results are rounded.' });

    await expectNoAxeViolations(root);
  });
});
