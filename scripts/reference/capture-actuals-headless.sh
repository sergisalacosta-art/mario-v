#!/usr/bin/env bash
set -euo pipefail

CHECKPOINTS_FILE="${1:-scripts/reference/checkpoints-youtube-Y8EXjcb6XV8.txt}"
OUTPUT_DIR="${2:-tests/fixtures/youtube}"
BASE_URL="${3:-http://127.0.0.1:4174}"
REPLAY_URL="${REPLAY_URL:-}"
VARIANT_ID="${VARIANT_ID:-world1_1}"

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

if [[ ! -f "$CHECKPOINTS_FILE" ]]; then
  echo "[error] checkpoints file not found: $CHECKPOINTS_FILE" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[error] ffmpeg not found in PATH." >&2
  exit 1
fi

guide_mode=""
case "$(basename "$CHECKPOINTS_FILE")" in
  checkpoints-youtube-Y8EXjcb6XV8.txt)
    guide_mode="youtube"
    ;;
  checkpoints-world11-gameover.txt)
    guide_mode="world11-gameover"
    ;;
  checkpoints-mar10-start.txt)
    guide_mode="intro-start"
    ;;
esac
if [[ -n "$REPLAY_URL" ]]; then
  guide_mode=""
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
    echo "[error] last preview log lines:" >&2
    tail -n 40 /tmp/allstars_preview.log >&2 || true
    exit 1
  fi
fi

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/checkpoint-*-actual.png

detected_crop=""

normalize_timestamp() {
  local raw="$1"
  local t1 t2 t3 sec_int sec_frac
  IFS=':' read -r t1 t2 t3 <<< "$raw"
  if [[ -z "${t3:-}" ]]; then
    if [[ -z "${t2:-}" ]]; then
      t3="${t1:-0}"
      t2="0"
      t1="0"
    else
      t3="${t2}"
      t2="${t1:-0}"
      t1="0"
    fi
  fi
  t1="${t1:-0}"
  t2="${t2:-0}"
  sec_int="${t3%%.*}"
  sec_frac="${t3#*.}"
  if [[ "$sec_frac" == "$t3" ]]; then
    sec_frac="000"
  fi
  sec_frac="$(printf '%-3s' "$sec_frac" | tr ' ' '0' | cut -c1-3)"
  printf '%02d:%02d:%02d.%s' "$((10#$t1))" "$((10#$t2))" "$((10#${sec_int:-0}))" "$sec_frac"
}

