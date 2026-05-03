#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VIDEO_PATH="${1:-/Users/pauavila/Downloads/mar10-start.mp4}"
CHECKPOINTS_FILE="${2:-$ROOT_DIR/scripts/reference/checkpoints-mar10-start.txt}"
OUTPUT_DIR="${3:-$ROOT_DIR/tests/fixtures/mar10-start}"
PUBLIC_REF_DIR="${4:-$ROOT_DIR/public/assets/reference/mar10-start}"

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR" "$PUBLIC_REF_DIR"
bash "$ROOT_DIR/scripts/reference/extract-checkpoints.sh" "$VIDEO_PATH" "$CHECKPOINTS_FILE" "$OUTPUT_DIR" "none"

rm -f "$PUBLIC_REF_DIR"/checkpoint-*.png
for expected in "$OUTPUT_DIR"/checkpoint-*-expected.png; do
  [[ -f "$expected" ]] || continue
  base="$(basename "$expected" -expected.png)"
  cp "$expected" "$PUBLIC_REF_DIR/${base}.png"
done

echo "[ok] Synced guide frames to $PUBLIC_REF_DIR"
