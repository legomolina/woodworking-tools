import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('check-translations.mjs', import.meta.url));

const PAGE = `<h1>{{ 'app.name' | transloco }}</h1>`;
const TOOL_ROUTES = `
import { provideTranslocoScope } from '@jsverse/transloco';
export const routes = [{ path: '', providers: [provideTranslocoScope('cut-optimizer')] }];
`;
const TOOL_PAGE = `<h1>{{ 'cutOptimizer.title' | transloco }}</h1>`;

/** Runs the check in a temp project made of `{ relativePath: contents }`. */
function check(files) {
  const root = mkdtempSync(join(tmpdir(), 'i18n-check-'));
  for (const [path, contents] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof contents === 'string' ? contents : JSON.stringify(contents));
  }
  return spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: 'utf8' });
}

const app = {
  'src/app/app.html': PAGE,
  'public/i18n/en.json': { app: { name: 'Woodworking Tools' } },
  'public/i18n/es.json': { app: { name: 'Woodworking Tools' } },
};

const tool = {
  'src/app/tools/cut-optimizer/cut-optimizer.routes.ts': TOOL_ROUTES,
  'src/app/tools/cut-optimizer/cut-optimizer.page.html': TOOL_PAGE,
  'public/i18n/cut-optimizer/en.json': { title: 'Cut Optimizer' },
  'public/i18n/cut-optimizer/es.json': { title: 'Optimizador de cortes' },
};

describe('check-translations', () => {
  it('passes when every key used is in both languages', () => {
    const result = check({ ...app, ...tool });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  });

  it('fails and names the key when a Spanish key is missing', () => {
    const result = check({ ...app, 'public/i18n/es.json': {} });

    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /app\.name/);
  });

  it("fails when a key is missing from a Tool's Spanish scope file", () => {
    const result = check({ ...app, ...tool, 'public/i18n/cut-optimizer/es.json': {} });

    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /cut-optimizer\/es/);
  });

  it('fails when a language file is missing altogether', () => {
    const { 'public/i18n/es.json': _removed, ...withoutSpanish } = app;

    const result = check(withoutSpanish);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /public\/i18n\/es\.json/);
  });

  it("fails when a Tool's scope has no Spanish file", () => {
    const { 'public/i18n/cut-optimizer/es.json': _removed, ...toolWithoutSpanish } = tool;

    const result = check({ ...app, ...toolWithoutSpanish });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /public\/i18n\/cut-optimizer\/es\.json/);
  });

  it('fails when the translations folder does not exist', () => {
    const result = check({ 'src/app/app.html': PAGE });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /public\/i18n/);
  });
});
