#!/usr/bin/env bash
set -euo pipefail

ROM_PATH="${1:-/Users/pauavila/Downloads/Super Mario All-Stars + Super Mario World (USA).sfc}"
VIDEO_PATH="${2:-}"
CHECKPOINTS_FILE="${3:-scripts/reference/checkpoints-youtube-Y8EXjcb6XV8.txt}"
FIXTURES_DIR="${4:-tests/fixtures/youtube}"
PUBLIC_REF_DIR="${5:-public/assets/reference/youtube}"

if [[ ! -f "$ROM_PATH" ]]; then
  echo "[error] ROM not found: $ROM_PATH" >&2
  exit 1
fi

rom_sha1="$(shasum -a 1 "$ROM_PATH" | awk '{print $1}')"
echo "[info] ROM: $ROM_PATH"
echo "[info] SHA1: $rom_sha1"

if [[ -z "$VIDEO_PATH" ]]; then
  echo "[next] Exporta un video limpio de 1-1 desde Snes9x (sin filtros CRT/shaders)."
  echo "[next] Vuelve a ejecutar con:"
  echo "       bash scripts/reference/rom-world11-from-video.sh \"$ROM_PATH\" /ruta/a/world11.mp4"
  exit 0
fi

if [[ ! -f "$VIDEO_PATH" ]]; then
  echo "[error] Video not found: $VIDEO_PATH" >&2
  exit 1
fi

if [[ ! -f "$CHECKPOINTS_FILE" ]]; then
  echo "[error] Checkpoints file not found: $CHECKPOINTS_FILE" >&2
  exit 1
fi

echo "[step] Generating expected checkpoints from ROM video..."
bash scripts/reference/extract-checkpoints.sh "$VIDEO_PATH" "$CHECKPOINTS_FILE" "$FIXTURES_DIR"

echo "[step] Syncing expected frames to guide reference assets..."
mkdir -p "$PUBLIC_REF_DIR"
for expected in "$FIXTURES_DIR"/checkpoint-*-expected.png; do
  [[ -f "$expected" ]] || continue
  base="$(basename "$expected")"
  target="${base/-expected/}"
  cp "$expected" "$PUBLIC_REF_DIR/$target"
done

echo "[ok] ROM checkpoints synced."
echo "[next] Rebuild and recapture actuals:"
echo "       npm run build"
echo "       npm run ref:actual:auto"
echo "       npm run test:run"
