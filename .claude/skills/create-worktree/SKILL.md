---
name: create-worktree
description: Set up a sibling worktree for one GitHub issue, ready for a parallel session to run /implement in it.
disable-model-invocation: true
argument-hint: <issue-number>
---

Issue: `$ARGUMENTS`. Without a number, ask for one. Run this in the main checkout: when `git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`, this session is already in a worktree, so say so and stop.

1. `gh issue view <n> --json title,state,labels`, then state the title. Stop and say why when the issue is closed, or when `gh api repos/{owner}/{repo}/issues/<n> --jq .issue_dependencies_summary.blocked_by` is above 0 (an open issue blocks it).
2. Choose the branch: `feat/`, `fix/` or `chore/`, plus a short kebab-case name taken from the issue.
3. Run `.claude/skills/create-worktree/setup-worktree.sh <n> <branch>`. It prints the worktree path, branch and port.
4. Claim the issue: `gh issue edit <n> --add-assignee @me`.
5. Tell the user, and stop there:
   - Open a Claude Code session in the worktree path and run `/implement <n>`.
   - Recommend a model: Sonnet for a mechanical ticket (a pattern to follow, specs to fill in), and Opus for diagnosis, new UI or design decisions.
   - For pure domain logic with no UI, `@claude implement this issue` on GitHub is an alternative that needs no worktree.

Done when the worktree exists with dependencies installed, and the user has the folder and the command.
