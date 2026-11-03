#!/usr/bin/env bash
# PostToolUse hook (Edit|Write|MultiEdit): format and lint the file Claude just
# edited. Auto-fixable problems are fixed silently; anything left is reported
# back to Claude (exit 2) so it fixes it before moving on.

set -uo pipefail

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' <<<"$input")

# shellcheck source=_env.sh
. "$(dirname "$0")/_env.sh"

[ -n "$file" ] && [ -f "$file" ] || exit 0

# Only files inside this project, excluding generated and vendored paths.
case "$file" in
  "$PROJECT_DIR"/*) rel="${file#"$PROJECT_DIR"/}" ;;
  *) exit 0 ;;
esac
case "$rel" in
  node_modules/* | dist/* | .angular/* | coverage/*) exit 0 ;;
esac

report() {
  {
    echo "$1 found problems in $rel that could not be fixed automatically:"
    echo "$2" | tail -n 40
  } >&2
  exit 2
}

if ! out=$(pnpm exec prettier --write --ignore-unknown --log-level warn "$file" 2>&1); then
  report "Prettier" "$out"
fi

case "$rel" in
  *.ts | *.html)
    if ! out=$(pnpm exec eslint --fix --no-warn-ignored --quiet "$file" 2>&1); then
      report "ESLint" "$out"
    fi
    ;;
  *.css)
    if ! out=$(pnpm exec stylelint --fix "$file" 2>&1); then
      report "Stylelint" "$out"
    fi
    ;;
esac

exit 0
