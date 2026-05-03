#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSET_DIR="$ROOT_DIR/public/assets/smas"
AUDIO_DIR="$ROOT_DIR/public/audio/smas"
mkdir -p "$ASSET_DIR" "$AUDIO_DIR"

BASE_PAGE="https://www.spriters-resource.com/snes/smassmb1/asset"
BASE_MEDIA="https://www.spriters-resource.com"

SHEETS=$(cat <<'LIST'
6211 tileset_global_6211.png
154289 world_1-1_154289.png
132605 hud_font_132605.png
118565 items_blocks_118565.png
132613 title_screens_132613.png
51798 game_over_time_up_51798.png
6206 npcs_ending_6206.png
83422 mario_luigi_83422.png
6195 enemies_6195.png
135664 effects_135664.png
6208 clouds_bg_6208.png
135312 hills_bg_135312.png
135313 hills_bg_135313.png
LIST
)

extract_media_path() {
  local html="$1"
  printf '%s' "$html" | rg -o '/media/assets/[^" ]+\.png\?updated=[0-9]+' | head -n 1
}

while IFS=' ' read -r asset_id filename; do
  [[ -z "$asset_id" ]] && continue

  target_file="$ASSET_DIR/$filename"
  if [[ -f "$target_file" ]]; then
    echo "[skip] $target_file"
    continue
  fi

  echo "[page] $asset_id"
  html="$(curl -fsSL "$BASE_PAGE/$asset_id/")"
  media_path="$(extract_media_path "$html")"

  if [[ -z "$media_path" ]]; then
    echo "[error] Could not locate media path for asset id $asset_id" >&2
    exit 1
  fi

  echo "[down] $target_file"
  curl -fSL "$BASE_MEDIA$media_path" -o "$target_file"
done <<< "$SHEETS"

EXTRA_FILES=$(cat <<'LIST'
https://www.mariouniverse.com/wp-content/img/sprites/snes/smb/mario.gif mario_super_alt.gif
https://www.mariouniverse.com/wp-content/img/sprites/snes/smb/mario-2.gif mario_fire_alt.gif
https://www.mariouniverse.com/wp-content/img/sprites/snes/smb/enemies.gif enemies_mariouniverse.gif
https://www.mariouniverse.com/wp-content/img/sprites/snes/smb/items-coins.png items_coins_mariouniverse.png
LIST
)

while IFS=' ' read -r url filename; do
  [[ -z "$url" ]] && continue

  target_file="$ASSET_DIR/$filename"
  if [[ -f "$target_file" ]]; then
    echo "[skip] $target_file"
    continue
  fi

  echo "[down] $target_file"
  curl -fSL "$url" -o "$target_file"
done <<< "$EXTRA_FILES"

echo "[audio] Downloading calibrated audio pack..."
bash "$ROOT_DIR/scripts/download-audio.sh"

echo "Done. Assets in $ASSET_DIR"
