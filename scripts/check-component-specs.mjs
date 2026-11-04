#!/usr/bin/env node
// Fails when a component, directive or pipe in the design system
// (src/app/shared/ui) or the shell (src/app/layout) has no co-located spec:
// `<name>.ts` declaring a `@Component`, `@Directive` or `@Pipe` needs
// `<name>.spec.ts` beside it, with a `describe(` block and an import of
// `./<name>`, so an empty spec, or one that never loads the file, does not
// count. Run from the project root.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const FOLDERS = ['src/app/shared/ui', 'src/app/layout'];

function fail(message) {
  console.error(`check-component-specs: ${message}`);
  process.exit(1);
}

for (const folder of FOLDERS) {
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    fail(`folder ${folder} does not exist.`);
  }
}

const isBuildingBlock = (file) =>
  file.endsWith('.ts') &&
  !file.endsWith('.spec.ts') &&
  /@(Component|Directive|Pipe)\s*\(/.test(readFileSync(file, 'utf8'));

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whether `<name>.spec.ts` exists, describes something and imports `./<name>`. */
function hasSpec(file) {
  const specFile = file.replace(/\.ts$/, '.spec.ts');
  if (!existsSync(specFile)) {
    return false;
  }
  const spec = readFileSync(specFile, 'utf8');
  const name = escapeRegExp(basename(file, '.ts'));
  const importsSource = new RegExp(`from\\s*(['"])\\./${name}\\1`).test(spec);
  return importsSource && /\bdescribe\s*\(/.test(spec);
}

const missing = FOLDERS.flatMap((folder) =>
  readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter(isBuildingBlock)
    .filter((file) => !hasSpec(file)),
).sort();

if (missing.length > 0) {
  fail(
    `components, directives or pipes without a co-located spec that imports and describes them:\n${missing.map((file) => `  ${file}`).join('\n')}`,
  );
}
