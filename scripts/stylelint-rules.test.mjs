// Proves each styling rule in stylelint.config.mjs against code it must block
// and code it must allow (docs/adr/0003-component-styling.md).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const configFile = fileURLToPath(new URL('../stylelint.config.mjs', import.meta.url));
const root = fileURLToPath(new URL('..', import.meta.url));

const COMPONENT = 'src/app/shared/ui/button/button.css';

/**
 * The rules a CSS snippet breaks when linted as the given file. Declaration
 * order (`order/*`) is left out: it is not what these tests are about.
 */
async function brokenRules(code, file = COMPONENT) {
  const { results } = await stylelint.lint({
    code,
    codeFilename: `${root}${file}`,
    configFile,
  });
  const rules = results.flatMap((result) => result.warnings.map((warning) => warning.rule));
  return [...new Set(rules)].filter((rule) => !rule.startsWith('order/'));
}

/** Asserts the snippet breaks `rule`. */
async function assertBlocked(rule, code, file) {
  assert.ok((await brokenRules(code, file)).includes(rule), `expected ${rule} to block:\n${code}`);
}

/** Asserts the snippet breaks no rule at all. */
async function assertAllowed(code, file) {
  assert.deepEqual(await brokenRules(code, file), [], `expected no problems in:\n${code}`);
}

describe('stylelint: class names', () => {
  it('blocks BEM elements and modifiers and camelCase', async () => {
    await assertBlocked('selector-class-pattern', '.result__value {\n  color: var(--ink);\n}\n');
    await assertBlocked('selector-class-pattern', '.result--big {\n  color: var(--ink);\n}\n');
    await assertBlocked('selector-class-pattern', '.resultValue {\n  color: var(--ink);\n}\n');
  });

  it('allows kebab-case', async () => {
    await assertAllowed('.result-value {\n  color: var(--ink);\n}\n');
  });
});

describe('stylelint: at most one class per selector', () => {
  it('blocks compound and descendant classes', async () => {
    await assertBlocked('selector-max-class', '.card.active {\n  color: var(--ink);\n}\n');
    await assertBlocked('selector-max-class', '.card .title {\n  color: var(--ink);\n}\n');
  });

  it('allows one class with element selectors and host attributes', async () => {
    await assertAllowed('.card h3 {\n  color: var(--ink);\n}\n');
    await assertAllowed(":host([variant='primary']) span {\n  color: var(--on-tape);\n}\n");
  });
});

describe('stylelint: encapsulation escapes', () => {
  it('blocks ::ng-deep', async () => {
    await assertBlocked(
      'selector-pseudo-element-disallowed-list',
      ':host ::ng-deep p {\n  color: var(--ink);\n}\n',
    );
  });

  it('blocks !important', async () => {
    await assertBlocked('declaration-no-important', 'p {\n  color: var(--ink) !important;\n}\n');
  });
});

describe('stylelint: logical properties', () => {
  it('blocks physical properties', async () => {
    await assertBlocked('logical-css/require-logical-properties', 'p {\n  margin-left: 4px;\n}\n');
    await assertBlocked('logical-css/require-logical-properties', 'p {\n  width: 10px;\n}\n');
  });

  it('allows logical properties', async () => {
    await assertAllowed('p {\n  margin-inline-start: var(--space-1);\n  inline-size: 50%;\n}\n');
  });
});

describe('stylelint: colours only through tokens', () => {
  it('blocks hex, named and functional colours in components', async () => {
    await assertBlocked('color-no-hex', 'p {\n  color: #fff;\n}\n');
    await assertBlocked('color-named', 'p {\n  color: red;\n}\n');
    await assertBlocked('function-disallowed-list', 'p {\n  color: rgb(0 0 0);\n}\n');
    await assertBlocked('function-disallowed-list', 'p {\n  border-color: oklch(70% 0.1 80);\n}\n');
  });

  it('allows tokens and colour keywords that are not colours of their own', async () => {
    await assertAllowed(
      'p {\n  color: var(--ink);\n  border-color: currentcolor;\n  background-color: transparent;\n}\n',
    );
  });

  it('allows literal colours in the generated tokens.css', async () => {
    await assertAllowed(':root {\n  --ink: #2a2017;\n}\n', 'src/styles/tokens.css');
  });
});

describe('stylelint: typography only through tokens', () => {
  it('blocks literal font families, sizes and font shorthands', async () => {
    await assertBlocked(
      'declaration-property-value-allowed-list',
      'p {\n  font-family: Arial, sans-serif;\n}\n',
    );
    await assertBlocked('declaration-property-value-allowed-list', 'p {\n  font-size: 14px;\n}\n');
    await assertBlocked(
      'declaration-property-value-allowed-list',
      'p {\n  font: 600 16px/24px Arial;\n}\n',
    );
  });

  it('allows tokens and inherit', async () => {
    await assertAllowed(
      'p {\n  font: var(--text-value);\n}\n\nb {\n  font-family: var(--font-mono);\n  font-size: inherit;\n}\n',
    );
  });
});

describe('stylelint: @font-face', () => {
  const fontFace =
    "@font-face {\n  font-family: Barlow;\n  src: url('/fonts/barlow/barlow-latin-400-normal.woff2') format('woff2');\n}\n";

  it('blocks @font-face outside fonts.css', async () => {
    await assertBlocked('at-rule-disallowed-list', fontFace);
  });

  it('allows @font-face in fonts.css', async () => {
    await assertAllowed(fontFace, 'src/styles/fonts.css');
  });
});

describe('stylelint: no external URLs', () => {
  it('blocks absolute and protocol-relative URLs in url()', async () => {
    await assertBlocked(
      'function-url-scheme-allowed-list',
      "p {\n  background-image: url('https://example.com/a.png');\n}\n",
    );
    await assertBlocked(
      'function-url-no-scheme-relative',
      "p {\n  background-image: url('//example.com/a.png');\n}\n",
    );
  });

  it('blocks external @import, in url() or string form', async () => {
    const file = 'src/styles/styles.css';
    await assertBlocked(
      'local/no-external-import',
      "@import url('https://fonts.googleapis.com/css2?family=Barlow');\n",
      file,
    );
    await assertBlocked(
      'local/no-external-import',
      "@import 'https://fonts.googleapis.com/css2?family=Barlow';\n",
      file,
    );
    await assertBlocked(
      'local/no-external-import',
      '@import url(//cdn.example.com/a.css);\n',
      file,
    );
  });

  it('allows local files', async () => {
    await assertAllowed("@import url('tokens.css');\n", 'src/styles/styles.css');
    await assertAllowed("p {\n  background-image: url('/images/grain.png');\n}\n");
  });
});
