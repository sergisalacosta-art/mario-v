#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VIDEO_PATH="${1:-/Users/pauavila/Downloads/world11-gameover.mp4}"
CHECKPOINTS_FILE="${2:-$ROOT_DIR/scripts/reference/checkpoints-world11-gameover.txt}"
OUTPUT_DIR="${3:-$ROOT_DIR/tests/fixtures/world11-gameover}"
PUBLIC_REF_DIR="${4:-$ROOT_DIR/public/assets/reference/world11-gameover}"

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi

bash "$ROOT_DIR/scripts/reference/extract-checkpoints.sh" "$VIDEO_PATH" "$CHECKPOINTS_FILE" "$OUTPUT_DIR"

mkdir -p "$PUBLIC_REF_DIR"
for expected in "$OUTPUT_DIR"/checkpoint-*-expected.png; do
  [[ -f "$expected" ]] || continue
  base="$(basename "$expected")"
  target="${base/-expected/}"
  cp "$expected" "$PUBLIC_REF_DIR/$target"
done

echo "[ok] Synced guide frames to $PUBLIC_REF_DIR"
