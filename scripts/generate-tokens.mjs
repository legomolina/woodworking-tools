// Generates src/styles/tokens.css from src/styles/tokens.json, the snapshot of
// the Woodworking Tools design system's tokens (see docs/adr/0003).
//
//   pnpm tokens         write tokens.css
//   pnpm tokens:check   fail if tokens.css is out of date (part of `pnpm lint`)
//
// `--json <path>` and `--css <path>` override the default files.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const HEADER = '/* Generated from tokens.json by scripts/generate-tokens.mjs. Do not edit. */\n';

/** Renders a block of declarations, indented by `depth` levels; '' is an empty line. */
function block(selector, declarations, depth = 0) {
  const indent = '  '.repeat(depth);
  const body = declarations.map((line) => (line ? `${indent}  ${line}` : '')).join('\n');
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

/** A token value, with aliases (`{other-token}`) turned into `var(--other-token)`. */
function cssValue(value) {
  const alias = /^\{([A-Za-z0-9][\w.-]*)\}$/.exec(value);
  return alias ? `var(--${alias[1]})` : value;
}

/**
 * A colour token's value per theme. A plain string is the light (first)
 * theme's value. Dark without a value inherits light's, so it gets no
 * declaration of its own.
 */
function themeValues(token) {
  return typeof token.value === 'string' ? { light: token.value } : token.value;
}

/** The colour declarations of one theme, then its `color-scheme` after an empty line. */
function themeDeclarations(colorTokens, themeId) {
  return [
    ...colorTokens
      .map((token) => [token.name, themeValues(token)[themeId]])
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => `--${name}: ${cssValue(value)};`),
    '',
    `color-scheme: ${themeId};`,
  ];
}

/** Declarations of every `{ tokens: [...] }` family other than colour (spacing, radius, size…). */
function sizeDeclarations(tokens) {
  return Object.entries(tokens)
    .filter(([family, group]) => family !== 'color' && Array.isArray(group?.tokens))
    .flatMap(([, group]) => group.tokens.map((token) => `--${token.name}: ${token.value};`));
}

/**
 * Font families as `--font-<family>`, and each text style as a `font`
 * shorthand `--text-<style>`, plus `--text-<style>-letter-spacing` when the
 * style sets one (the shorthand cannot hold it).
 */
function typeDeclarations(type) {
  if (!type) {
    return [];
  }
  const families = Object.entries(type.families).map(
    ([name, stack]) => `--font-${name}: ${stack};`,
  );
  const styles = type.groups.flatMap((group) =>
    group.styles.flatMap((style) => {
      const family = style.family || group.family;
      const declarations = [
        `--text-${style.name}: ${style.fontWeight} ${style.fontSize}/${style.lineHeight} var(--font-${family});`,
      ];
      if (style.letterSpacing && style.letterSpacing !== '0') {
        declarations.push(`--text-${style.name}-letter-spacing: ${style.letterSpacing};`);
      }
      return declarations;
    }),
  );
  return [...families, ...styles];
}

/**
 * Turns a design-system tokens object (the shape of tokens.json) into the
 * contents of tokens.css. The snapshot has two colour themes, `light` (first)
 * and `dark`, which map onto the theme structure in docs/adr/0003.
 */
export function generateTokensCss(tokens) {
  const colorTokens = tokens.color.tokens;
  const shared = [...sizeDeclarations(tokens), ...typeDeclarations(tokens.type)];
  const light = themeDeclarations(colorTokens, 'light');
  const dark = themeDeclarations(colorTokens, 'dark');

  const sections = [
    block(':root', [...shared, ...light]),
    `@media (prefers-color-scheme: dark) {\n${block(":root:not([data-theme='light'])", dark, 1)}\n}`,
    block(":root[data-theme='dark']", dark),
  ];
  return `${HEADER}\n${sections.join('\n\n')}\n`;
}

/** tokens.css as written to disk: generated, then formatted like the rest of the repo. */
async function formattedTokensCss(jsonPath, cssPath) {
  const css = generateTokensCss(JSON.parse(readFileSync(jsonPath, 'utf8')));
  const prettierConfig = await resolveConfig(cssPath);
  return format(css, { ...prettierConfig, filepath: cssPath });
}

function readIfExists(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
}

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const { values } = parseArgs({
    options: {
      check: { type: 'boolean', default: false },
      json: { type: 'string', default: resolve(root, 'src/styles/tokens.json') },
      css: { type: 'string', default: resolve(root, 'src/styles/tokens.css') },
    },
  });

  const expected = await formattedTokensCss(values.json, values.css);

  if (!values.check) {
    writeFileSync(values.css, expected);
    return;
  }
  if (readIfExists(values.css) !== expected) {
    console.error(
      `${values.css} is out of date with ${values.json}.\n` +
        'Run `pnpm tokens` to regenerate it; never edit tokens.css by hand.',
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
