import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('check-component-specs.mjs', import.meta.url));

const COMPONENT = `
import { Component } from '@angular/core';
@Component({ selector: 'wt-thing', templateUrl: './thing.html' })
export class Thing {}
`;
const DIRECTIVE = `
import { Directive } from '@angular/core';
@Directive({ selector: '[wt-thing]' })
export class Thing {}
`;
const PIPE = `
import { Pipe } from '@angular/core';
@Pipe({ name: 'wtThing' })
export class Thing {}
`;

/** A spec that imports `./<name>` (in the given quote style) and describes it. */
function spec(name, quote = "'") {
  return `import { Thing } from ${quote}./${name}${quote};\ndescribe('Thing', () => {});`;
}

/** Runs the check in a temp project made of `{ relativePath: contents }`. */
function check(files) {
  const root = mkdtempSync(join(tmpdir(), 'component-specs-check-'));
  for (const [path, contents] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
  }
  return spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: 'utf8' });
}

const folders = {
  'src/app/shared/ui/.keep': '',
  'src/app/layout/.keep': '',
};

describe('check-component-specs', () => {
  it('passes when every design system and layout component has a co-located spec', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/button/button.ts': COMPONENT,
      'src/app/shared/ui/button/button.spec.ts': spec('button'),
      'src/app/layout/site-footer/site-footer.ts': COMPONENT,
      'src/app/layout/site-footer/site-footer.spec.ts': spec('site-footer', '"'),
    });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('fails and names the file when a design system component has no spec', () => {
    const result = check({ ...folders, 'src/app/shared/ui/button/button.ts': COMPONENT });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/button\/button\.ts/);
  });

  it('fails and names the file when a layout component has no spec', () => {
    const result = check({ ...folders, 'src/app/layout/skip-link/skip-link.ts': COMPONENT });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/layout\/skip-link\/skip-link\.ts/);
  });

  it('fails when the only spec next to a component is for another file', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/select/select.ts': COMPONENT,
      'src/app/shared/ui/select/select-option.spec.ts': spec('select-option'),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/select\/select\.ts/);
  });

  it("fails and names the file when a component's spec is empty", () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/button/button.ts': COMPONENT,
      'src/app/shared/ui/button/button.spec.ts': '',
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/button\/button\.ts/);
  });

  it("fails when a component's spec has no describe block", () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/button/button.ts': COMPONENT,
      'src/app/shared/ui/button/button.spec.ts': `import { Thing } from './button';`,
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/button\/button\.ts/);
  });

  it("fails when a component's spec never imports the component", () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/button/button.ts': COMPONENT,
      'src/app/shared/ui/button/button.spec.ts': spec('button-group'),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/button\/button\.ts/);
  });

  it('fails and names the file when a directive or a pipe has no spec', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/tooltip/tooltip.ts': DIRECTIVE,
      'src/app/shared/ui/fraction/fraction.pipe.ts': PIPE,
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/tooltip\/tooltip\.ts/);
    assert.match(result.stderr, /src\/app\/shared\/ui\/fraction\/fraction\.pipe\.ts/);
  });

  it('passes when a directive and a pipe have their specs', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/tooltip/tooltip.ts': DIRECTIVE,
      'src/app/shared/ui/tooltip/tooltip.spec.ts': spec('tooltip'),
      'src/app/shared/ui/fraction/fraction.pipe.ts': PIPE,
      'src/app/shared/ui/fraction/fraction.pipe.spec.ts': spec('fraction.pipe'),
    });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('fails for a component in a nested folder without a spec', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/field/label/label.ts': COMPONENT,
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/field\/label\/label\.ts/);
  });

  it('passes for a component in a nested folder with its spec', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/field/label/label.ts': COMPONENT,
      'src/app/shared/ui/field/label/label.spec.ts': spec('label'),
    });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('ignores TypeScript files that declare no component', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/select/select-option.ts': 'export interface SelectOption {}',
    });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('needs no spec for a spec that declares a test host component', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/button/button.ts': COMPONENT,
      'src/app/shared/ui/button/button.spec.ts': `${spec('button')}\n${COMPONENT}`,
    });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('ignores components outside the design system and the layout', () => {
    const result = check({ ...folders, 'src/app/home/home.page.ts': COMPONENT });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('fails when a folder it checks does not exist', () => {
    const result = check({ 'src/app/shared/ui/.keep': '' });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /folder src\/app\/layout does not exist/);
  });
});
