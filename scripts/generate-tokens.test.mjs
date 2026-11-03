import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { generateTokensCss } from './generate-tokens.mjs';

const SCRIPT = fileURLToPath(new URL('generate-tokens.mjs', import.meta.url));

/** Runs the generator CLI on a tokens.json / tokens.css pair in a temp folder. */
function runCli(tokensJson, ...flags) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'));
  const json = join(dir, 'tokens.json');
  const css = join(dir, 'tokens.css');
  writeFileSync(json, JSON.stringify(tokensJson));
  const run = (...args) =>
    spawnSync(process.execPath, [SCRIPT, ...args, '--json', json, '--css', css], {
      encoding: 'utf8',
    });
  return { run, json, css, first: run(...flags) };
}

const snapshot = (surface) => ({
  color: {
    themes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
    ],
    tokens: [{ name: 'surface', value: { light: surface, dark: '#1b1713' }, usage: 'Page.' }],
  },
});

describe('generate-tokens CLI', () => {
  it('writes tokens.css from tokens.json', () => {
    const { css, first } = runCli(snapshot('#f7f1e8'));

    assert.equal(first.status, 0);
    assert.match(readFileSync(css, 'utf8'), /--surface: #f7f1e8;/);
  });

  it('--check passes when tokens.css matches tokens.json', () => {
    const { run } = runCli(snapshot('#f7f1e8'));

    assert.equal(run('--check').status, 0);
  });

  it('--check fails, naming the fix, when tokens.json changed without regenerating', () => {
    const { run, json } = runCli(snapshot('#f7f1e8'));
    writeFileSync(json, JSON.stringify(snapshot('#ffffff')));

    const check = run('--check');

    assert.equal(check.status, 1);
    assert.match(check.stderr, /out of date.*pnpm tokens/s);
  });

  it('--check fails when tokens.css is missing', () => {
    const { first } = runCli(snapshot('#f7f1e8'), '--check');

    assert.equal(first.status, 1);
  });
});

const HEADER = '/* Generated from tokens.json by scripts/generate-tokens.mjs. Do not edit. */\n';

describe('generateTokensCss', () => {
  it('puts the first theme on :root and the dark theme behind prefers-color-scheme and data-theme', () => {
    const tokens = {
      color: {
        themes: [
          { id: 'light', name: 'Light' },
          { id: 'dark', name: 'Dark' },
        ],
        tokens: [
          { name: 'surface', value: { light: '#f7f1e8', dark: '#1b1713' }, usage: 'Page.' },
          { name: 'on-tape', value: { light: '#2a2017', dark: '#2a2017' }, usage: 'On tape.' },
        ],
      },
    };

    assert.equal(
      generateTokensCss(tokens),
      `${HEADER}
:root {
  --surface: #f7f1e8;
  --on-tape: #2a2017;

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --surface: #1b1713;
    --on-tape: #2a2017;

    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --surface: #1b1713;
  --on-tape: #2a2017;

  color-scheme: dark;
}
`,
    );
  });

  it('puts theme-independent tokens and text styles on :root, before the first theme colours', () => {
    const tokens = {
      color: { themes: [{ id: 'light', name: 'Light' }], tokens: [] },
      type: {
        fonts: [],
        families: {
          sans: 'Barlow, "Segoe UI", system-ui, sans-serif',
          mono: '"IBM Plex Mono", ui-monospace, monospace',
        },
        groups: [
          {
            name: 'Text',
            family: 'sans',
            styles: [
              {
                name: 'display',
                fontSize: '32px',
                lineHeight: '38px',
                fontWeight: '600',
                letterSpacing: '-0.01em',
                family: '',
              },
              {
                name: 'body',
                fontSize: '16px',
                lineHeight: '24px',
                fontWeight: '400',
                letterSpacing: '0',
                family: '',
              },
            ],
          },
          {
            name: 'Numbers',
            family: 'mono',
            styles: [
              { name: 'value', fontSize: '16px', lineHeight: '24px', fontWeight: 400, family: '' },
            ],
          },
        ],
      },
      spacing: { note: '', tokens: [{ name: 'space-1', value: '4px', usage: 'Gap.' }] },
      radius: { tokens: [{ name: 'radius-sm', value: '2px', usage: 'Inputs.' }] },
      size: { tokens: [{ name: 'control-height', value: '48px', usage: 'Controls.' }] },
      name: 'Woodworking Tools',
      version: 1,
    };

    assert.equal(
      generateTokensCss(tokens),
      `${HEADER}
:root {
  --space-1: 4px;
  --radius-sm: 2px;
  --control-height: 48px;
  --font-sans: Barlow, "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --text-display: 600 32px/38px var(--font-sans);
  --text-display-letter-spacing: -0.01em;
  --text-body: 400 16px/24px var(--font-sans);
  --text-value: 400 16px/24px var(--font-mono);

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {

    color-scheme: dark;
  }
}

:root[data-theme='dark'] {

  color-scheme: dark;
}
`,
    );
  });

  it('writes aliases as var() and keeps single-theme tokens on :root only', () => {
    const tokens = {
      color: {
        themes: [
          { id: 'light', name: 'Light' },
          { id: 'dark', name: 'Dark' },
        ],
        tokens: [
          { name: 'tape-ink', value: { light: '#855600', dark: '#f7c032' }, usage: 'Accent text.' },
          { name: 'link', value: { light: '{tape-ink}' }, usage: 'Links.' },
          { name: 'brand', value: '#5c3b24', usage: 'Plain string: the first theme.' },
        ],
      },
    };

    assert.equal(
      generateTokensCss(tokens),
      `${HEADER}
:root {
  --tape-ink: #855600;
  --link: var(--tape-ink);
  --brand: #5c3b24;

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --tape-ink: #f7c032;

    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --tape-ink: #f7c032;

  color-scheme: dark;
}
`,
    );
  });
});
