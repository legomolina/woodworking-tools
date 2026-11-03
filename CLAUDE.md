# Woodworking Tools

Client-side calculators and utilities for woodworkers. Each **Tool** solves one woodworking task and lives on its own page. There is no backend: everything runs in the browser and is deployed as a static site.

Before working on anything domain-related, read `GLOSSARY.md` and use its terms exactly (in code, tests, issues and UI copy). Respect the decisions in `docs/adr/`.

## Commands

Use `pnpm`, never `npm` or `yarn`.

- `pnpm lint` / `pnpm lint:fix`: generated-token check + Prettier + ESLint + Stylelint (check / auto-fix)
- `pnpm tokens`: regenerate `src/styles/tokens.css` from the `tokens.json` snapshot
- `pnpm typecheck`: type-check app and spec sources
- `pnpm test:ci`: unit tests (Vitest), single run, then the tooling tests (`pnpm test:tooling`: token generator and lint rules, `node --test`). Prefer running a single spec file while iterating.
- `pnpm build`: production build
- `pnpm e2e`: end-to-end tests (Playwright, desktop + mobile), including the accessibility audit. Starts the dev server itself; set `E2E_BASE_URL` to test a deployed URL instead.

## Testing

- **Unit tests** (`src/**/*.spec.ts`, Vitest): domain logic in `*.calc.ts` and component behaviour.
- **Tooling tests** (`scripts/*.test.mjs`, `node:test`): the token generator, and every lint rule proven against code it must block and code it must allow.
- **End-to-end tests** (`e2e/`, Playwright): user flows in a real browser. `e2e/accessibility.spec.ts` audits every route listed in `e2e/routes.ts` against WCAG 2.2 AA with axe, in the light and dark themes. When you add a page, add its route there.
- Test-quality lint rules reject tests that cannot fail (no assertions, `expect(<literal>)`, conditional or skipped tests). Fix the test, never the rule.
- To check UI work visually, use the Playwright MCP tools against the running dev server (`pnpm start`): open the page, take a snapshot or screenshot, and compare with what was asked.

## Architecture

Organised by Tool, mirroring the domain language:

```
src/
├── styles/          # global styles only: styles.css imports fonts, tokens, reset, base
└── app/
    ├── core/        # shared services and providers (settings store, Tool registry, i18n)
    ├── layout/      # shell pieces (header, skip link, footer): eager, not a Tool
    ├── shared/
    │   ├── ui/      # wt-* components, directives and pipes (the design system)
    │   └── <name>/  # pure domain modules shared by Tools, e.g. measurement/
    └── tools/
        └── <tool-name>/ # e.g. unit-converter, cut-optimizer
            ├── <tool-name>.routes.ts   # lazy-loaded at /<tool-name>
            ├── <tool-name>.page.ts     # routed page component
            ├── *.calc.ts               # pure domain logic: no Angular, no DOM
            └── components/             # small presentational components
```

- One Tool = one lazy route at `/<tool-name>` (kebab-case, matching the folder).
- A Tool must NOT import from another Tool, nor from `layout/`. Move shared code to `shared/` (or `core/` for services and providers).
- Domain logic lives in pure functions in `*.calc.ts` so it can be tested without Angular. Components only handle input, state and presentation.
- Promote code to `shared/` only when a second Tool actually needs it. Design system components (`wt-*`) are the exception: they live in `shared/ui/` from day one.

## Workflow

Trunk-based development. Never commit directly to `main`.

1. Branch from an up-to-date `main`: `feat/<short-name>`, `fix/<short-name>` or `chore/<short-name>`.
2. Keep branches small and short-lived: one issue, one PR.
3. Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
4. Open a PR that links its issue (`Closes #<n>`). Every PR gets a preview deployment.
5. CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests and build, deploys the build to Cloudflare Pages (a preview per PR, production on `main`) and runs e2e against that deployment. A PR merges only when CI is green; if it fails, read the failing job's log (`gh run view --log-failed`) and fix the cause.
6. PRs are squash-merged; the branch is deleted after merging.

## Definition of Done

A change is done only when all of these hold:

- `pnpm lint`, `pnpm typecheck` and `pnpm test:ci` pass.
- For any UI change, `pnpm e2e` passes (including the accessibility audit).
- New or changed domain logic is covered by tests written test-first, asserting on behaviour through public interfaces, with expected values taken from the spec or worked examples (never recomputed the way the code does).
- All user-facing text is translated: English source plus Spanish, with no missing keys (see `docs/adr/0001-runtime-i18n-with-transloco.md`).
- The UI meets the accessibility requirements below.
- Code, comments, docs, commits and PR descriptions are in English.

Claude Code hooks (`.claude/hooks/`) enforce part of this automatically: every edited file is formatted and linted, and you cannot finish a turn while `pnpm lint`, `pnpm typecheck` or `pnpm test:ci` fail. When a hook reports a problem, fix the cause; never weaken a test, a lint rule or a hook to get past it.

## Styling

Full decisions in `docs/adr/0003-component-styling.md`; lint enforces most of them.

- Every selector uses the `wt` prefix. A single native element is an attribute selector (`button[wt-button]`); composites and form fields are elements (`<wt-number-field>`). Every building block is a `@Component` with scoped styles, never a styling directive.
- Reflect inputs that affect styling on the host under the same name (`host: { '[attr.variant]': 'variant()' }`) and style them with `:host([variant="primary"])`.
- No `::ng-deep`, no `!important`, no BEM, no utility classes. At most one class per selector, kebab-case; prefer element selectors.
- Logical properties only (`inline-size`, `margin-block-start`, `padding-inline`…).
- Colours and typography only through tokens: `color: var(--ink)`, `font: var(--text-body)`. Never edit `src/styles/tokens.css`: it is generated from the `tokens.json` snapshot of the design system (`pnpm tokens`).
- Global rules belong in `src/styles/` wrapped in `:where()`; everything else is styled by its component.
- Fonts are self-hosted (`public/fonts/`); never load anything from another origin.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for Tool routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Templates and styles always live in their own files (`button.ts`, `button.html`, `button.css`), never inline
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Agent skills

If you are asked to use a skill, command or subagent you cannot find or load, stop and say so. Do not carry on with your own version of it.

### Review before a PR

Run these before opening a PR, in parallel when both apply, and address their findings:

- `test-reviewer` subagent: the PR adds or changes tests.
- `a11y-auditor` subagent: the PR changes UI (needs `pnpm start` running).
- `mattpocock-skills:code-review` skill: every PR (standards + spec fidelity).

### Guardrails

When you add, change or remove a rule, hook, check or agent, record it in `docs/agents/guardrail-log.md`.

### Issue tracker

Issues are tracked in GitHub Issues (legomolina/woodworking-tools) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
