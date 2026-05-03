#!/bin/zsh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

CLIENT_ID="${1:-verregassos}"
LOG_FILE="$PROJECT_ROOT/tmp/dev-server-${CLIENT_ID}.log"
mkdir -p "$PROJECT_ROOT/tmp"

open_in_chrome() {
  local url="$1"
  if [[ -d "/Applications/Google Chrome.app" ]]; then
    open -a "Google Chrome" "$url"
  else
    open "$url"
  fi
}

existing_url() {
  if lsof -nP -iTCP:4173 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "http://127.0.0.1:4173"
    return 0
  fi
  if lsof -nP -iTCP:4174 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "http://127.0.0.1:4174"
    return 0
  fi
  return 1
}

client_url() {
  local base="$1"
  echo "$base/?client=$CLIENT_ID"
}

if url="$(existing_url)"; then
  url="$(client_url "$url")"
  echo "Servidor ja actiu a $url"
  open_in_chrome "$url"
  exit 0
fi

nohup ./scripts/run-local-dev.sh >"$LOG_FILE" 2>&1 &

echo "Arrencant Mario per $CLIENT_ID..."
for _ in {1..60}; do
  if url="$(existing_url)"; then
    url="$(client_url "$url")"
    echo "Obrint $url"
    open_in_chrome "$url"
    exit 0
  fi
  sleep 1
done

echo "No he pogut detectar la URL del servidor. Revisa $LOG_FILE"
exit 1
