import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../../testing/expect-no-axe-violations';
import { BevelDiagram } from './bevel-diagram';
import type { BevelDiagramLabels, BevelDiagramState } from './bevel-diagram';

const LABELS: BevelDiagramLabels = {
  part: 'Part',
  blade: 'Blade',
  fence: 'Fence',
  thickness: 'Thickness',
  rulerZero: 'Ruler 0',
  longFace: 'Long Face',
  shortFace: 'Short Face',
};

const LONG_GIVEN: BevelDiagramState = {
  angleDegrees: 45,
  givenFace: 'long',
  thickness: '19 mm',
  longFace: '300 mm',
  shortFace: '281 mm',
};

@Component({
  selector: 'wt-host',
  imports: [BevelDiagram],
  template: `<wt-bevel-diagram
    [state]="state()"
    [labels]="labels"
    [description]="description()"
  />`,
})
class Host {
  readonly state = signal<BevelDiagramState | undefined>(LONG_GIVEN);
  readonly labels = LABELS;
  readonly description = signal('Front view of the saw.');
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

function svg(root: HTMLElement): SVGElement {
  return root.querySelector('svg')!;
}

function blade(root: HTMLElement): { x1: number; x2: number } {
  const line = root.querySelector('line.blade')!;
  return { x1: Number(line.getAttribute('x1')), x2: Number(line.getAttribute('x2')) };
}

function texts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('text')].map((text) => text.textContent.trim());
}

function givenDimensions(root: HTMLElement): string[] {
  return [...root.querySelectorAll('g[data-given] .dimension-name')].map((name) =>
    name.textContent.trim(),
  );
}

describe('BevelDiagram', () => {
  it('is an image whose text alternative is the description', async () => {
    const { host, root, settle } = await render();

    expect(svg(root).getAttribute('role')).toBe('img');
    expect(svg(root).getAttribute('aria-label')).toBe('Front view of the saw.');

    host.description.set('The blade is tilted 22.5 degrees.');
    await settle();

    expect(svg(root).getAttribute('aria-label')).toBe('The blade is tilted 22.5 degrees.');
  });

  it('labels the Part, Blade, Fence, Thickness and ruler zero with the given words', async () => {
    const { root } = await render();

    expect(texts(root)).toEqual(
      expect.arrayContaining(['Part', 'Blade', 'Fence', 'Thickness', 'Ruler 0']),
    );
  });

  it('shows the calculated values on x and y and the Thickness', async () => {
    const { root } = await render();

    expect(texts(root)).toEqual(
      expect.arrayContaining([
        'x · Long Face',
        '300 mm',
        'y · Short Face',
        '281 mm',
        '19 mm',
        '45°',
      ]),
    );
  });

  it('leans the blade over by 45° at its limit and draws it upright at 0°', async () => {
    const { host, root, settle } = await render();

    const leaning = blade(root);
    // The blade rises 170 units (Thickness 140 + 30), so at 45° it moves 170 units sideways.
    expect(leaning.x1 - leaning.x2).toBeCloseTo(170, 1);

    host.state.set({ ...LONG_GIVEN, angleDegrees: 0 });
    await settle();

    expect(blade(root).x2).toBe(blade(root).x1);
    expect(root.querySelector('.arc')).toBeNull();
  });

  it('draws the blade at the real angle in between', async () => {
    const { host, root, settle } = await render();
    host.state.set({ ...LONG_GIVEN, angleDegrees: 22.5 });
    await settle();

    // 170 × tan 22.5° ≈ 70.4
    expect(blade(root).x1 - blade(root).x2).toBeCloseTo(70.4, 1);
    expect(root.querySelector('.arc')).not.toBeNull();
  });

  it('keeps the Part the same size at every angle', async () => {
    const { host, root, settle } = await render();
    const part = (): string[] => root.querySelector('polygon')!.getAttribute('points')!.split(' ');

    // Right-hand side of the Part (bottom and top at the Fence) never moves.
    const right = part().slice(2, 6);
    host.state.set({ ...LONG_GIVEN, angleDegrees: 10 });
    await settle();

    expect(part().slice(2, 6)).toEqual(right);
  });

  it('highlights the dimension of the Long Face when it was given, and moves when that changes', async () => {
    const { host, root, settle } = await render();

    expect(givenDimensions(root)).toEqual(['x · Long Face']);

    host.state.set({ ...LONG_GIVEN, givenFace: 'short' });
    await settle();

    expect(givenDimensions(root)).toEqual(['y · Short Face']);
  });

  it('draws a neutral blade with no values while there is no state', async () => {
    const { host, root, settle } = await render();
    host.state.set(undefined);
    await settle();

    const shown = texts(root);
    expect(shown.filter((text) => text === '—')).toHaveLength(4);
    expect(shown).not.toContain('300 mm');
    expect(blade(root).x1).toBeGreaterThan(blade(root).x2);
  });

  it('has no accessibility violations', async () => {
    const { root } = await render();

    await expectNoAxeViolations(root);
  });
});
