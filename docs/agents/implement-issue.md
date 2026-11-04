# Implementing an issue

The steps for taking one issue to a PR. Two entry points follow them:

- **`@claude` on GitHub**: `.github/workflows/claude.yml` points here. It runs on a runner with no browser.
- **`/implement <n>` locally**: `.claude/skills/implement/`, inside a worktree made by `/create-worktree <n>`. It owns port 4200 + n.

Where the two differ, the step says so. Anything the request adds or changes wins over these steps.

1. Read the issue with its comments (`gh issue view <n> --comments`) and everything it points at: its parent issue, linked designs, the ADRs in `docs/adr/` and `GLOSSARY.md`. Stop and say why when an open issue still blocks it.
2. Build it with the `mattpocock-skills:tdd` skill. For a bug or flaky behaviour, use `mattpocock-skills:diagnosing-bugs` first, and find the cause before changing code. Run single spec files and `pnpm typecheck` while iterating.
3. Meet every line of the Definition of Done in `CLAUDE.md`. When `*.calc.ts` changes, that includes `pnpm mutation`. UI work:
   - **Locally**: check it against the design in the browser and run `E2E_PORT=<port> pnpm e2e`.
   - **On GitHub**: there is no browser, so leave both to CI and say so.
4. Review before finishing, and fix what the reviews find:
   - the `test-reviewer` subagent, when you added or changed tests;
   - **locally only**: the `a11y-auditor` subagent, when the UI changed, with the dev server URL;
   - the `mattpocock-skills:code-review` skill, always.
5. Commit with Conventional Commits. Run `git push` as a command of its own. Then:
   - **Locally**: open the PR with `gh pr create`, as its own command, and a body written with the `mattpocock-skills:pr` skill that starts with `Closes #<n>`.
   - **On GitHub**: do not open the PR yourself. Give the "Create PR" link, with a title in Conventional Commits form and a body that starts with `Closes #<n>`. The owner opens the PR, so the owner-only automatic review runs on it.
6. **Locally**, watch CI with `gh pr checks <pr> --watch`.
   - A red job: read `gh run view --log-failed`, fix the cause and push again.
   - A green e2e job can still hide retried failures. Search its log for `flaky`, and treat each one as a failure to fix. When it predates this branch, report it instead.
7. Finish with a summary:
   - what changed;
   - every acceptance criterion, ticked or explained;
   - the checks you ran and their results;
   - the PR link, or the "Create PR" link on GitHub;
   - anything you decided that the issue left open.

Done when the work is pushed and every criterion and check is accounted for. Locally, the PR must also be open with every check green and no flaky test introduced by this branch.
