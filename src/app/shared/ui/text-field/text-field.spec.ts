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
      [measurement]="measurement()"
      [(value)]="length"
    />
  `,
})
class Host {
  readonly length = signal('3 1/2');
  readonly hint = signal<string | undefined>(undefined);
  readonly measurement = signal(false);
}

async function render(
  setup: { hint?: string; measurement?: boolean } = {},
): Promise<{ fixture: ComponentFixture<Host>; root: HTMLElement; input: HTMLInputElement }> {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.hint.set(setup.hint);
  fixture.componentInstance.measurement.set(setup.measurement ?? false);
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
});
