from __future__ import annotations

import math
import sys
from pathlib import Path
from collections import deque

from PIL import Image, ImageFilter


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIRS = [
    PROJECT_ROOT / "public/assets/individual/enemies",
    PROJECT_ROOT / "dist/assets/individual/enemies",
]
PIG_SOURCE_OVERRIDE = PROJECT_ROOT / "public/assets/custom/reference/porc-source.png"
SHEEP_SOURCE_OVERRIDE = PROJECT_ROOT / "public/assets/custom/reference/xai-source.png"


SPRITES = {
    "goomba_walk_a.png": {
        "box": (40, 147, 115, 207),
        "size": (16, 16),
        "content_size": (16, 11),
        "anchor": "bottom",
        "flip": True,
        "group": "goomba_walk",
    },
    "goomba_walk_b.png": {
        "box": (107, 146, 182, 206),
        "size": (16, 16),
        "content_size": (16, 11),
        "anchor": "bottom",
        "flip": True,
        "group": "goomba_walk",
    },
    "goomba_squash.png": {"box": (42, 307, 133, 390), "size": (16, 16), "anchor": "bottom", "flip": True},
    "goomba_flip.png": {"box": (304, 306, 390, 389), "size": (16, 16), "anchor": "center", "flip": True},
    "koopa_walk_a.png": {
        "box": (678, 147, 749, 205),
        "size": (16, 24),
        "content_size": (16, 12),
        "anchor": "bottom",
        "flip": True,
        "group": "koopa_walk",
    },
    "koopa_walk_b.png": {
        "box": (808, 147, 883, 205),
        "size": (16, 24),
        "content_size": (16, 12),
        "anchor": "bottom",
        "flip": True,
        "group": "koopa_walk",
    },
    "koopa_shell.png": {"box": (744, 308, 828, 393), "size": (16, 16), "anchor": "center", "flip": True},
    "koopa_shell_spin_a.png": {"box": (680, 414, 759, 495), "size": (16, 16), "anchor": "center", "flip": True},
    "koopa_shell_spin_b.png": {"box": (868, 414, 949, 495), "size": (16, 16), "anchor": "center", "flip": True},
    "koopa_flip.png": {"box": (926, 307, 1007, 392), "size": (16, 16), "anchor": "center", "flip": True},
}

GROUP_MEMBERS = {
    "goomba_walk": ["goomba_walk_a.png", "goomba_walk_b.png"],
    "koopa_walk": ["koopa_walk_a.png", "koopa_walk_b.png"],
}


def average_border_color(image: Image.Image) -> tuple[float, float, float]:
    pixels = image.load()
    width, height = image.size
    samples: list[tuple[int, int, int]] = []
    for x in range(width):
        samples.append(pixels[x, 0][:3])
        samples.append(pixels[x, height - 1][:3])
    for y in range(1, height - 1):
        samples.append(pixels[0, y][:3])
        samples.append(pixels[width - 1, y][:3])
    count = len(samples)
    return (
        sum(s[0] for s in samples) / count,
        sum(s[1] for s in samples) / count,
        sum(s[2] for s in samples) / count,
    )


