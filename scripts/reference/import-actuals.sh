#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <actual-screenshots-dir> [output-dir]"
  echo "The directory should contain PNG files sorted by checkpoint order."
  exit 1
fi

INPUT_DIR="$1"
OUTPUT_DIR="${2:-tests/fixtures}"

if [[ ! -d "$INPUT_DIR" ]]; then
  echo "[error] Input directory not found: $INPUT_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

mapfile -t files < <(find "$INPUT_DIR" -maxdepth 1 -type f \( -name '*.png' -o -name '*.PNG' \) | sort)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "[error] No PNG files found in $INPUT_DIR" >&2
  exit 1
fi

index=1
for file in "${files[@]}"; do
  out_file="$(printf '%s/checkpoint-%02d-actual.png' "$OUTPUT_DIR" "$index")"
  ffmpeg -hide_banner -loglevel error -i "$file" -frames:v 1 -vf "scale=256:224:flags=neighbor,setsar=1:1" -y "$out_file"
  echo "[ok] $out_file <= $(basename "$file")"
  index=$((index + 1))
done

count=$((index - 1))
echo "Imported $count actual checkpoints to $OUTPUT_DIR"
