import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs as angularConfig, processInlineTemplates } from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import { configs as typescriptConfig } from 'typescript-eslint';

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
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
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
    files: ['**/*.html'],
    extends: [...angularConfig.templateRecommended, ...angularConfig.templateAccessibility],
    rules: {},
  },
);
