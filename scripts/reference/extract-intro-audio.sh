#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VIDEO_PATH="${1:-/Users/pauavila/Downloads/mar10-start.mp4}"
OUTPUT_PATH="${2:-$ROOT_DIR/public/audio/smas/intro_start.wav}"
INTRO_DURATION="${3:-11.08}"

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"
ffmpeg -hide_banner -loglevel error \
  -i "$VIDEO_PATH" \
  -vn \
  -ac 1 \
  -ar 32000 \
  -t "$INTRO_DURATION" \
  -y "$OUTPUT_PATH"

echo "[ok] Intro audio exported to $OUTPUT_PATH"
