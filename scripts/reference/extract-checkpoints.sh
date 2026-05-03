#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <reference-video> [checkpoints.txt] [output-dir] [crop-filter]"
  echo "Example: $0 ~/Videos/smas-11.mp4 scripts/reference/checkpoints.txt tests/fixtures"
  echo "Optional crop filter example: crop=1440:1080:240:0"
  exit 1
fi

VIDEO_PATH="$1"
CHECKPOINTS_FILE="${2:-scripts/reference/checkpoints.txt}"
OUTPUT_DIR="${3:-tests/fixtures}"
CROP_FILTER="${4:-}"
AUTO_CROP_FILTER=""

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi

if [[ ! -f "$CHECKPOINTS_FILE" ]]; then
  echo "[error] Checkpoints file not found: $CHECKPOINTS_FILE" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

index=1
while IFS= read -r line || [[ -n "$line" ]]; do
  clean="${line%%#*}"
  clean="$(printf '%s' "$clean" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$clean" ]] && continue

  timestamp_raw="${clean%% *}"
  # Normalize to HH:MM:SS.mmm to avoid malformed time tokens from source files.
  IFS=':' read -r t1 t2 t3 <<< "$timestamp_raw"
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
  timestamp="$(printf '%02d:%02d:%02d.%s' "$((10#$t1))" "$((10#$t2))" "$((10#${sec_int:-0}))" "$sec_frac")"
  out_file="$(printf '%s/checkpoint-%02d-expected.png' "$OUTPUT_DIR" "$index")"

  if [[ "$CROP_FILTER" != "none" && -z "$CROP_FILTER" && -z "$AUTO_CROP_FILTER" ]]; then
    probe_png="$(mktemp /tmp/allstars-ref-probe.XXXXXX.png)"
    ffmpeg -hide_banner -loglevel error -ss "$timestamp" -i "$VIDEO_PATH" -frames:v 1 -y "$probe_png"
    AUTO_CROP_FILTER="$(node - "$probe_png" <<'NODE'
const fs = require('fs');
const { PNG } = require('pngjs');
const probePath = process.argv[2];
if (!probePath || !fs.existsSync(probePath)) {
  process.stdout.write('');
  process.exit(0);
}
const bytes = fs.readFileSync(probePath);
const png = PNG.sync.read(bytes);
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
    rm -f "$probe_png"
    if [[ -n "$AUTO_CROP_FILTER" ]]; then
      echo "[info] Auto-crop detected: $AUTO_CROP_FILTER"
    fi
  fi

  if [[ "$CROP_FILTER" == "none" ]]; then
    vf="scale=256:224:flags=neighbor,setsar=1:1"
  elif [[ -n "$CROP_FILTER" ]]; then
    vf="${CROP_FILTER},scale=256:224:flags=neighbor,setsar=1:1"
  elif [[ -n "$AUTO_CROP_FILTER" ]]; then
    vf="${AUTO_CROP_FILTER},scale=256:224:flags=neighbor,setsar=1:1"
  else
    vf="crop='min(iw,ih*256/224)':'min(ih,iw*224/256)',scale=256:224:flags=neighbor,setsar=1:1"
  fi

  ffmpeg -hide_banner -loglevel error -ss "$timestamp" -i "$VIDEO_PATH" -frames:v 1 -vf "$vf" -y "$out_file"
  echo "[ok] $out_file @ $timestamp"
  index=$((index + 1))
done < "$CHECKPOINTS_FILE"

count=$((index - 1))
echo "Generated $count expected checkpoints in $OUTPUT_DIR"
