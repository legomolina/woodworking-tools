// Proves the component rules in eslint.config.mjs against code they must block
// and code they must allow (docs/adr/0003-component-styling.md).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const FIXTURE = 'src/app/lint-fixture.ts';
const SPEC_FIXTURE = 'src/app/lint-fixture.spec.ts';
const TESTING_FIXTURE = 'src/testing/lint-fixture.ts';
const FIXTURES = [FIXTURE, SPEC_FIXTURE, TESTING_FIXTURE];

// The fixtures are never written to disk, so no tsconfig includes them: let the
// type-aware parser treat them as files of the default project.
const eslint = new ESLint({
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  overrideConfig: {
    files: FIXTURES,
    languageOptions: { parserOptions: { projectService: { allowDefaultProject: FIXTURES } } },
  },
});

/** The rules a component source breaks when linted as the given file (app code by default). */
async function brokenRules(code, filePath = FIXTURE) {
  const [result] = await eslint.lintText(code, { filePath });
  const fatal = result.messages.find((message) => message.fatal);
  assert.equal(fatal, undefined, fatal?.message);
  return [...new Set(result.messages.map((message) => message.ruleId))];
}

/** A component with the given decorator body (one line per entry). */
const component = (...lines) =>
  [
    "import { Component } from '@angular/core';",
    '',
    '@Component({',
    ...lines.map((line) => `  ${line}`),
    '})',
    'export class Fixture {}',
    '',
  ].join('\n');

/** A directive with the given selector. */
const directive = (selector) =>
  [
    "import { Directive } from '@angular/core';",
    '',
    `@Directive({ selector: '${selector}' })`,
    'export class Fixture {}',
    '',
  ].join('\n');

describe('eslint: wt selector prefix', () => {
  it('blocks components without the wt prefix', async () => {
    const rules = await brokenRules(
      component("selector: 'app-root',", "templateUrl: './fixture.html',"),
    );
    assert.ok(rules.includes('@angular-eslint/component-selector'), rules.join());
  });

  it('blocks attribute components without the wt prefix', async () => {
    const rules = await brokenRules(
      component("selector: 'button[app-button]',", "templateUrl: './fixture.html',"),
    );
    assert.ok(rules.includes('@angular-eslint/component-selector'), rules.join());
  });

  it('blocks directives without the wt prefix', async () => {
    const rules = await brokenRules(directive('[appAutofocus]'));
    assert.ok(rules.includes('@angular-eslint/directive-selector'), rules.join());
  });

  it('allows wt element and attribute components and wt directives', async () => {
    assert.deepEqual(
      await brokenRules(
        component("selector: 'wt-number-field',", "templateUrl: './fixture.html',"),
      ),
      [],
    );
    assert.deepEqual(
      await brokenRules(
        component("selector: 'button[wt-button], a[wt-button]',", "templateUrl: './fixture.html',"),
      ),
      [],
    );
    assert.deepEqual(await brokenRules(directive('[wtAutofocus]')), []);
  });
});

describe('eslint: templates and styles in their own files', () => {
  it('blocks an inline template, even a one-liner', async () => {
    const rules = await brokenRules(component("selector: 'wt-fixture',", "template: '<p>Hi</p>',"));
    assert.ok(rules.includes('@angular-eslint/component-max-inline-declarations'), rules.join());
  });

  it('blocks inline styles, even a one-liner', async () => {
    const rules = await brokenRules(
      component(
        "selector: 'wt-fixture',",
        "templateUrl: './fixture.html',",
        "styles: ':host { display: block; }',",
      ),
    );
    assert.ok(rules.includes('@angular-eslint/component-max-inline-declarations'), rules.join());
  });

  it('allows an inline template in a spec, for test-only host components', async () => {
    assert.deepEqual(
      await brokenRules(
        component("selector: 'wt-fixture',", "template: '<p>Hi</p>',"),
        SPEC_FIXTURE,
      ),
      [],
    );
  });

  it('still blocks an inline template in test helpers outside specs', async () => {
    const rules = await brokenRules(
      component("selector: 'wt-fixture',", "template: '<p>Hi</p>',"),
      TESTING_FIXTURE,
    );
    assert.ok(rules.includes('@angular-eslint/component-max-inline-declarations'), rules.join());
  });

  it('allows templateUrl and styleUrl', async () => {
    assert.deepEqual(
      await brokenRules(
        component(
          "selector: 'wt-fixture',",
          "templateUrl: './fixture.html',",
          "styleUrl: './fixture.css',",
        ),
      ),
      [],
    );
  });
});
