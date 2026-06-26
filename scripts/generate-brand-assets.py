#!/usr/bin/env python3
"""
Generate Vialé brand metadata assets (favicon, app icons, social share images).

Deterministic + offline-friendly: renders the real brand type system
(Cormorant Garamond for display, Inter for supporting text) into static
PNG/ICO files that Next.js picks up via its metadata file conventions.

Run:  python3 scripts/generate-brand-assets.py
Fonts are expected in assets/fonts/ (see README in that folder).
"""
import math
import os
import re
import urllib.parse
import urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "assets", "fonts")
APP = os.path.join(ROOT, "app")

# Brand fonts pulled straight from Google Fonts so generation is reproducible
# without committing font binaries. The Inter files are subset with an explicit
# `text=` set because the default latin subset omits the ₹ (U+20B9) glyph.
SANS_TEXT = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
             "0123456789 ₹—&+,.-'")
FONT_SOURCES = {
    "CormorantGaramond-SemiBold.ttf": ("Cormorant Garamond", "600", None),
    "Inter-Regular.ttf": ("Inter", "400", SANS_TEXT),
    "Inter-Medium.ttf": ("Inter", "500", SANS_TEXT),
}
LEGACY_UA = "Mozilla/4.0"  # makes Google Fonts serve TrueType instead of woff2


def ensure_fonts():
    os.makedirs(FONTS, exist_ok=True)
    for fname, (family, weight, text) in FONT_SOURCES.items():
        path = os.path.join(FONTS, fname)
        if os.path.exists(path):
            continue
        q = f"family={urllib.parse.quote(family)}:{weight}"
        if text:
            q += f"&text={urllib.parse.quote(text)}"
        css_url = f"https://fonts.googleapis.com/css?{q}"
        req = urllib.request.Request(css_url, headers={"User-Agent": LEGACY_UA})
        css = urllib.request.urlopen(req, timeout=30).read().decode()
        m = re.search(r"url\((https://[^)]+)\)", css)
        if not m:
            raise RuntimeError(f"Could not resolve font URL for {fname}")
        data = urllib.request.urlopen(m.group(1), timeout=30).read()
        with open(path, "wb") as fh:
            fh.write(data)
        print("downloaded", fname)

# --- Brand palette (matches the minimalist, warm luxury identity) ----------
ESPRESSO = (28, 25, 23, 255)     # near-black warm background
IVORY = (245, 239, 230, 255)     # warm off-white mark
CREAM = (250, 247, 241, 255)     # light editorial background
INK = (28, 25, 23, 255)          # wordmark on light
MUTED = (122, 112, 102, 255)     # supporting label
SUBTLE = (58, 52, 47, 255)       # value line

SS = 4  # supersampling factor for crisp anti-aliased edges


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def sparkle(draw, cx, cy, r, fill):
    """Four-point luxury sparkle/twinkle mark."""
    inner = r * 0.16
    pts = []
    for i in range(8):
        ang = math.pi / 2 * i / 2  # 45deg steps
        rad = r if i % 2 == 0 else inner
        pts.append((cx + rad * math.cos(ang), cy - rad * math.sin(ang)))
    draw.polygon(pts, fill=fill)


def draw_monogram(size, *, rounded=True, with_sparkle=True):
    """Square 'V' monogram icon."""
    W = size * SS
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded:
        radius = int(W * 0.22)
        d.rounded_rectangle([0, 0, W - 1, W - 1], radius=radius, fill=ESPRESSO)
    else:
        d.rectangle([0, 0, W - 1, W - 1], fill=ESPRESSO)

    # The 'V' — Cormorant SemiBold reads cleanly at small sizes.
    f = font("CormorantGaramond-SemiBold.ttf", int(W * 0.74))
    l, t, r, b = d.textbbox((0, 0), "V", font=f)
    gw, gh = r - l, b - t
    x = (W - gw) / 2 - l
    y = (W - gh) / 2 - t + W * 0.02  # optical nudge down
    d.text((x, y), "V", font=f, fill=IVORY)

    if with_sparkle:
        sparkle(d, W * 0.70, W * 0.30, W * 0.085, IVORY)

    return img.resize((size, size), Image.LANCZOS)


def build_icons():
    # favicon.ico — multi-size. Render a crisp 256 master and let Pillow
    # emit every standard size from it (passing both append_images and sizes
    # makes the ICO plugin keep only one frame).
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    master = draw_monogram(256, rounded=True, with_sparkle=True)
    master.save(os.path.join(APP, "favicon.ico"), format="ICO", sizes=ico_sizes)
    print("wrote app/favicon.ico", [s[0] for s in ico_sizes])

    # icon.png — modern browsers / Android (transparent rounded corners)
    draw_monogram(512, rounded=True, with_sparkle=True).save(os.path.join(APP, "icon.png"))
    print("wrote app/icon.png 512")

    # apple-icon.png — iOS masks corners itself, so keep it full-bleed/opaque
    draw_monogram(180, rounded=False, with_sparkle=True).save(os.path.join(APP, "apple-icon.png"))
    print("wrote app/apple-icon.png 180")


def letterspaced(d, text, font_obj, tracking, fill, cy, W):
    """Draw centered, manually letter-spaced text. Returns total width."""
    widths = []
    for ch in text:
        bb = d.textbbox((0, 0), ch, font=font_obj)
        widths.append(bb[2] - bb[0] if ch != " " else font_obj.size * 0.32)
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2
    asc, desc = font_obj.getmetrics()
    for ch, w in zip(text, widths):
        bb = d.textbbox((0, 0), ch, font=font_obj)
        d.text((x - bb[0], cy - asc / 2), ch, font=font_obj, fill=fill)
        x += w + tracking
    return total


def centered(d, text, font_obj, fill, cy, W):
    l, t, r, b = d.textbbox((0, 0), text, font=font_obj)
    d.text(((W - (r - l)) / 2 - l, cy - (b + t) / 2), text, font=font_obj, fill=fill)
    return r - l


def build_social():
    """1200x630 share card for Open Graph + Twitter."""
    W, H = 1200 * SS, 630 * SS
    img = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(img)

    # thin inset keyline frame
    m = int(40 * SS)
    d.rectangle([m, m, W - m, H - m], outline=INK, width=max(1, int(1.6 * SS)))

    cx = W / 2
    sparkle(d, cx, H * 0.205, W * 0.020, INK)

    # Wordmark "Vialé"
    centered(d, "Vialé", font("CormorantGaramond-SemiBold.ttf", int(196 * SS)), INK, H * 0.40, W)

    # "LUXURY DECANTS"
    letterspaced(d, "LUXURY DECANTS", font("Inter-Medium.ttf", int(30 * SS)),
                 int(14 * SS), MUTED, H * 0.55, W)

    # divider
    dw = int(70 * SS)
    d.line([(cx - dw, H * 0.625), (cx + dw, H * 0.625)], fill=INK, width=max(1, int(1.4 * SS)))

    # value proposition
    centered(d, "200+ niche & designer fragrances",
             font("Inter-Regular.ttf", int(40 * SS)), SUBTLE, H * 0.71, W)
    centered(d, "Premium decants from ₹1,160 — no full-bottle commitment",
             font("Inter-Regular.ttf", int(30 * SS)), MUTED, H * 0.80, W)

    out = img.convert("RGB").resize((1200, 630), Image.LANCZOS)
    out.save(os.path.join(APP, "opengraph-image.png"))
    out.save(os.path.join(APP, "twitter-image.png"))
    print("wrote app/opengraph-image.png + app/twitter-image.png 1200x630")


if __name__ == "__main__":
    ensure_fonts()
    build_icons()
    build_social()
