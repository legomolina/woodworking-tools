---
name: implement
description: Take one GitHub issue from a worktree to an open, green PR. Run it in the main checkout to set the worktree up, then again inside that worktree to build it.
disable-model-invocation: true
argument-hint: <issue-number>
---

Issue: `$ARGUMENTS`. Without a number, ask for one.

Pick the phase by where this session runs: `git rev-parse --git-dir` equal to `git rev-parse --git-common-dir` means the **main checkout** (phase 1); different means a **linked worktree** (phase 2).

## Phase 1: set up the worktree (main checkout)

1. `gh issue view <n> --json title,state,labels,body`, then state the title. Stop and say why when the issue is closed, or when `gh api repos/{owner}/{repo}/issues/<n> --jq .issue_dependencies_summary.blocked_by` is above 0 (an open issue blocks it).
2. Choose the branch: `feat/`, `fix/` or `chore/` plus a short kebab-case name taken from the issue.
3. Run `.claude/skills/implement/setup-worktree.sh <n> <branch>`. It prints the worktree path, branch and port.
4. Claim the issue: `gh issue edit <n> --add-assignee @me`.
5. Tell the user, and stop there: open a Claude Code session in the worktree path and run `/implement <n>`. Recommend a model: Sonnet for a mechanical ticket (a pattern to follow, specs to fill in), Opus for diagnosis, new UI or design decisions.

Done when the worktree exists with dependencies installed and the user has the folder and the command.

## Phase 2: build it (linked worktree)

Other sessions run in parallel worktrees, so this one owns the port **4200 + issue number** and uses it everywhere: `pnpm start --port <port>`, `E2E_PORT=<port> pnpm e2e`, and that URL for the Playwright MCP tools and the `a11y-auditor`.

1. Confirm the worktree is on the issue's branch, not `main`, and rebase it onto `origin/main` if it is behind.
2. Read the issue with its comments (`gh issue view <n> --comments`), state its title, and read everything it points at: parent issue, linked design, ADRs, `GLOSSARY.md`.
3. Build it with the `mattpocock-skills:tdd` skill. A bug or flaky behaviour goes through `mattpocock-skills:diagnosing-bugs` first: find the cause before changing code. Run single spec files and `pnpm typecheck` while iterating.
4. Meet the Definition of Done in `CLAUDE.md`, every line of it. Check UI against the design in the browser.
5. Run the reviews in `CLAUDE.md` › Review before a PR and fix what they find.
6. Commit with Conventional Commits. Then `git push -u origin <branch>` as a command of its own, and `gh pr create` separately, with a body written with the `mattpocock-skills:pr` skill that starts with `Closes #<n>`.
7. Watch CI: `gh pr checks <pr> --watch`. A red job: read `gh run view --log-failed`, fix the cause, push again. A green e2e job can still hide retried failures: search its log for `flaky` and treat each one as a failure to fix or, when it predates this branch, to report.

Done when the PR is open, every check is green with no flaky test introduced by this branch, and you have given the user the PR link and anything you decided that the issue left open.
