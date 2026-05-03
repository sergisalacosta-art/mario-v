#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://www.youtube.com/watch?v=Y8EXjcb6XV8}"
CHECKPOINTS="${2:-scripts/reference/checkpoints-youtube-Y8EXjcb6XV8.txt}"
OUTPUT_DIR="${3:-tests/fixtures/youtube}"
VIDEO_OUT="${4:-tmp/reference/smas_1-1_ref.mp4}"

YTDLP_BIN="${YTDLP_BIN:-$HOME/Library/Python/3.14/bin/yt-dlp}"
if [[ ! -x "$YTDLP_BIN" ]]; then
  YTDLP_BIN="$(command -v yt-dlp || true)"
fi

if [[ -z "$YTDLP_BIN" || ! -x "$YTDLP_BIN" ]]; then
  echo "[error] yt-dlp not found. Install with:" >&2
  echo "python3 -m pip install --user --break-system-packages yt-dlp" >&2
  exit 1
fi

mkdir -p "$(dirname "$VIDEO_OUT")"

echo "[1/2] Downloading reference video..."
"$YTDLP_BIN" \
  -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" \
  --merge-output-format mp4 \
  -o "${VIDEO_OUT%.mp4}.%(ext)s" \
  "$URL"

echo "[2/2] Extracting expected checkpoints..."
bash scripts/reference/extract-checkpoints.sh "$VIDEO_OUT" "$CHECKPOINTS" "$OUTPUT_DIR"

echo "[ok] Expected checkpoints generated in: $OUTPUT_DIR"
