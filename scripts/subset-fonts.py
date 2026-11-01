#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.63.0"]
# ///
"""Subset the site's web font into a preloaded core file and a CJK file.

Run manually from the repository root, after a build so the script can read
the rendered pages:

    pnpm build
    uv run scripts/subset-fonts.py

Commit the regenerated apps/web/src/assets/fonts/*.woff2 and
apps/web/src/styles/fonts.css. Re-run when content starts using a character
the subsets do not hold; until then that character falls back to Kaiti.
"""

import hashlib
import html
import io
import urllib.request
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.ttLib.standardGlyphOrder import standardGlyphOrder

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web"
DIST = WEB / "dist"
FONTS_OUT = WEB / "src" / "assets" / "fonts"
CSS_OUT = WEB / "src" / "styles" / "fonts.css"

# The 22 MB source stays out of git; the subsets are what the site ships.
SOURCE_VERSION = "v3.126"
SOURCE_URL = f"https://github.com/lxgw/kose-font/releases/download/{SOURCE_VERSION}/Xiaolai-Regular.ttf"
SOURCE_SHA256 = "e2f68daf0e72777a8cf58bc83de1b98634b251e537ddbfca24b0ae50d1802da2"
SOURCE = ROOT / ".cache" / "fonts" / "Xiaolai-Regular.ttf"

FAMILY = "Xiaolai"
FEATURES = ["calt"]
CJK_START = 0x2E80
CJK_RANGE = f"U+{CJK_START:X}-FFFF"
# The footer's language links render these on every page; without them each
# English page would download the whole CJK file.
LANGUAGE_LABELS = {ord(c) for c in "中文日本語"}


def source_font() -> Path:
    if not SOURCE.exists():
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(SOURCE_URL, SOURCE)
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        SOURCE.unlink()
        raise SystemExit(f"{SOURCE_URL}: unexpected sha256 {digest}")
    return SOURCE


def used_codepoints() -> set[int]:
    pages = sorted(DIST.rglob("*.html"))
    if not pages:
        raise SystemExit(f"No pages in {DIST.relative_to(ROOT)}; run `pnpm build` first.")
    text = "".join(html.unescape(page.read_text(encoding="utf-8")) for page in pages)
    return {ord(c) for c in set(text) if c.isprintable()}


def subset(codepoints: set[int], part: str) -> TTFont:
    options = Options()
    options.flavor = "woff2"
    options.layout_features = FEATURES
    # Keep the copyright and OFL notice alongside the naming records.
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    options.glyph_names = True
    options.hinting = False

    # Keep the source's head/hhea/maxp values: fontTools would otherwise stamp
    # the save time into head.modified, which makes re-runs non-reproducible.
    font = TTFont(SOURCE, recalcBBoxes=False, recalcTimestamp=False)
    # macOS looks up the glyph named "X" when rasterising at 1x; without it,
    # or without post-table glyph names, antialiasing changes. Every file keeps
    # an unmapped "X" and its names.
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=codepoints, glyphs=[font.getBestCmap()[ord("X")]])
    subsetter.subset(font)
    # Requested glyphs keep their cmap entries; "X" must stay unmapped in cjk.
    for table in font["cmap"].tables:
        table.cmap = {cp: name for cp, name in table.cmap.items() if cp in codepoints}
    path = output(part)
    shorten_glyph_names(font).save(path)
    return TTFont(path)


def output(part: str) -> Path:
    return FONTS_OUT / f"xiaolai-{part}.woff2"


def shorten_glyph_names(font: TTFont) -> TTFont:
    # Standard Mac glyph names are stored as indexes and cost nothing; renaming
    # the rest keeps post-table names cheap. Reloading leaves the other tables
    # compiled, so they keep their glyph IDs.
    buffer = io.BytesIO()
    font.save(buffer)
    font = TTFont(buffer, recalcBBoxes=False, recalcTimestamp=False)
    standard = set(standardGlyphOrder)
    font.setGlyphOrder([name if name in standard else f"g{i}" for i, name in enumerate(font.getGlyphOrder())])
    font["post"].extraNames = []
    font["post"].mapping = {}
    font.flavor = "woff2"
    return font


def unicode_range(codepoints: set[int]) -> str:
    ranges: list[str] = []
    ordered = sorted(codepoints)
    start = prev = ordered[0]
    for cp in ordered[1:] + [None]:
        if cp is not None and cp == prev + 1:
            prev = cp
            continue
        ranges.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
        if cp is not None:
            start = prev = cp
    return ", ".join(ranges)


def font_face(path: Path, codepoints: str) -> str:
    # Vite inlines small assets as data URIs, which would put a font file
    # inside the stylesheet every page downloads.
    return f"""@font-face {{
  font-family: '{FAMILY}';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(../assets/fonts/{path.name}?no-inline) format('woff2');
  unicode-range: {codepoints};
}}
"""


def main() -> None:
    used = used_codepoints()
    source = TTFont(source_font())
    available = set(source.getBestCmap())
    keep = used & available

    core = {cp for cp in keep if cp < CJK_START} | LANGUAGE_LABELS
    cjk = keep - core

    FONTS_OUT.mkdir(parents=True, exist_ok=True)
    for stale in FONTS_OUT.glob("*.woff2"):
        stale.unlink()

    rows: list[str] = []
    for part, codepoints in {"core": core, "cjk": cjk}.items():
        font = subset(codepoints, part)
        written = set(font.getBestCmap())
        if written != codepoints:
            raise SystemExit(f"{output(part).name}: cmap differs from requested characters")
        rows.append(f"{part}: {output(part).stat().st_size:>7} B {len(codepoints):>5} characters")

    missing = "".join(chr(cp) for cp in sorted(used - available))
    rows.append(f"not in {FAMILY}: {missing!r}")

    # When ranges overlap the last rule wins, so core must follow cjk for the
    # language labels to come from the preloaded file.
    header = f"""/* Generated by scripts/subset-fonts.py from Xiaolai {SOURCE_VERSION}. Do not edit.
   The core file holds Latin text and is preloaded; the CJK file only
   downloads when a page renders one of its characters. */
"""
    blocks = [
        font_face(output("cjk"), CJK_RANGE),
        font_face(output("core"), f"U+0-{CJK_START - 1:X}, {unicode_range(LANGUAGE_LABELS)}"),
    ]
    CSS_OUT.write_text(header + "\n" + "\n".join(blocks), encoding="utf-8")
    print("\n".join(rows))


if __name__ == "__main__":
    main()
