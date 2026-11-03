# Shared setup for Claude Code hook scripts. Source it, don't execute it.
#
# Hooks run in non-interactive shells that don't load the user's profile, so
# pnpm (installed through nvm) may not be on PATH.

if ! command -v pnpm >/dev/null 2>&1; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Hook error: pnpm not found on PATH. Install it or enable nvm." >&2
  exit 1
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
cd "$PROJECT_DIR" || exit 1
