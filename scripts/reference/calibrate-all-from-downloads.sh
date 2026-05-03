#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
WORLD11_VIDEO="${1:-/Users/pauavila/Downloads/world11.mp4}"
GAMEOVER_VIDEO="${2:-/Users/pauavila/Downloads/world11-gameover.mp4}"
START_VIDEO="${3:-/Users/pauavila/Downloads/mar10-start.mp4}"

if [[ ! -f "$WORLD11_VIDEO" ]]; then
  echo "[error] Missing video: $WORLD11_VIDEO" >&2
  exit 1
fi
if [[ ! -f "$GAMEOVER_VIDEO" ]]; then
  echo "[error] Missing video: $GAMEOVER_VIDEO" >&2
  exit 1
fi
if [[ ! -f "$START_VIDEO" ]]; then
  echo "[error] Missing video: $START_VIDEO" >&2
  exit 1
fi

echo "[1/3] world11 expected + guide sync"
bash "$ROOT_DIR/scripts/reference/extract-checkpoints.sh" \
  "$WORLD11_VIDEO" \
  "$ROOT_DIR/scripts/reference/checkpoints-youtube-Y8EXjcb6XV8.txt" \
  "$ROOT_DIR/tests/fixtures/youtube"
mkdir -p "$ROOT_DIR/public/assets/reference/youtube"
rm -f "$ROOT_DIR/public/assets/reference/youtube"/checkpoint-*.png
for expected in "$ROOT_DIR"/tests/fixtures/youtube/checkpoint-*-expected.png; do
  [[ -f "$expected" ]] || continue
  base="$(basename "$expected" -expected.png)"
  cp "$expected" "$ROOT_DIR/public/assets/reference/youtube/${base}.png"
done

echo "[2/3] world11-gameover expected + guide sync"
bash "$ROOT_DIR/scripts/reference/world11-gameover-to-expected.sh" "$GAMEOVER_VIDEO"

echo "[3/3] mar10-start expected + guide sync"
bash "$ROOT_DIR/scripts/reference/mar10-start-to-expected.sh" "$START_VIDEO"

echo "[ok] All reference packs synced from /Downloads videos."
