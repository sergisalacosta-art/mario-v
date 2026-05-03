#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VIDEO_PATH="${1:-/Users/pauavila/Downloads/mar10-start.mp4}"
OUTPUT_PATH="${2:-$ROOT_DIR/public/assets/reference/mar10-start/intro.mp4}"

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"
ffmpeg -hide_banner -loglevel error \
  -i "$VIDEO_PATH" \
  -an \
  -vf "scale=256:224:flags=neighbor,setsar=1:1" \
  -c:v libx264 \
  -preset veryfast \
  -crf 18 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -y "$OUTPUT_PATH"

echo "[ok] Intro video exported to $OUTPUT_PATH"
