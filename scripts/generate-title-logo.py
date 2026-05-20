from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TITLE_LARGE = PROJECT_ROOT / "public/assets/individual/screens/title_logo_main.original-large.png"
TITLE_SMALL = PROJECT_ROOT / "public/assets/individual/screens/title_logo_main.png"
DIST_LARGE = PROJECT_ROOT / "dist/assets/individual/screens/title_logo_main.original-large.png"
DIST_SMALL = PROJECT_ROOT / "dist/assets/individual/screens/title_logo_main.png"

IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
ARIAL_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

LINE_1 = "SUPER"
LINE_2 = "MARIO VERRGÀS"
LINE_3 = "ANTI-AOAPIX EDITION"


def fit_font(text: str, font_path: str, max_width: int, start_size: int) -> ImageFont.FreeTypeFont:
    size = start_size
    while size > 10:
        font = ImageFont.truetype(font_path, size=size)
        bbox = font.getbbox(text)
        if bbox[2] - bbox[0] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(font_path, size=12)


def draw_gradient_text(
    canvas: Image.Image,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    gradient: tuple[str, str, str, str],
    stroke_fill: str,
    shadow_fill: str,
    stroke_width: int,
    shadow_offset: tuple[int, int],
) -> None:
    bbox = font.getbbox(text)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    mask = Image.new("L", (text_w + stroke_width * 4, text_h + stroke_width * 4), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.text(
        (stroke_width * 2 - bbox[0], stroke_width * 2 - bbox[1]),
        text,
        fill=255,
        font=font,
        stroke_width=stroke_width,
        stroke_fill=255,
    )

    shadow = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.text(
        (stroke_width * 2 - bbox[0], stroke_width * 2 - bbox[1]),
        text,
        font=font,
        fill=shadow_fill,
        stroke_width=stroke_width,
        stroke_fill=shadow_fill,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=1.2))
    canvas.alpha_composite(shadow, (xy[0] + shadow_offset[0], xy[1] + shadow_offset[1]))

    stroke_layer = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    stroke_draw = ImageDraw.Draw(stroke_layer)
    stroke_draw.text(
        (stroke_width * 2 - bbox[0], stroke_width * 2 - bbox[1]),
        text,
        font=font,
        fill=stroke_fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )

    fill_mask = Image.new("L", mask.size, 0)
    fill_draw = ImageDraw.Draw(fill_mask)
    fill_draw.text(
        (stroke_width * 2 - bbox[0], stroke_width * 2 - bbox[1]),
        text,
        font=font,
        fill=255,
    )

    gradient_img = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(gradient_img)
    stops = [gradient[0], gradient[1], gradient[2], gradient[3]]
    for y in range(mask.size[1]):
        t = y / max(1, mask.size[1] - 1)
        if t < 0.36:
            c1, c2, local_t = stops[0], stops[1], t / 0.36
        elif t < 0.74:
            c1, c2, local_t = stops[1], stops[2], (t - 0.36) / 0.38
        else:
            c1, c2, local_t = stops[2], stops[3], (t - 0.74) / 0.26
        rgb1 = tuple(int(c1[i:i + 2], 16) for i in (1, 3, 5))
        rgb2 = tuple(int(c2[i:i + 2], 16) for i in (1, 3, 5))
        rgb = tuple(round(rgb1[i] + (rgb2[i] - rgb1[i]) * local_t) for i in range(3))
        gd.line((0, y, mask.size[0], y), fill=rgb + (255,), width=1)
    gradient_img.putalpha(fill_mask)

    canvas.alpha_composite(stroke_layer, xy)
    canvas.alpha_composite(gradient_img, xy)


def main() -> int:
    image = Image.open(TITLE_LARGE).convert("RGBA")

    # Repaint the inner plaque area while preserving the border.
    fill_color = (170, 48, 0, 255)
    inner = Image.new("RGBA", image.size, (0, 0, 0, 0))
    inner_draw = ImageDraw.Draw(inner)
    inner_draw.rounded_rectangle((92, 108, 1448, 920), radius=18, fill=fill_color)
    inner_draw.rectangle((110, 126, 1430, 902), fill=fill_color)
    image.alpha_composite(inner)

    # Add a subtle warm vignette so the panel doesn't look flat.
    vignette = Image.new("RGBA", image.size, (0, 0, 0, 0))
    vg = ImageDraw.Draw(vignette)
    vg.ellipse((250, 250, 1350, 980), fill=(255, 180, 90, 34))
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=60))
    image.alpha_composite(vignette)

    font_super = fit_font(LINE_1, IMPACT, 420, 170)
    font_main = fit_font(LINE_2, IMPACT, 1230, 270)
    font_sub = fit_font(LINE_3, ARIAL_BLACK, 1230, 124)

    draw_gradient_text(
        image,
        (170, 130),
        LINE_1,
        font_super,
        ("#fff7c8", "#ffd63c", "#ffb400", "#f73a00"),
        stroke_fill="#6b1700",
        shadow_fill="#4d0f00",
        stroke_width=14,
        shadow_offset=(18, 18),
    )
    draw_gradient_text(
        image,
        (135, 270),
        LINE_2,
        font_main,
        ("#fff7c8", "#ffd63c", "#ffb400", "#f73a00"),
        stroke_fill="#6b1700",
        shadow_fill="#4d0f00",
        stroke_width=16,
        shadow_offset=(20, 20),
    )
    draw_gradient_text(
        image,
        (165, 675),
        LINE_3,
        font_sub,
        ("#fff8cf", "#ffe04d", "#ffc126", "#f08900"),
        stroke_fill="#6b1700",
        shadow_fill="#4d0f00",
        stroke_width=9,
        shadow_offset=(12, 12),
    )

    small = image.resize((208, 96), resample=Image.Resampling.LANCZOS)

    image.save(TITLE_LARGE)
    small.save(TITLE_SMALL)
    DIST_LARGE.parent.mkdir(parents=True, exist_ok=True)
    DIST_SMALL.parent.mkdir(parents=True, exist_ok=True)
    image.save(DIST_LARGE)
    small.save(DIST_SMALL)
    print("Updated title logo assets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
