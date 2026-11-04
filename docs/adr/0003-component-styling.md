# Component styling: wt components, scoped CSS and generated tokens

Every UI building block is an Angular `@Component` with emulated (scoped) styles, never a styling `@Directive`, and every selector uses the `wt` prefix (the root is `wt-root`). Styling goes through design tokens taken from the Woodworking Tools design system (https://claude.ai/artifact/7WbCYr1KNbFfmVqsvCyoRs). We copy its look and tokens, not its preview CSS (`wt-btn`-style classes). Lint rules back each decision so agents and humans cannot drift from it. Decided in a grilling session on 2026-11-03 (#19).

## Components

- A single native element that needs nothing around it is an **attribute selector** on that element: `button[wt-button]`, `a[wt-button]`. Composites and form fields are **element selectors**. A form field owns its native control and implements Signal Forms' custom control interface (`<wt-number-field>`, `<wt-select-field>`), wiring label, hint, error ids and `aria-describedby` itself.
- Selects stay native, enhanced with `appearance: base-select`. A custom listbox needs its own issue and a real need.
- Inputs that affect styling are reflected on the host under the same name (`host: { '[attr.variant]': 'variant()' }`) and styled with `:host([variant="primary"])`, so static values, bindings and defaults all match.
- Templates and styles always live in separate files (`button.ts`, `button.html`, `button.css`). Angular components always have a template, so even one that only projects its content (`button[wt-button]`) has a `.html` holding `<ng-content />`: the lint rule allows no inline template at all.
- No `wt-*` component is built ahead of need: the first ticket that uses one builds it in `shared/ui/`.

## CSS

- Emulated encapsulation; no `::ng-deep`, no `!important`, no BEM, no utility classes.
- At most one class per selector; element selectors preferred inside components. Class names are kebab-case.
- Logical properties only (`inline-size`, `margin-block-start`, `padding-inline`…).
- Colours and typography only through tokens (`var(--…)`). Literal colour and typography values live only in the generated `tokens.css`; `@font-face` only in `fonts.css`. No external URLs.
- Global styles live in `src/styles/`. `angular.json` lists only `styles.css`, which imports `fonts.css`, `tokens.css`, `reset.css` and `base.css`, in that order. Every rule in `reset.css` and `base.css` is wrapped in `:where()` (zero specificity), so component styles always win. `base.css` sets the body font and colours, heading styles, link colour and the global `:focus-visible` ring.

## Tokens and theme

- **Source of truth, for now: the design system artifact.** The repo keeps a snapshot of its tokens at `src/styles/tokens.json`, and `scripts/generate-tokens.mjs` (`pnpm tokens`) generates `src/styles/tokens.css` from it. `pnpm lint` fails when `tokens.css` is out of date with the snapshot (`pnpm tokens:check`). To update: refresh the snapshot from the artifact, then regenerate. Once the design is stable we will flip to code as the source and record that here.
- Colours become `--<name>`; aliases (`{tape-ink}`) become `var(--tape-ink)`. Spacing, radius and size tokens become `--<name>`. Font families become `--font-<family>`, and each text style becomes a `font` shorthand `--text-<style>` (plus `--text-<style>-letter-spacing` when it sets one), used as `font: var(--text-body)`. There are no size-only tokens: a component sets type with a `--text-*` shorthand, and `font-size` only takes `inherit` (or a future token).
- The theme follows `prefers-color-scheme` only, but `tokens.css` is ready for a forced theme: light on `:root`, dark inside `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and again on `:root[data-theme="dark"]`. Each theme also sets `color-scheme`. Nothing sets `data-theme` yet.

## Fonts

Self-hosted in `public/fonts/`, with no Google Fonts or other external requests: woff2, latin subset (covers Spanish), and only the weights the design system uses (Barlow 400/500/600, IBM Plex Mono 400/500), each folder with its `OFL.txt`. `font-display: swap`; Barlow 400 is preloaded in `index.html`.

## Enforcement

- ESLint: `@angular-eslint/component-selector` (element and attribute, kebab-case) and `directive-selector` require `wt`; `component-max-inline-declarations` forbids inline templates and styles.
- Stylelint: class pattern, `selector-max-class: 1`, no `::ng-deep`, no `!important`, logical properties (`stylelint-plugin-logical-css`, which the repo already used; it covers what `stylelint-use-logical` would), token-only colours / `font` / `font-family` / `font-size`, `@font-face` only in `fonts.css`, `:where()` (zero specificity) for every rule in `reset.css` and `base.css`, no external URLs in `url()` or `@import` (a local plugin, `stylelint/no-external-import.mjs`, because the built-in URL rules skip `@import`).
- Each rule is tested against code it must block and code it must allow (`scripts/*-rules.test.mjs`, run by `pnpm test:ci`).

## Considered Options

- **Styling directives** (`<button wtButton>`): lighter, but split behaviour and styles across global CSS and cannot own the markup a form field needs. Components with scoped styles keep each building block in one place.
- **Copying the design system's preview CSS** (`wt-btn` classes): fast, but brings global utility classes and BEM-like modifiers into an app built on scoped components.
- **Tokens as code from day one**: the design is still changing in the artifact; generating from a snapshot keeps the two in sync without hand-editing CSS.
- **Google Fonts**: zero setup, but an external request on every page load (privacy, offline shop use) and against the no-external-URL rule.
