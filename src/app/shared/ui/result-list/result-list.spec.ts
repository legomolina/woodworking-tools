import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../../../testing/expect-no-axe-violations';
import { ResultList } from './result-list';
import type { Result } from './result-list';

@Component({
  selector: 'wt-host',
  imports: [ResultList],
  template: `
    <wt-result-list [results]="results()" />
    <wt-result-list id="with-action" [results]="results()" [action]="copy" />
    <ng-template #copy let-result
      ><button type="button">Copy {{ result.label }}</button></ng-template
    >
  `,
})
class Host {
  readonly results = signal<readonly Result[]>([
    { label: 'mm', value: '1219.2' },
    { label: 'in', value: '≈ 48', approximate: true },
  ]);
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

function list(root: HTMLElement): HTMLElement {
  const match = root.querySelector<HTMLElement>('wt-result-list');
  if (!match) {
    throw new Error('No result list rendered.');
  }
  return match;
}

describe('ResultList', () => {
  it('renders each result as a label followed by its value', async () => {
    const { root } = await render();
    const rows = Array.from(list(root).querySelectorAll('dt, dd')).map((el) => [
      el.tagName,
      el.textContent.trim(),
    ]);
    expect(rows).toEqual([
      ['DT', 'mm'],
      ['DD', '1219.2'],
      ['DT', 'in'],
      ['DD', '≈ 48'],
    ]);
  });

  it('marks only approximate results', async () => {
    const { root } = await render();
    const rows = Array.from(list(root).querySelectorAll('dl > div'));
    expect(rows.map((row) => row.hasAttribute('approximate'))).toEqual([false, true]);
  });

  it('is a polite live region', async () => {
    const { root } = await render();
    expect(list(root).querySelector('dl')?.getAttribute('aria-live')).toBe('polite');
  });

  it('renders no results for an empty list', async () => {
    const { host, root, settle } = await render();
    host.results.set([]);
    await settle();
    expect(list(root).querySelectorAll('dt, dd')).toHaveLength(0);
  });

  it('updates the rows when the results change', async () => {
    const { host, root, settle } = await render();
    host.results.set([
      { label: 'cm', value: '121.92' },
      { label: 'ft', value: '≈ 4', approximate: true },
      { label: 'in', value: '48' },
    ]);
    await settle();
    const rows = Array.from(list(root).querySelectorAll('dl > div'), (row) => [
      row.querySelector('dt')?.textContent.trim(),
      row.querySelector('dd')?.textContent.trim(),
      row.hasAttribute('approximate'),
    ]);
    expect(rows).toEqual([
      ['cm', '121.92', false],
      ['ft', '≈ 4', true],
      ['in', '48', false],
    ]);
  });

  it('renders the action template in its own cell after the value, once per result', async () => {
    const { root } = await render();
    const withAction = root.querySelector('#with-action');
    const cells = Array.from(withAction?.querySelectorAll('dl > div') ?? [], (row) =>
      Array.from(row.querySelectorAll('dd'), (dd) => dd.textContent.trim()),
    );
    expect(cells).toEqual([
      ['1219.2', 'Copy mm'],
      ['≈ 48', 'Copy in'],
    ]);
  });

  it('renders no action without an action template', async () => {
    const { root } = await render();
    expect(list(root).querySelectorAll('button')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    const { root } = await render();
    await expectNoAxeViolations(root);
  });
});
