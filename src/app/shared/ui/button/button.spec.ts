import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { Button } from './button';

@Component({
  selector: 'wt-host',
  imports: [Button],
  template: `
    <button wt-button type="button" (click)="clicks.set(clicks() + 1)">Add Part</button>
    <button wt-button type="button" [variant]="variant()" id="main">Optimize cuts</button>
    <button wt-button type="button" disabled id="off">Clear Cut List</button>
    <button wt-button type="button" aria-label="Copy millimetres" id="named">Copy</button>
  `,
})
class Host {
  readonly clicks = signal(0);
  readonly variant = signal<'primary' | 'secondary'>('primary');
}

async function render(): Promise<{ host: Host; root: HTMLElement; settle: () => Promise<void> }> {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return {
    host: fixture.componentInstance,
    root: fixture.nativeElement as HTMLElement,
    settle: async (): Promise<void> => {
      await fixture.whenStable();
    },
  };
}

function button(root: HTMLElement, id: string): HTMLButtonElement {
  const match = root.querySelector<HTMLButtonElement>(`#${id}`);
  if (!match) {
    throw new Error(`No button #${id} rendered.`);
  }
  return match;
}

describe('Button', () => {
  it('shows its projected label and is a native button', async () => {
    const { root } = await render();
    const first = root.querySelector('button');
    expect(first?.textContent.trim()).toBe('Add Part');
    expect(first?.type).toBe('button');
  });

  it('is secondary unless told otherwise', async () => {
    const { root } = await render();
    expect(root.querySelector('button')?.getAttribute('variant')).toBe('secondary');
  });

  it('reflects the variant and follows its changes', async () => {
    const { host, root, settle } = await render();
    expect(button(root, 'main').getAttribute('variant')).toBe('primary');
    host.variant.set('secondary');
    await settle();
    expect(button(root, 'main').getAttribute('variant')).toBe('secondary');
  });

  it('can be clicked', async () => {
    const { host, root, settle } = await render();
    root.querySelector('button')?.click();
    await settle();
    expect(host.clicks()).toBe(1);
  });

  it('cannot be clicked when disabled', async () => {
    const { root } = await render();
    expect(button(root, 'off').disabled).toBe(true);
  });

  it('takes its accessible name from the native aria-label', async () => {
    const { root } = await render();
    expect(button(root, 'named').getAttribute('aria-label')).toBe('Copy millimetres');
  });

  it('is reachable by keyboard focus', async () => {
    const { root } = await render();
    const target = button(root, 'main');
    target.focus();
    expect(document.activeElement).toBe(target);
  });

  it('has no axe violations', async () => {
    const { root } = await render();
    await expectNoAxeViolations(root);
  });
});
