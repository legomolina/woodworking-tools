import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { SegmentedControl } from './segmented-control';
import type { SegmentedOption } from './segmented-control';

type Unit = 'metric' | 'imperial';

const UNITS: readonly SegmentedOption<Unit>[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

@Component({
  selector: 'wt-host',
  imports: [SegmentedControl],
  template: `
    <wt-segmented-control
      name="unit-system"
      label="Unit System"
      [hint]="hint()"
      [options]="options"
      [(value)]="unit"
    />
  `,
})
class Host {
  readonly options = UNITS;
  readonly unit = signal<Unit>('metric');
  readonly hint = signal<string | undefined>(undefined);
}

async function render(
  hint?: string,
): Promise<{ fixture: ComponentFixture<Host>; root: HTMLElement }> {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.hint.set(hint);
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

function group(root: HTMLElement): HTMLElement {
  const match = root.querySelector<HTMLElement>('[role="radiogroup"]');
  if (!match) {
    throw new Error('No radio group rendered.');
  }
  return match;
}

/** The text of the elements an id-list attribute (`aria-labelledby`, `aria-describedby`) points at. */
function referencedText(root: HTMLElement, element: Element, attribute: string): string {
  return (element.getAttribute(attribute) ?? '')
    .split(' ')
    .filter((id) => id !== '')
    .map((id) => root.querySelector(`#${id}`)?.textContent.trim())
    .join(' ');
}

/** The radio buttons as `[label, checked]` pairs. */
function radios(root: HTMLElement): [string, boolean][] {
  return [...group(root).querySelectorAll('label')].map((label) => [
    label.textContent.trim(),
    label.querySelector('input')?.checked ?? false,
  ]);
}

function radio(root: HTMLElement, label: string): HTMLInputElement {
  const match = [...group(root).querySelectorAll('label')].find(
    (candidate) => candidate.textContent.trim() === label,
  );
  const input = match?.querySelector<HTMLInputElement>('input[type="radio"]');
  if (!input) {
    throw new Error(`No radio button labelled "${label}".`);
  }
  return input;
}

describe('SegmentedControl', () => {
  it('is a radio group named by its label, with one radio button per option', async () => {
    const { root } = await render();

    expect(referencedText(root, group(root), 'aria-labelledby')).toBe('Unit System');
    expect(radios(root)).toEqual([
      ['Metric', true],
      ['Imperial', false],
    ]);
  });

  // jsdom has no arrow-key navigation between radio buttons, so this checks the shared
  // name the browser groups them by.
  it("gives every radio button the group's name", async () => {
    const { root } = await render();

    expect(radio(root, 'Metric').name).toBe('unit-system');
    expect(radio(root, 'Imperial').name).toBe('unit-system');
  });

  it('sets the bound value when the user chooses an option', async () => {
    const { fixture, root } = await render();

    radio(root, 'Imperial').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.unit()).toBe('imperial');
    expect(radios(root)).toEqual([
      ['Metric', false],
      ['Imperial', true],
    ]);
  });

  it('checks the option whose value is set from outside', async () => {
    const { fixture, root } = await render();

    fixture.componentInstance.unit.set('imperial');
    await fixture.whenStable();

    expect(radios(root)).toEqual([
      ['Metric', false],
      ['Imperial', true],
    ]);
  });

  it('is described by its hint', async () => {
    const { root } = await render('Used by every Tool.');

    expect(referencedText(root, group(root), 'aria-describedby')).toBe('Used by every Tool.');
  });

  it('shows no hint and has no description when it has no hint', async () => {
    const { root } = await render();

    expect(group(root).hasAttribute('aria-describedby')).toBe(false);
    expect(root.querySelector('p')).toBeNull();
  });

  it('has no description when its hint is empty', async () => {
    const { root } = await render('');

    expect(group(root).hasAttribute('aria-describedby')).toBe(false);
  });

  it('has no axe violations', async () => {
    const { root } = await render('Used by every Tool.');

    await expectNoAxeViolations(root);
  });
});
