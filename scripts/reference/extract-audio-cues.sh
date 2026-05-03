#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VIDEO_PATH="${1:-/Users/pauavila/Downloads/mario-sound.mp4}"
CUES_FILE="${2:-$ROOT_DIR/scripts/reference/audio-cues-mario-sound.txt}"
OUTPUT_DIR="${3:-$ROOT_DIR/tests/fixtures/audio-cues}"

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi
if [[ ! -f "$CUES_FILE" ]]; then
  echo "[error] Cue file not found: $CUES_FILE" >&2
  exit 1
fi
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "[error] ffmpeg not found in PATH." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*.wav

count=0
while IFS= read -r line || [[ -n "$line" ]]; do
  clean="${line%%#*}"
  clean="$(printf '%s' "$clean" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$clean" ]] && continue

  timestamp="$(printf '%s' "$clean" | awk '{print $1}')"
  cue_name="$(printf '%s' "$clean" | awk '{print $2}')"
  duration="$(printf '%s' "$clean" | awk '{print $3}')"
  if [[ -z "$duration" ]]; then
    duration="0.60"
  fi
  if [[ -z "$timestamp" || -z "$cue_name" ]]; then
    continue
  fi

  out_file="$OUTPUT_DIR/${cue_name}.wav"
  ffmpeg -hide_banner -loglevel error \
    -ss "$timestamp" \
    -i "$VIDEO_PATH" \
    -t "$duration" \
    -ac 1 \
    -ar 32000 \
    -y "$out_file"
  echo "[ok] $out_file @ $timestamp (${duration}s)"
  count=$((count + 1))
done < "$CUES_FILE"

echo "[ok] Extracted $count audio cue clips into $OUTPUT_DIR"
