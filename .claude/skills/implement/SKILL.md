---
name: implement
description: Take one GitHub issue to an open, green PR, inside a worktree made by /create-worktree.
disable-model-invocation: true
argument-hint: <issue-number>
---

Issue: `$ARGUMENTS`. Without a number, ask for one.

This runs inside a linked worktree: `git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`. In the main checkout, stop and tell the user to run `/create-worktree <n>` first.

Other sessions run in parallel worktrees, so this one owns the port **4200 + issue number**. Use it everywhere:

- `pnpm start --port <port>`;
- `E2E_PORT=<port> pnpm e2e`;
- its URL for the Playwright MCP tools and the `a11y-auditor`.

Set the session title to `#<n> <issue title>` when the IDE offers a session-title tool (PhpStorm Air's `air_set_session_title`, a deferred tool), so parallel sessions can be told apart. It errors outside an Air session; then carry on without a title.

Before starting, confirm the worktree is on the issue's branch, not `main`, and rebase it onto `origin/main` if it is behind.

Then follow `docs/agents/implement-issue.md`, taking its **Locally** branch at each step. Its completion criterion is this skill's.
