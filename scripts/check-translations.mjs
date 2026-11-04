#!/usr/bin/env node
// Fails when a translation key used in src/app is missing from any language
// file (ADR 0001), app-wide (public/i18n/<lang>.json) or in a Tool's scope
// (public/i18n/<tool-name>/<lang>.json). Run from the project root.
//
// The Transloco keys manager does the key comparison. This wrapper exists
// because the keys manager exits 0 when its folders do not exist and does not
// notice a language file that is missing altogether.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LANGS = ['en', 'es'];
const INPUT = 'src/app';
const TRANSLATIONS = 'public/i18n';
const KEYS_MANAGER = fileURLToPath(
  new URL('../node_modules/@jsverse/transloco-keys-manager/index.js', import.meta.url),
);

function fail(message) {
  console.error(`check-translations: ${message}`);
  process.exit(1);
}

for (const folder of [INPUT, TRANSLATIONS]) {
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    fail(`folder ${folder} does not exist.`);
  }
}

const scopeFolders = readdirSync(TRANSLATIONS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(TRANSLATIONS, entry.name));

const missingFiles = [TRANSLATIONS, ...scopeFolders]
  .flatMap((folder) => LANGS.map((lang) => `${folder}/${lang}.json`))
  .filter((file) => !existsSync(file));
if (missingFiles.length > 0) {
  fail(`missing translation files:\n${missingFiles.map((file) => `  ${file}`).join('\n')}`);
}

const { status } = spawnSync(
  process.execPath,
  [KEYS_MANAGER, 'find', '--input', INPUT, '--translations-path', TRANSLATIONS, '--unflat'],
  { stdio: 'inherit' },
);
process.exit(status ?? 1);
