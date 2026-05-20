from __future__ import annotations

from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT_ROOT / "public/assets/custom/reference/gegant-source.png"
OUTPUT_DIRS = [
    PROJECT_ROOT / "public/assets/individual/enemies",
    PROJECT_ROOT / "dist/assets/individual/enemies",
]
OUTPUT_NAMES = [
    "piranha_up_a.png",
    "piranha_up_b.png",
    "piranha_down_a.png",
    "piranha_down_b.png",
]
OUTPUT_SIZE = (30, 58)
CONTENT_SIZE = (28, 56)


def remove_white_background(image: Image.Image, threshold: int = 245) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (0, 0, 0, 0)
    bbox = rgba.getbbox()
    if bbox is None:
        return rgba
    return rgba.crop(bbox)


def fit_on_canvas(image: Image.Image, size: tuple[int, int], content_size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    fit_w, fit_h = content_size
    scale = fit_h / image.height
    if image.width * scale > fit_w:
        scale = fit_w / image.width
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        resample=Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (target_w - resized.width) // 2
    y = target_h - resized.height
    canvas.alpha_composite(resized, (x, y))
    return canvas


def build_sprite() -> Image.Image:
    giant = remove_white_background(Image.open(SOURCE))
    bbox = giant.getbbox()
    if bbox is not None:
        giant = giant.crop(bbox)
    return fit_on_canvas(giant, OUTPUT_SIZE, CONTENT_SIZE)


def main() -> int:
    if not SOURCE.exists():
        print(f"Missing source image: {SOURCE}")
        return 1

    sprite = build_sprite()
    for output_dir in OUTPUT_DIRS:
        output_dir.mkdir(parents=True, exist_ok=True)
        for name in OUTPUT_NAMES:
            sprite.save(output_dir / name)

    print("Generated giant piranha sprites.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
