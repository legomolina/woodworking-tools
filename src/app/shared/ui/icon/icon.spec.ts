import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { Icon } from './icon';
import type { IconName } from './icon';

@Component({
  selector: 'wt-host',
  imports: [Icon],
  template: `<button type="button"><wt-icon [name]="name()" [size]="size()" /> Menu</button>`,
})
class Host {
  readonly name = signal<IconName>('menu');
  readonly size = signal<'sm' | 'md'>('md');
}

function render(): { fixture: ComponentFixture<Host>; root: HTMLElement } {
  const fixture = TestBed.createComponent(Host);
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, root };
}

describe('Icon', () => {
  it('draws exactly one SVG per name, each one different from the others', async () => {
    const { fixture, root } = render();
    const names: IconName[] = ['arrow-right', 'menu', 'sliders-horizontal', 'x'];
    const drawings: (string | undefined)[] = [];

    for (const name of names) {
      fixture.componentInstance.name.set(name);
      await fixture.whenStable();
      expect(root.querySelectorAll('svg')).toHaveLength(1);
      drawings.push(root.querySelector('svg')?.innerHTML);
    }

    expect(new Set(drawings).size).toBe(names.length);
    expect(drawings.every((drawing) => drawing !== undefined && drawing !== '')).toBe(true);
  });

  it('is hidden from assistive technology next to its text label', async () => {
    const { fixture, root } = render();
    await fixture.whenStable();

    expect(root.querySelector('wt-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('button')?.textContent.trim()).toBe('Menu');
  });

  it('reflects its size on the host for styling', async () => {
    const { fixture, root } = render();
    fixture.componentInstance.size.set('sm');
    await fixture.whenStable();

    expect(root.querySelector('wt-icon')?.getAttribute('size')).toBe('sm');
  });

  it('is medium by default', async () => {
    const { fixture, root } = render();
    await fixture.whenStable();

    expect(root.querySelector('wt-icon')?.getAttribute('size')).toBe('md');
  });

  it('has no axe violations', async () => {
    const { fixture, root } = render();
    await fixture.whenStable();

    await expectNoAxeViolations(root);
  });
});