def color_distance(a: tuple[int, int, int], b: tuple[float, float, float]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


def remove_panel_background(crop: Image.Image, threshold: float = 42.0) -> Image.Image:
    rgba = crop.convert("RGBA")
    bg = average_border_color(rgba)
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if color_distance((r, g, b), bg) <= threshold:
                pixels[x, y] = (0, 0, 0, 0)

    alpha = rgba.getchannel("A").filter(ImageFilter.MedianFilter(size=3))
    rgba.putalpha(alpha)

    bbox = rgba.getbbox()
    if bbox is None:
        return rgba
    return rgba.crop(bbox)


def strip_blue_fringe(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if b > 120 and b > r + 18 and b > g + 18:
                pixels[x, y] = (r, g, b, 0)
    bbox = rgba.getbbox()
    if bbox is None:
        return rgba
    return rgba.crop(bbox)


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited: set[tuple[int, int]] = set()
    best_component: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in visited or pixels[x, y][3] == 0:
                continue
            queue = deque([(x, y)])
            visited.add((x, y))
            component: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    if (nx, ny) in visited or pixels[nx, ny][3] == 0:
                        continue
                    visited.add((nx, ny))
                    queue.append((nx, ny))
            if len(component) > len(best_component):
                best_component = component

    if not best_component:
        return rgba

    keep = set(best_component)
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0 and (x, y) not in keep:
                pixels[x, y] = (0, 0, 0, 0)

    bbox = rgba.getbbox()
    if bbox is None:
        return rgba
    return rgba.crop(bbox)


def pad_to_group_box(image: Image.Image, box_size: tuple[int, int], anchor: str) -> Image.Image:
    target_w, target_h = box_size
    canvas = Image.new("RGBA", box_size, (0, 0, 0, 0))
    x = (target_w - image.width) // 2
    if anchor == "bottom":
        y = target_h - image.height
    else:
        y = (target_h - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    return canvas


def fit_on_canvas(
    image: Image.Image,
    size: tuple[int, int],
    anchor: str,
    flip: bool = False,
    content_size: tuple[int, int] | None = None,
) -> Image.Image:
    target_w, target_h = size
    fit_w, fit_h = content_size or size
    src_w, src_h = image.size
    scale = fit_h / src_h
    if src_w * scale > fit_w:
        scale = fit_w / src_w
    resized = image.resize(
        (max(1, round(src_w * scale)), max(1, round(src_h * scale))),
        resample=Image.Resampling.NEAREST,
    )
    if flip:
        resized = resized.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))

    x = (target_w - resized.width) // 2
    if anchor == "bottom":
        y = target_h - resized.height
    else:
        y = (target_h - resized.height) // 2

    canvas.alpha_composite(resized, (x, y))
    return canvas


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


def build_pig_override_assets() -> dict[str, Image.Image]:
    if not PIG_SOURCE_OVERRIDE.exists():
        return {}

    pig = remove_white_background(Image.open(PIG_SOURCE_OVERRIDE))
    pig = pig.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    walk_a = fit_on_canvas(pig, (16, 16), "bottom", content_size=(16, 12))
    walk_b = fit_on_canvas(pig, (16, 16), "bottom", content_size=(16, 12))

    squash_source = pig.resize((max(1, round(pig.width * 0.94)), max(1, round(pig.height * 0.68))), Image.Resampling.NEAREST)
    squash = fit_on_canvas(squash_source, (16, 16), "bottom", content_size=(16, 9))

    flip_source = pig.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    flip = fit_on_canvas(flip_source, (16, 16), "center", content_size=(16, 11))

    return {
        "goomba_walk_a.png": walk_a,
        "goomba_walk_b.png": walk_b,
        "goomba_squash.png": squash,
        "goomba_flip.png": flip,
    }


def build_sheep_walk_override_assets() -> dict[str, Image.Image]:
    if not SHEEP_SOURCE_OVERRIDE.exists():
        return {}

    sheep = remove_white_background(Image.open(SHEEP_SOURCE_OVERRIDE))
    sheep = sheep.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    walk_a = fit_on_canvas(sheep, (16, 24), "bottom", content_size=(16, 13))
    walk_b = fit_on_canvas(sheep, (16, 24), "bottom", content_size=(16, 13))

    return {
        "koopa_walk_a.png": walk_a,
        "koopa_walk_b.png": walk_b,
    }


def make_winged_variant(base_path: Path, out_path: Path) -> None:
    base = Image.open(base_path).convert("RGBA")
    canvas = Image.new("RGBA", base.size, (0, 0, 0, 0))
    wing = Image.new("RGBA", (6, 8), (0, 0, 0, 0))
    wing_pixels = wing.load()
    wing_pattern = [
        "..ww..",
        ".wwww.",
        "wwwwww",
        "wwwwww",
        ".wwww.",
        "..ww..",
        "..ww..",
        "...w..",
    ]
    for y, row in enumerate(wing_pattern):
        for x, char in enumerate(row):
            if char == "w":
                wing_pixels[x, y] = (245, 251, 255, 255)

    canvas.alpha_composite(wing, (1, 7))
    canvas.alpha_composite(base, (0, 0))
    canvas.alpha_composite(wing.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (9, 7))
    canvas.save(out_path)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/extract-enemy-reference-skins.py <reference-image>")
        return 1

    source = Path(sys.argv[1]).expanduser()
    if not source.exists():
        print(f"Reference image not found: {source}")
        return 1

    reference = Image.open(source)
    pig_override_assets = build_pig_override_assets()
    sheep_walk_override_assets = build_sheep_walk_override_assets()

    for output_dir in OUTPUT_DIRS:
        output_dir.mkdir(parents=True, exist_ok=True)
        isolated_by_name: dict[str, Image.Image] = {}
        for filename, spec in SPRITES.items():
            if filename in pig_override_assets or filename in sheep_walk_override_assets:
                continue
            crop = reference.crop(spec["box"])
            cleaned = remove_panel_background(crop)
            decontaminated = strip_blue_fringe(cleaned)
            isolated_by_name[filename] = keep_largest_alpha_component(decontaminated)

        for group_name, members in GROUP_MEMBERS.items():
            present_members = [name for name in members if name in isolated_by_name]
            if not present_members:
                continue
            max_width = max(isolated_by_name[name].width for name in present_members)
            max_height = max(isolated_by_name[name].height for name in present_members)
            for name in present_members:
                anchor = str(SPRITES[name]["anchor"])
                isolated_by_name[name] = pad_to_group_box(isolated_by_name[name], (max_width, max_height), anchor)

        for filename, spec in SPRITES.items():
            if filename in pig_override_assets:
                pig_override_assets[filename].save(output_dir / filename)
                continue
            if filename in sheep_walk_override_assets:
                sheep_walk_override_assets[filename].save(output_dir / filename)
                continue
            final = fit_on_canvas(
                isolated_by_name[filename],
                spec["size"],
                spec["anchor"],
                bool(spec.get("flip")),
                spec.get("content_size"),
            )
            final.save(output_dir / filename)

        shell_base = Image.open(output_dir / "koopa_shell.png").convert("RGBA")
        shell_base.save(output_dir / "koopa_shell_spin_a.png")
        shell_base.save(output_dir / "koopa_shell_spin_b.png")

        make_winged_variant(output_dir / "koopa_walk_a.png", output_dir / "koopa_wing_a.png")
        make_winged_variant(output_dir / "koopa_walk_b.png", output_dir / "koopa_wing_b.png")

    print(f"Extracted {len(SPRITES)} sprites into {len(OUTPUT_DIRS)} directories.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
