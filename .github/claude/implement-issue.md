# Implementing an issue from GitHub (`@claude`)

The steps `@claude` follows when asked to implement an issue. A comment as short as "implement this issue" is enough. Anything the comment adds or changes wins over these steps.

1. Read the issue with its comments (`gh issue view <n> --comments`) and everything it points at: its parent issue, linked designs, the ADRs in `docs/adr/` and `GLOSSARY.md`. Stop and say why when an open issue still blocks it.
2. Build it with the `mattpocock-skills:tdd` skill. For a bug, use `mattpocock-skills:diagnosing-bugs` first, and find the cause before changing code.
3. Meet every line of the Definition of Done in `CLAUDE.md`. When `*.calc.ts` changes, that includes `pnpm mutation`. This runner has no browser, so leave UI checks and `pnpm e2e` to CI, and say so.
4. Review before finishing, and fix what the reviews find:
   - the `test-reviewer` subagent, when you added or changed tests;
   - the `mattpocock-skills:code-review` skill, always.
5. Commit with Conventional Commits and push the branch. Do not open the PR yourself. Give the "Create PR" link, with a title in Conventional Commits form and a body that starts with `Closes #<n>`. The owner opens the PR, so the automatic review runs on it.
6. End your comment with:
   - what changed;
   - every acceptance criterion, ticked or explained;
   - the checks you ran and their results;
   - anything you decided that the issue left open.
