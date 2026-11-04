#!/usr/bin/env node
// Fails when a component in the design system (src/app/shared/ui) or the shell
// (src/app/layout) has no co-located spec: `<name>.ts` declaring a
// `@Component` needs `<name>.spec.ts` beside it. Run from the project root.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

const isComponentSource = (file) =>
  file.endsWith('.ts') &&
  !file.endsWith('.spec.ts') &&
  /@Component\s*\(/.test(readFileSync(file, 'utf8'));

const missing = FOLDERS.flatMap((folder) =>
  readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter(isComponentSource)
    .filter((file) => !existsSync(file.replace(/\.ts$/, '.spec.ts'))),
).sort();

if (missing.length > 0) {
  fail(`components without a co-located spec:\n${missing.map((file) => `  ${file}`).join('\n')}`);
}
