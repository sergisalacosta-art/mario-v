from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TITLE_SMALL = PROJECT_ROOT / "public/assets/individual/screens/title_logo_main.png"
TITLE_LARGE = PROJECT_ROOT / "public/assets/individual/screens/title_logo_main.original-large.png"
DIST_SMALL = PROJECT_ROOT / "dist/assets/individual/screens/title_logo_main.png"
DIST_LARGE = PROJECT_ROOT / "dist/assets/individual/screens/title_logo_main.original-large.png"

ARIAL_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
SUBTITLE = "ANTI-AOAPIX EDITION"


def restore_from_head(rel_path: str, destination: Path) -> None:
    destination.write_bytes(subprocess.check_output(["git", "show", f"HEAD:{rel_path}"]))


def fit_font(text: str, max_width: int, start_size: int) -> ImageFont.FreeTypeFont:
    size = start_size
    while size > 6:
        font = ImageFont.truetype(ARIAL_BLACK, size)
        left, top, right, bottom = font.getbbox(text)
        if right - left <= max_width:
            return font
        size -= 1
    return ImageFont.truetype(ARIAL_BLACK, 6)


def main() -> int:
    restore_from_head("public/assets/individual/screens/title_logo_main.png", TITLE_SMALL)

    image = Image.open(TITLE_SMALL).convert("RGBA")
    draw = ImageDraw.Draw(image)

    # Repaint subtitle strip only, preserving the old title look.
    draw.rectangle((6, 66, 202, 90), fill=(171, 49, 3, 255))
    draw.rectangle((6, 65, 202, 66), fill=(194, 81, 16, 255))

    font = fit_font(SUBTITLE, 186, 14)
    bbox = font.getbbox(SUBTITLE)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (208 - text_w) // 2 - bbox[0]
    text_y = 76 - text_h // 2 - bbox[1]

    shadow_color = (82, 32, 0, 255)
    stroke_color = (125, 54, 0, 255)
    fill_color = (255, 239, 151, 255)

    draw.text(
        (text_x + 2, text_y + 2),
        SUBTITLE,
        font=font,
        fill=shadow_color,
        stroke_width=2,
        stroke_fill=shadow_color,
    )
    draw.text(
        (text_x, text_y),
        SUBTITLE,
        font=font,
        fill=fill_color,
        stroke_width=1,
        stroke_fill=stroke_color,
    )

    # Subtle readability boost for the main title only.
    title_box = (8, 6, 202, 64)
    title_crop = image.crop(title_box)
    title_crop = title_crop.resize((title_crop.width * 2, title_crop.height * 2), resample=Image.Resampling.BICUBIC)
    title_crop = title_crop.filter(ImageFilter.GaussianBlur(radius=0.35))
    title_crop = ImageEnhance.Contrast(title_crop).enhance(1.08)
    title_crop = title_crop.filter(ImageFilter.UnsharpMask(radius=1.1, percent=135, threshold=2))
    title_crop = title_crop.resize((title_box[2] - title_box[0], title_box[3] - title_box[1]), resample=Image.Resampling.LANCZOS)
    image.alpha_composite(title_crop, (title_box[0], title_box[1]))

    large = image.resize((1536, 1024), resample=Image.Resampling.NEAREST)

    image.save(TITLE_SMALL)
    DIST_SMALL.parent.mkdir(parents=True, exist_ok=True)
    image.save(DIST_SMALL)
    TITLE_LARGE.parent.mkdir(parents=True, exist_ok=True)
    large.save(TITLE_LARGE)
    DIST_LARGE.parent.mkdir(parents=True, exist_ok=True)
    large.save(DIST_LARGE)
    print("Updated title subtitle while preserving original title style.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
