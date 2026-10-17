#!/usr/bin/env python3
"""Generate the BetterTikTok extension icons (16/32/48/128 px).

The design: a near-black rounded square with a bold "B" carrying TikTok's
signature red/cyan glitch offsets. Rendered at 4x and downsampled so it stays
crisp at every size. Run from the repo root:  python3 scripts/generate_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZES = [16, 32, 48, 128]
SCALE = 4  # supersampling factor

BG = (15, 15, 17)          # near-black
RED = (254, 44, 85)        # TikTok red
CYAN = (37, 244, 238)      # TikTok cyan
WHITE = (255, 255, 255)

FONT_CANDIDATES = [
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/noto/NotoSans-Bold.ttf",
]


def find_font() -> str:
    for path in FONT_CANDIDATES:
        if Path(path).is_file():
            return path
    raise SystemExit("No suitable bold font found")


def make_icon(size: int, font_path: str) -> Image.Image:
    s = size * SCALE
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # rounded-square background
    radius = int(s * 0.23)
    draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=BG)

    # the letter
    font = ImageFont.truetype(font_path, int(s * 0.68))
    cx, cy = s / 2, s / 2
    offset = max(2, int(s * 0.035))

    for color, dx, dy in (
        (RED, -offset, 0),
        (CYAN, offset, 0),
        (WHITE, 0, -int(offset * 0.25)),
    ):
        draw.text(
            (cx + dx, cy + dy),
            "B",
            font=font,
            fill=color,
            anchor="mm",
        )

    # rounded-corner alpha mask
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=255)
    img.putalpha(mask)

    if SCALE > 1:
        img = img.resize((size, size), Image.LANCZOS)
    return img


def main() -> None:
    font_path = find_font()
    out_dir = Path(__file__).resolve().parent.parent / "src" / "icons"
    out_dir.mkdir(parents=True, exist_ok=True)

    for size in SIZES:
        icon = make_icon(size, font_path)
        target = out_dir / f"icon{size}.png"
        icon.save(target, "PNG")
        print(f"wrote {target}")


if __name__ == "__main__":
    main()
