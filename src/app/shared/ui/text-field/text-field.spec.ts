import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { TextField } from './text-field';

@Component({
  selector: 'wt-host',
  imports: [TextField],
  template: `
    <wt-text-field
      name="length"
      label="Length"
      [hint]="hint()"
      [error]="error()"
      [measurement]="measurement()"
      [unit]="unit()"
      [(value)]="length"
    />
  `,
})
class Host {
  readonly length = signal('3 1/2');
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly measurement = signal(false);
  readonly unit = signal<string | undefined>(undefined);
}

async function render(
  setup: { hint?: string; error?: string; measurement?: boolean; unit?: string } = {},
): Promise<{ fixture: ComponentFixture<Host>; root: HTMLElement; input: HTMLInputElement }> {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.hint.set(setup.hint);
  fixture.componentInstance.error.set(setup.error);
  fixture.componentInstance.measurement.set(setup.measurement ?? false);
  fixture.componentInstance.unit.set(setup.unit);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector('input');
  if (!input) {
    throw new Error('No input rendered.');
  }
  return { fixture, root, input };
}

function describedBy(root: HTMLElement, element: Element): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter((id) => id !== '')
    .map((id) => root.querySelector(`#${id}`)?.textContent.trim())
    .join(' ');
}

describe('TextField', () => {
  it('labels its input and shows the bound value', async () => {
    const { input } = await render();

    expect(input.id).toBe('length');
    expect(
      Array.from(input.labels ?? [], (label: HTMLLabelElement) => label.textContent.trim()),
    ).toEqual(['Length']);
    expect(input.value).toBe('3 1/2');
  });

  it('sets the bound value when the user types', async () => {
    const { fixture, input } = await render();

    input.value = '12.5';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.length()).toBe('12.5');
  });

  it('shows the value that is set from outside', async () => {
    const { fixture, input } = await render();

    fixture.componentInstance.length.set('40 cm');
    await fixture.whenStable();

    expect(input.value).toBe('40 cm');
  });

  it('is described by its hint', async () => {
    const { root, input } = await render({ hint: 'Try 3 1/2 or 8.9 cm.' });

    expect(describedBy(root, input)).toBe('Try 3 1/2 or 8.9 cm.');
  });

  it('shows no hint and has no description when it has no hint', async () => {
    const { root, input } = await render();

    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(root.querySelector('p')).toBeNull();
  });

  it('has no description when its hint is empty', async () => {
    const { input } = await render({ hint: '' });

    expect(input.hasAttribute('aria-describedby')).toBe(false);
  });

  it('is not invalid and shows no error when it has no error', async () => {
    const { root, input } = await render();

    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelector('wt-text-field')?.hasAttribute('invalid')).toBe(false);
  });

  it('is invalid and described by its error when it has one', async () => {
    const { root, input } = await render({ error: 'Not a length.' });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('[role="alert"]')?.textContent.trim()).toBe('Not a length.');
    expect(describedBy(root, input)).toBe('Not a length.');
    expect(root.querySelector('wt-text-field')?.hasAttribute('invalid')).toBe(true);
  });

  it('is described by its hint first, then its error', async () => {
    const { root, input } = await render({ hint: 'Try 3 1/2.', error: 'Not a length.' });

    expect(input.getAttribute('aria-describedby')).toBe('length-hint length-error');
    expect(describedBy(root, input)).toBe('Try 3 1/2. Not a length.');
  });

  it('is valid again and falls back to its hint when the error is cleared', async () => {
    const { fixture, root, input } = await render({ hint: 'Try 3 1/2.', error: 'Not a length.' });

    fixture.componentInstance.error.set(undefined);
    await fixture.whenStable();

    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(describedBy(root, input)).toBe('Try 3 1/2.');
    expect(root.querySelector('wt-text-field')?.hasAttribute('invalid')).toBe(false);
  });

  it('shows its unit after the value and is described by it before its hint', async () => {
    const { root, input } = await render({ unit: '°', hint: 'From 0 to 45.' });

    expect(root.querySelector('span')?.textContent.trim()).toBe('°');
    expect(input.getAttribute('aria-describedby')).toBe('length-unit length-hint');
    expect(describedBy(root, input)).toBe('° From 0 to 45.');
  });

  it('shows no unit when it has none', async () => {
    const { root } = await render();

    expect(root.querySelector('span')).toBeNull();
  });

  it('reflects measurement mode on the host when asked', async () => {
    const { root } = await render({ measurement: true });

    expect(root.querySelector('wt-text-field')?.hasAttribute('measurement')).toBe(true);
  });

  it('is not in measurement mode by default', async () => {
    const { root } = await render();

    expect(root.querySelector('wt-text-field')?.hasAttribute('measurement')).toBe(false);
  });

  it('has no axe violations', async () => {
    const { root } = await render({ hint: 'Try 3 1/2 or 8.9 cm.' });

    await expectNoAxeViolations(root);
  });

  it('has no axe violations with an error', async () => {
    const { root } = await render({ hint: 'Try 3 1/2.', error: 'Not a length.' });

    await expectNoAxeViolations(root);
  });
});
