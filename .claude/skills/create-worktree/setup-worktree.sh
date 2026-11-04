#!/usr/bin/env bash
# Creates a sibling worktree for one issue (used by /create-worktree):
#   ../woodworking-tools-<issue> on a new <branch> from an up-to-date origin/main,
#   dependencies installed and the local Claude settings copied.
# Usage: setup-worktree.sh <issue-number> <branch>
set -euo pipefail

issue="${1:?Usage: setup-worktree.sh <issue-number> <branch>}"
branch="${2:?Usage: setup-worktree.sh <issue-number> <branch>}"

if ! command -v pnpm >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi
command -v pnpm >/dev/null 2>&1 || { echo "pnpm not found on PATH." >&2; exit 1; }

main_dir="$(git rev-parse --show-toplevel)"
worktree="$(dirname "$main_dir")/$(basename "$main_dir")-$issue"

[ -e "$worktree" ] && { echo "$worktree already exists." >&2; exit 1; }

git -C "$main_dir" fetch --quiet origin main
git -C "$main_dir" worktree add --quiet --no-track -b "$branch" "$worktree" origin/main

if [ -f "$main_dir/.claude/settings.local.json" ]; then
  cp "$main_dir/.claude/settings.local.json" "$worktree/.claude/settings.local.json"
fi

(cd "$worktree" && pnpm install --frozen-lockfile --silent)

echo "worktree=$worktree"
echo "branch=$branch"
echo "port=$((4200 + issue))"