ms_from_timestamp() {
  local ts="$1"
  local hh mm ssf sec frac
  IFS=':' read -r hh mm ssf <<< "$ts"
  sec="${ssf%%.*}"
  frac="${ssf#*.}"
  if [[ "$frac" == "$ssf" ]]; then
    frac="000"
  fi
  frac="$(printf '%-3s' "$frac" | tr ' ' '0' | cut -c1-3)"
  echo $((10#$hh * 3600000 + 10#$mm * 60000 + 10#$sec * 1000 + 10#$frac))
}

profile_dir="$(mktemp -d /tmp/allstars-capture-profile.XXXXXX)"
raw_dir="$(mktemp -d /tmp/allstars-capture-raw.XXXXXX)"
chrome_err_log="$(mktemp /tmp/allstars-capture-chrome.XXXXXX)"
trap 'rm -rf "$profile_dir" "$raw_dir" "$chrome_err_log"; cleanup' EXIT

index=1
while IFS= read -r line || [[ -n "$line" ]]; do
  clean="${line%%#*}"
  clean="$(printf '%s' "$clean" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$clean" ]] && continue

  timestamp_raw="${clean%% *}"
  timestamp="$(normalize_timestamp "$timestamp_raw")"
  ms_total="$(ms_from_timestamp "$timestamp")"
  sec_part=$((ms_total / 1000))
  ms_part=$((ms_total % 1000))
  seek_seconds="$(printf '%d.%03d' "$sec_part" "$ms_part")"
  budget_ms=$((ms_total + 2500))

  raw_file="$(printf '%s/raw-%02d.png' "$raw_dir" "$index")"
  out_file="$(printf '%s/checkpoint-%02d-actual.png' "$OUTPUT_DIR" "$index")"
  checkpoint_profile_dir="$(printf '%s/profile-%02d' "$profile_dir" "$index")"
  mkdir -p "$checkpoint_profile_dir"

  echo "[info] Capturing checkpoint $(printf '%02d' "$index") at ${timestamp}..."
  if [[ -n "$REPLAY_URL" ]]; then
    url="${BASE_URL}/?capture=1&variant=${VARIANT_ID}&replay=${REPLAY_URL}&pauseOnSeek=1&seek=${seek_seconds}&mute=1&cb=${index}"
  elif [[ "$guide_mode" == "intro-start" ]]; then
    url="${BASE_URL}/?scene=intro&capture=1&variant=${VARIANT_ID}&pauseOnSeek=1&seek=${seek_seconds}&mute=1&cb=${index}"
    budget_ms=3500
  elif [[ -n "$guide_mode" ]]; then
    url="${BASE_URL}/?capture=1&variant=${VARIANT_ID}&guide=${guide_mode}&checkpoint=${index}&mute=1&cb=${index}"
    budget_ms=3500
  else
    url="${BASE_URL}/?capture=1&variant=${VARIANT_ID}&autoplay=1&pauseOnSeek=1&seek=${seek_seconds}&mute=1&cb=${index}"
  fi
  watchdog_s=$((budget_ms / 1000 + 12))
  if [[ "$watchdog_s" -lt 15 ]]; then
    watchdog_s=15
  fi
  if [[ "$watchdog_s" -gt 90 ]]; then
    watchdog_s=90
  fi

  set +e
  "$CHROME_BIN" \
    --headless \
    --run-all-compositor-stages-before-draw \
    --disable-gpu \
    --window-size=256,224 \
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
    --user-data-dir="$checkpoint_profile_dir" \
    --screenshot="$raw_file" \
    "$url" >"$chrome_err_log" 2>&1 &
  chrome_pid="$!"
  (
    elapsed=0
    while [[ "$elapsed" -lt "$watchdog_s" ]]; do
      if ! kill -0 "$chrome_pid" >/dev/null 2>&1; then
        exit 0
      fi
      sleep 1
      elapsed=$((elapsed + 1))
    done
    if kill -0 "$chrome_pid" >/dev/null 2>&1; then
      kill "$chrome_pid" >/dev/null 2>&1 || true
      sleep 0.5
      kill -9 "$chrome_pid" >/dev/null 2>&1 || true
    fi
  ) >/dev/null 2>&1 &
  wait "$chrome_pid"
  chrome_status=$?
  set -e

  if [[ "$chrome_status" -ne 0 ]]; then
    if [[ -s "$raw_file" ]]; then
      echo "[warn] chrome exited with status $chrome_status but screenshot exists; continuing." >&2
    else
      echo "[error] chrome capture failed at checkpoint $(printf '%02d' "$index") (exit=$chrome_status)" >&2
      tail -n 40 "$chrome_err_log" >&2 || true
      exit 1
    fi
  fi

  if [[ ! -s "$raw_file" ]]; then
    echo "[error] chrome capture produced no output at checkpoint $(printf '%02d' "$index")" >&2
    tail -n 40 "$chrome_err_log" >&2 || true
    exit 1
  fi

  raw_dims="$(node - "$raw_file" <<'NODE'
const fs = require('fs');
const { PNG } = require('pngjs');
const file = process.argv[2];
const png = PNG.sync.read(fs.readFileSync(file));
process.stdout.write(`${png.width}x${png.height}`);
NODE
)"
  if [[ "$raw_dims" == "256x224" ]]; then
    cp "$raw_file" "$out_file"
    echo "[ok] $out_file <= $timestamp (native 256x224)"
    index=$((index + 1))
    continue
  fi

  if [[ -z "$detected_crop" ]]; then
    detected_crop="$(node - "$raw_file" <<'NODE'
const fs = require('fs');
const { PNG } = require('pngjs');
const file = process.argv[2];
const png = PNG.sync.read(fs.readFileSync(file));
let minX = png.width;
let minY = png.height;
let maxX = -1;
let maxY = -1;

for (let y = 0; y < png.height; y += 1) {
  for (let x = 0; x < png.width; x += 1) {
    const idx = (y * png.width + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    if (r === 0 && g === 0 && b === 0) {
      continue;
    }
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}

if (maxX < minX || maxY < minY) {
  process.stdout.write('');
  process.exit(0);
}

const w = maxX - minX + 1;
const h = maxY - minY + 1;
process.stdout.write(`crop=${w}:${h}:${minX}:${minY}`);
NODE
)"
    if [[ -n "$detected_crop" ]]; then
      echo "[info] Detected capture crop: $detected_crop"
    else
      echo "[warn] Could not detect non-black crop box; using centered fallback crop."
    fi
  fi

  vf_chain=""
  if [[ -n "$detected_crop" ]]; then
    vf_chain="${detected_crop},scale=256:224:flags=neighbor,setsar=1:1"
  else
    vf_chain="crop='min(iw,ih*256/224)':'min(ih,iw*224/256)',scale=256:224:flags=neighbor,setsar=1:1"
  fi

  ffmpeg -hide_banner -loglevel error \
    -i "$raw_file" \
    -frames:v 1 \
    -vf "$vf_chain" \
    -y "$out_file"

  echo "[ok] $out_file <= $timestamp"
  index=$((index + 1))
done < "$CHECKPOINTS_FILE"

count=$((index - 1))
echo "[ok] Generated $count actual checkpoints in $OUTPUT_DIR"
