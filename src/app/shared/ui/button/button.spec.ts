import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { Button } from './button';

@Component({
  selector: 'wt-host',
  imports: [Button],
  template: `
    <button wt-button type="button">Add Part</button>
    <button wt-button type="button" [variant]="variant()" id="main">Optimize cuts</button>
    <button wt-button type="button" [size]="size()" id="sized">Copy</button>
  `,
})
class Host {
  readonly variant = signal<'primary' | 'secondary'>('primary');
  readonly size = signal<'default' | 'small'>('small');
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

  it('is default size unless told otherwise', async () => {
    const { root } = await render();
    expect(root.querySelector('button')?.getAttribute('size')).toBe('default');
  });

  it('reflects the size and follows its changes', async () => {
    const { host, root, settle } = await render();
    expect(button(root, 'sized').getAttribute('size')).toBe('small');
    host.size.set('default');
    await settle();
    expect(button(root, 'sized').getAttribute('size')).toBe('default');
  });

  it('has no axe violations', async () => {
    const { root } = await render();
    await expectNoAxeViolations(root);
  });
});
