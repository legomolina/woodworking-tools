#!/usr/bin/env bash
# Stop hook: enforce the automatable part of the Definition of Done (lint,
# typecheck, unit tests) before Claude is allowed to finish its turn.
#
# - Skips when the working tree matches the last state that passed, so
#   conversational turns don't pay for a full run.
# - On failure, blocks the stop (exit 2) and feeds the errors back to Claude.
# - Loop guard: after MAX_BLOCKS consecutive failures it lets Claude stop and
#   warns the user, instead of looping forever on something it can't fix.

set -uo pipefail

MAX_BLOCKS=3

input=$(cat)
session_id=$(jq -r '.session_id // "unknown"' <<<"$input")

# shellcheck source=_env.sh
. "$(dirname "$0")/_env.sh"

state_dir="${TMPDIR:-/tmp}/claude-verify-$(id -u)"
mkdir -p "$state_dir"
project_key=$(printf '%s' "$PROJECT_DIR" | sha1sum | cut -c1-12)
green_file="$state_dir/$project_key.green"
blocks_file="$state_dir/$project_key.$session_id.blocks"

# Fingerprint of everything that differs from HEAD: tracked changes, untracked
# files, and HEAD itself.
fingerprint=$(
  {
    git rev-parse HEAD
    git diff HEAD
    git ls-files --others --exclude-standard -z | xargs -0 -r sha1sum
  } 2>/dev/null | sha1sum | cut -d' ' -f1
)

if [ -f "$green_file" ] && [ "$(cat "$green_file")" = "$fingerprint" ]; then
  exit 0
fi

failed=""
output=""
for script in lint typecheck test:ci; do
  if ! out=$(pnpm --silent "$script" 2>&1); then
    failed="$script"
    output="$out"
    break
  fi
done

if [ -z "$failed" ]; then
  echo "$fingerprint" >"$green_file"
  rm -f "$blocks_file"
  exit 0
fi

blocks=$(($(cat "$blocks_file" 2>/dev/null || echo 0) + 1))
echo "$blocks" >"$blocks_file"

if [ "$blocks" -gt "$MAX_BLOCKS" ]; then
  rm -f "$blocks_file"
  jq -n --arg s "$failed" --argjson n "$MAX_BLOCKS" \
    '{systemMessage: "⚠️ `pnpm \($s)` is still failing after \($n) attempts. Claude was allowed to stop; the work is NOT done."}'
  exit 0
fi

{
  echo "Definition of Done check failed: \`pnpm $failed\` (attempt $blocks of $MAX_BLOCKS)."
  echo "Fix the problems below before finishing. Do not weaken or skip tests or lint rules to make this pass."
  echo
  echo "$output" | tail -n 60
} >&2
exit 2
