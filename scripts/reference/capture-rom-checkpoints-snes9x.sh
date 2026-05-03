#!/usr/bin/env bash
set -euo pipefail

ROM_PATH="${1:-/Users/pauavila/Downloads/Super Mario All-Stars + Super Mario World (USA).sfc}"
OUTPUT_DIR="${2:-tests/fixtures/rom_world11}"
COUNT="${3:-10}"
INTERVAL_SECONDS="${4:-4}"
START_DELAY_SECONDS="${5:-1}"

if [[ ! -f "$ROM_PATH" ]]; then
  echo "[error] ROM not found: $ROM_PATH" >&2
  exit 1
fi

if [[ ! -d ".venv-romcap" ]]; then
  python3 -m venv .venv-romcap
  . .venv-romcap/bin/activate
  pip install --quiet pyobjc-framework-Quartz
fi

mkdir -p "$OUTPUT_DIR"
tmp_dir="$(mktemp -d /tmp/allstars-romcap.XXXXXX)"
trap 'rm -rf "$tmp_dir"' EXIT

echo "[info] Opening ROM in Snes9x..."
osascript -e 'tell application "Snes9x" to activate' >/dev/null
osascript -e "tell application \"Snes9x\" to open POSIX file \"$ROM_PATH\"" >/dev/null || true

echo "[info] Forcing emulation resume..."
osascript \
  -e 'tell application "Snes9x" to activate' \
  -e 'delay 0.15' \
  -e 'tell application "System Events" to tell process "Snes9x" to click menu item "Resume" of menu 1 of menu bar item "Emulation" of menu bar 1' \
  >/dev/null || true

WIN_ID="$(
  . .venv-romcap/bin/activate
  python - <<'PY'
import Quartz
best = None
for w in Quartz.CGWindowListCopyWindowInfo(Quartz.kCGWindowListOptionAll, Quartz.kCGNullWindowID):
    if w.get("kCGWindowOwnerName") != "Snes9x":
        continue
    b = w.get("kCGWindowBounds", {})
    if b.get("Width", 0) >= 500 and b.get("Height", 0) >= 450:
        best = int(w.get("kCGWindowNumber"))
        break
if best is None:
    raise SystemExit(1)
print(best)
PY
)"

if [[ -z "$WIN_ID" ]]; then
  echo "[error] Could not detect Snes9x game window." >&2
  exit 1
fi

echo "[info] Window ID: $WIN_ID"
echo "[info] Waiting ${START_DELAY_SECONDS}s before first checkpoint..."
sleep "$START_DELAY_SECONDS"

for i in $(seq 1 "$COUNT"); do
  idx="$(printf '%02d' "$i")"
  raw_png="$tmp_dir/raw-$idx.png"
  out_png="$OUTPUT_DIR/checkpoint-$idx-expected.png"

  /usr/sbin/screencapture -x -l "$WIN_ID" "$raw_png"

  ffmpeg -hide_banner -loglevel error \
    -i "$raw_png" \
    -frames:v 1 \
    -vf "crop=iw:floor(iw*7/8):0:ih-floor(iw*7/8),scale=256:224:flags=neighbor,setsar=1:1" \
    -y "$out_png"

  echo "[ok] $out_png"
  if [[ "$i" -lt "$COUNT" ]]; then
    sleep "$INTERVAL_SECONDS"
  fi
done

echo "[ok] Generated $COUNT ROM checkpoints in $OUTPUT_DIR"
