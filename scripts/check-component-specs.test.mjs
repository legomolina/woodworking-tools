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
const SPEC = `describe('Thing', () => {});`;

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
      'src/app/shared/ui/button/button.spec.ts': SPEC,
      'src/app/layout/site-footer/site-footer.ts': COMPONENT,
      'src/app/layout/site-footer/site-footer.spec.ts': SPEC,
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
      'src/app/shared/ui/select/select-option.spec.ts': SPEC,
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /src\/app\/shared\/ui\/select\/select\.ts/);
  });

  it('ignores TypeScript files that declare no component', () => {
    const result = check({
      ...folders,
      'src/app/shared/ui/select/select-option.ts': 'export interface SelectOption {}',
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
