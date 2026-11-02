# Woodworking Tools

A collection of client-side calculators and utilities for woodworkers: unit conversion, board-foot calculation, cut-list optimization and more. Each tool lives on its own page (e.g. `/unit-converter`, `/cut-optimizer`).

This is also a playground for **agentic software development**: most of the code is written by AI agents (Claude Code), with a human reviewing every change through pull requests.

## Stack

- [Angular](https://angular.dev) 22 (standalone components, signals, zoneless)
- [Vitest](https://vitest.dev) for unit tests
- ESLint, Prettier and Stylelint
- [pnpm](https://pnpm.io) as package manager

## Getting started

```bash
pnpm install   # also configures the git hooks (see "prepare")
pnpm start     # dev server at http://localhost:4200
```

## Scripts

| Script           | Description                                        |
| ---------------- | -------------------------------------------------- |
| `pnpm start`     | Start the dev server                               |
| `pnpm build`     | Production build into `dist/`                      |
| `pnpm test`      | Unit tests in watch mode                           |
| `pnpm test:ci`   | Unit tests, single run                             |
| `pnpm typecheck` | Type-check app and spec sources                    |
| `pnpm lint`      | Prettier check + ESLint + Stylelint                |
| `pnpm lint:fix`  | Auto-fix formatting and lint issues where possible |

## Workflow

Trunk-based development:

1. Create a short-lived branch from `main` (`feat/...`, `fix/...`, `chore/...`).
2. Open a pull request. Every PR gets its own preview deployment.
3. Iterate until CI is green and the preview has been verified.
4. Squash-merge into `main`, which deploys to production. The branch is deleted automatically.

A `pre-commit` hook (`.githooks/pre-commit`) runs `pnpm lint` and blocks commits that fail it.

## License

See [LICENSE](LICENSE).
