import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs as angularConfig, processInlineTemplates } from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import { configs as typescriptConfig } from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

/**
 * Guards against tests that cannot fail, such as `expect(true).toBe(true)`:
 * `expect()` must receive the value under test, never a literal.
 */
const noTrivialExpect = [
  'error',
  {
    selector: [
      "CallExpression[callee.name='expect'] > Literal.arguments",
      "CallExpression[callee.name='expect'] > TemplateLiteral.arguments",
      "CallExpression[callee.name='expect'] > Identifier.arguments[name='undefined']",
    ].join(', '),
    message:
      'expect() must receive the value under test, not a literal. Put the expected value in the matcher: expect(actual).toBe(expected).',
  },
];

export default defineConfig(
  {
    files: ['src/**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.js', '**/*.d.ts'],
    extends: [
      eslint.configs.recommended,
      ...typescriptConfig.all,
      ...angularConfig.tsAll,
      prettierConfig,
      {
        languageOptions: {
          parserOptions: {
            projectService: true,
          },
        },
      },
    ],
    plugins: {
      'prettier': prettierPlugin,
      'unused-imports': unusedImports,
    },
    processor: processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      // Every selector uses the `wt` prefix (docs/adr/0003-component-styling.md):
      // `<wt-number-field>`, `button[wt-button]`, `[wtAutofocus]`.
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'wt',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['element', 'attribute'],
          prefix: 'wt',
          style: 'kebab-case',
        },
      ],
      // Templates and styles always live in their own files.
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        { template: 0, styles: 0, animations: 0 },
      ],
      '@angular-eslint/prefer-signals': 'warn',
      '@angular-eslint/no-experimental': 'off',
      'prettier/prettier': 'warn', // Enforce Prettier formatting as lint errors
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: [
            // Index signature
            'private-readonly-field',
            'private-field',
            'public-readonly-field',
            'public-field',
            'constructor',
            'method',
          ],
        },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'memberLike',
          modifiers: ['private', 'readonly', 'static'],
          format: ['UPPER_CASE'],
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'unused-imports/no-unused-imports': 'error',
      'prefer-template': 'warn',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
        },
      ],
      '@typescript-eslint/no-misused-spread': 'warn',
      'no-implicit-coercion': 'error',
    },
  },
  {
    files: ['src/**/*.spec.ts', 'src/**/*.mock.ts', 'e2e/**/*.ts', 'src/testing/**/*.ts'],
    extends: [eslint.configs.recommended, ...typescriptConfig.recommended, prettierConfig],
    rules: {
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@angular-eslint/component-max-inline-declarations': 'off',
      '@typescript-eslint/class-methods-use-this': 'off',
    },
  },
  {
    // Unit tests (Vitest): every test must assert something meaningful and run.
    files: ['src/**/*.spec.ts'],
    extends: [vitest.configs.recommended],
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
    rules: {
      // `expectNoAxeViolations` rejects on any violation, so it counts as an assertion.
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectNoAxeViolations'] },
      ],
      'vitest/valid-expect': 'error',
      'vitest/no-standalone-expect': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-commented-out-tests': 'error',
      'vitest/no-identical-title': 'error',
      'no-restricted-syntax': noTrivialExpect,
    },
  },
  {
    // End-to-end tests (Playwright).
    files: ['e2e/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/expect-expect': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-commented-out-tests': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'no-restricted-syntax': noTrivialExpect,
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angularConfig.templateRecommended, ...angularConfig.templateAccessibility],
    rules: {},
  },
);
