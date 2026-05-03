#!/usr/bin/env bash
set -euo pipefail

OUTPUT_JSON="${1:-public/replays/autoplay_40s.json}"
SEEK_SECONDS="${2:-40.0}"
BASE_URL="${3:-http://127.0.0.1:4174}"

CHROME_BIN="${CHROME_BIN:-}"
if [[ -z "$CHROME_BIN" ]]; then
  if [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
    CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  elif command -v google-chrome >/dev/null 2>&1; then
    CHROME_BIN="$(command -v google-chrome)"
  elif command -v chromium >/dev/null 2>&1; then
    CHROME_BIN="$(command -v chromium)"
  fi
fi

if [[ -z "$CHROME_BIN" || ! -x "$CHROME_BIN" ]]; then
  echo "[error] Chrome/Chromium not found. Set CHROME_BIN env var." >&2
  exit 1
fi

started_preview=0
preview_pid=""
cleanup() {
  if [[ "$started_preview" -eq 1 && -n "$preview_pid" ]]; then
    kill "$preview_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if ! curl -fsS "$BASE_URL" >/dev/null 2>&1; then
  if [[ "$BASE_URL" != "http://127.0.0.1:4174" ]]; then
    echo "[error] base URL unreachable: $BASE_URL" >&2
    echo "Run your server first or use default URL for auto preview." >&2
    exit 1
  fi

  if [[ ! -d dist ]]; then
    echo "[info] dist/ not found, building..."
    npm run build >/dev/null
  fi

  echo "[info] Starting temporary preview server on 127.0.0.1:4174..."
  npm run preview -- --host 127.0.0.1 --port 4174 --strictPort >/tmp/allstars_preview.log 2>&1 &
  preview_pid="$!"
  started_preview=1

  for _ in $(seq 1 60); do
    if curl -fsS "$BASE_URL" >/dev/null 2>&1; then
      break
    fi
    sleep 0.2
  done

  if ! curl -fsS "$BASE_URL" >/dev/null 2>&1; then
    echo "[error] preview server did not become ready at $BASE_URL" >&2
    tail -n 40 /tmp/allstars_preview.log >&2 || true
    exit 1
  fi
fi

sec_int="${SEEK_SECONDS%%.*}"
sec_frac="${SEEK_SECONDS#*.}"
if [[ "$sec_frac" == "$SEEK_SECONDS" ]]; then
  sec_frac="000"
fi
sec_frac="$(printf '%-3s' "$sec_frac" | tr ' ' '0' | cut -c1-3)"
seek_ms=$((10#$sec_int * 1000 + 10#$sec_frac))
budget_ms=$((seek_ms + 3000))

tmp_dom="$(mktemp /tmp/allstars-replay-dump.XXXXXX.html)"
trap 'rm -f "$tmp_dom"; cleanup' EXIT

url="${BASE_URL}/?capture=1&autoplay=1&pauseOnSeek=1&seek=${SEEK_SECONDS}&dumpReplay=1&mute=1&cb=replaydump"

echo "[info] Exporting replay from autoplay run @ seek=${SEEK_SECONDS}s ..."
"$CHROME_BIN" \
  --headless \
  --run-all-compositor-stages-before-draw \
  --disable-gpu \
  --window-size=1024,768 \
  --virtual-time-budget="$budget_ms" \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --disable-component-update \
  --disable-sync \
  --disable-default-apps \
  --metrics-recording-only \
  --mute-audio \
  --disable-features=MediaRouter,OptimizationHints,AutofillServerCommunication \
  --dump-dom \
  "$url" > "$tmp_dom"

mkdir -p "$(dirname "$OUTPUT_JSON")"

node -e "
const fs = require('fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const match = html.match(/data-smas-replay-b64=&quot;([^&]+)&quot;/) || html.match(/data-smas-replay-b64=\"([^\"]+)\"/);
if (!match) {
  console.error('[error] replay dump not found in DOM');
  process.exit(1);
}
const b64 = match[1];
const json = Buffer.from(b64, 'base64').toString('utf8');
const replay = JSON.parse(json);
if (!Array.isArray(replay.frames)) {
  console.error('[error] invalid replay payload');
  process.exit(1);
}
fs.writeFileSync(process.argv[2], JSON.stringify(replay, null, 2));
console.log('[ok] replay frames=' + replay.frames.length + ' -> ' + process.argv[2]);
" "$tmp_dom" "$OUTPUT_JSON"

