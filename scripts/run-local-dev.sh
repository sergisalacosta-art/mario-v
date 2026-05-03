#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export NVM_DIR="$HOME/.nvm"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1; then
  LATEST_NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort | tail -n 1 || true)"
  if [[ -n "$LATEST_NODE_BIN" ]]; then
    export PATH="$LATEST_NODE_BIN:$PATH"
  fi
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "No s'ha trobat Node.js. Revisa ~/.nvm o reinstal·la Node." >&2
  exit 1
fi

cd "$PROJECT_ROOT"
exec npm run dev -- --host 127.0.0.1 --port 4173
