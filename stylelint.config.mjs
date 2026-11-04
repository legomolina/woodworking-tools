// Component styling rules: see docs/adr/0003-component-styling.md.
// Every rule here is proven against code it must block and allow in
// scripts/stylelint-rules.test.mjs.

/** Matches a custom property reference, the only way to use a token. */
const TOKEN = '/^var\\(--[a-z0-9-]+\\)$/';

/** @type {import("stylelint").Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-clean-order',
    'stylelint-plugin-logical-css/configs/recommended',
  ],
  plugins: ['stylelint-plugin-logical-css', './stylelint/no-external-import.mjs'],
  rules: {
    // Kebab-case, no BEM (`__element`, `--modifier`), at most one class per selector.
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
      { message: (name) => `Class "${name}" must be kebab-case, without BEM "__" or "--".` },
    ],
    'selector-max-class': 1,

    // No escaping emulated encapsulation, no specificity wars.
    'selector-pseudo-element-disallowed-list': [['ng-deep']],
    'declaration-no-important': true,

    // Colours and typography only through tokens (tokens.css is the exception).
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
      { message: (name) => `Use a colour token (var(--…)) instead of ${name}().` },
    ],
    'declaration-property-value-allowed-list': {
      'font': [TOKEN, 'inherit'],
      'font-family': [TOKEN, 'inherit'],
      'font-size': [TOKEN, 'inherit'],
    },

    // Fonts are declared once, in src/styles/fonts.css.
    'at-rule-disallowed-list': [['font-face']],

    // No external requests: url() and @import never have a scheme or a host.
    'import-notation': 'url',
    'function-url-scheme-allowed-list': [[]],
    'function-url-no-scheme-relative': true,
    'local/no-external-import': true,
  },
  overrides: [
    {
      // Global rules must never beat component styles: wrap them in :where().
      files: ['src/styles/reset.css', 'src/styles/base.css'],
      rules: {
        'selector-max-specificity': '0,0,0',
      },
    },
    {
      files: ['src/styles/fonts.css'],
      rules: {
        'at-rule-disallowed-list': null,
        'declaration-property-value-allowed-list': null,
      },
    },
    {
      // Generated from tokens.json: the one place literal values live.
      files: ['src/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
        'declaration-property-value-allowed-list': null,
        // Font stacks come from the snapshot as written (`Barlow`, `Menlo`).
        'value-keyword-case': null,
      },
    },
  ],
};
