#!/bin/zsh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

CLIENT_ID="${1:-verregassos}"
LOG_FILE="$PROJECT_ROOT/tmp/dev-server-${CLIENT_ID}.log"
mkdir -p "$PROJECT_ROOT/tmp"
PORT_CANDIDATES=(4173 4174 4175 4176)

open_in_chrome() {
  local url="$1"
  if [[ -d "/Applications/Google Chrome.app" ]]; then
    open -a "Google Chrome" "$url"
  else
    open "$url"
  fi
}

server_pid_for_port() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1
}

pid_project_root() {
  local pid="$1"
  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

existing_project_url() {
  local port pid cwd
  for port in "${PORT_CANDIDATES[@]}"; do
    pid="$(server_pid_for_port "$port")"
    if [[ -z "$pid" ]]; then
      continue
    fi
    cwd="$(pid_project_root "$pid")"
    if [[ "$cwd" == "$PROJECT_ROOT" ]]; then
      echo "http://127.0.0.1:$port"
      return 0
    fi
  done
  return 1
}

pick_available_port() {
  local port pid
  for port in "${PORT_CANDIDATES[@]}"; do
    pid="$(server_pid_for_port "$port")"
    if [[ -z "$pid" ]]; then
      echo "$port"
      return 0
    fi
  done
  return 1
}

client_url() {
  local base="$1"
  echo "$base/?client=$CLIENT_ID"
}

if url="$(existing_project_url)"; then
  url="$(client_url "$url")"
  echo "Servidor ja actiu a $url"
  open_in_chrome "$url"
  exit 0
fi

if ! port="$(pick_available_port)"; then
  echo "No hi ha cap port lliure a ${PORT_CANDIDATES[*]}. Tanca algun Mario o amplia la llista."
  exit 1
fi

SERVER_PORT="$port" nohup ./scripts/run-local-dev.sh >"$LOG_FILE" 2>&1 &

echo "Arrencant Mario per $CLIENT_ID al port $port..."
for _ in {1..60}; do
  if url="$(existing_project_url)"; then
    url="$(client_url "$url")"
    echo "Obrint $url"
    open_in_chrome "$url"
    exit 0
  fi
  sleep 1
done

echo "No he pogut detectar la URL del servidor. Revisa $LOG_FILE"
exit 1
