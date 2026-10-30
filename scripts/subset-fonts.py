#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.63.0"]
# ///
"""Subset the site's web fonts into a preloaded core file and an extension file.

Run manually from the repository root, after a build so the script can read
the rendered pages:

    pnpm build
    uv run scripts/subset-fonts.py

Commit the regenerated apps/web/src/assets/fonts/*.woff2 and
apps/web/src/styles/fonts.css. Re-run when:

- content starts using a character outside Latin-1, Latin Extended-A and the
  core punctuation that the source fonts cover (for example ™, €, •, ′);
- the @fontsource packages are upgraded;
- a page starts using a weight, italic face or OpenType feature that FACES
  does not list (for example `tabular-nums` outside ordered-list markers).
"""

import html
import io
import json
from dataclasses import dataclass
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.ttLib.standardGlyphOrder import standardGlyphOrder

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web"
DIST = WEB / "dist"
FONTSOURCE = WEB / "node_modules" / "@fontsource"
FONTS_OUT = WEB / "src" / "assets" / "fonts"
CSS_OUT = WEB / "src" / "styles" / "fonts.css"

LATIN_1 = set(range(0x20, 0x100))
LATIN_EXT_A = set(range(0x100, 0x180))
# © sits in every footer and · in most meta rows, so leaving them in the
# extension file would make nearly every page download it.
CORE = set(range(0x20, 0x7F)) | {
    0x00A0, 0x00A9, 0x00B7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026,
}

# Browsers enable kern/liga/calt/ccmp/mark/mkmk by default. locl only targets
# Turkish and Catalan, which no page declares. tnum is on because Chrome's UA
# stylesheet sets `font-variant-numeric: tabular-nums` on ::marker, and ordered
# lists only render in regular-weight prose.
SORA_FEATURES = ["kern", "liga", "ccmp", "mark", "mkmk"]
MONO_FEATURES = ["calt", "ccmp", "mark"]


@dataclass(frozen=True)
class Face:
    family: str
    package: str
    weight: int
    features: list[str]

    @property
    def source(self) -> Path:
        return FONTSOURCE / self.package / "files" / f"{self.package}-latin-{self.weight}-normal.woff2"

    def output(self, part: str) -> Path:
        return FONTS_OUT / f"{self.package}-{self.weight}-{part}.woff2"


FACES = [
    Face("Sora", "sora", 400, SORA_FEATURES + ["tnum"]),
    Face("Sora", "sora", 500, SORA_FEATURES),
    Face("Sora", "sora", 600, SORA_FEATURES),
    Face("Sora", "sora", 700, SORA_FEATURES),
    Face("JetBrains Mono", "jetbrains-mono", 400, MONO_FEATURES),
    Face("JetBrains Mono", "jetbrains-mono", 500, MONO_FEATURES),
]


def used_codepoints() -> set[int]:
    pages = sorted(DIST.rglob("*.html"))
    if not pages:
        raise SystemExit(f"No pages in {DIST.relative_to(ROOT)}; run `pnpm build` first.")
    text = "".join(html.unescape(page.read_text(encoding="utf-8")) for page in pages)
    # Uppercase eyebrows and pills render case-mapped forms of the source text.
    chars = set(text)
    return {ord(c) for ch in chars for c in ch + ch.upper() + ch.lower()}


def subset(face: Face, codepoints: set[int], part: str) -> TTFont:
    options = Options()
    options.flavor = "woff2"
    options.layout_features = face.features
    # Keep the copyright and OFL notice alongside the naming records.
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    options.glyph_names = True
    options.drop_tables += ["STAT"]
    # The sources carry no glyph instructions. The remaining prep/gasp tables
    # (15 bytes) set Windows dropout control and smoothing, so keep them.
    options.hinting = True

    # Keep the source's head/hhea/maxp values: fontTools would otherwise stamp
    # the save time into head.modified, which makes re-runs non-reproducible,
    # and recompute bounds and head.flags from the subset's glyphs.
    font = TTFont(face.source, recalcBBoxes=False, recalcTimestamp=False)
    # macOS looks up the glyph named "X" when rasterising at 1x; without it,
    # or without post-table glyph names, antialiasing changes. Every file keeps
    # an unmapped "X" and its names.
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=codepoints, glyphs=[font.getBestCmap()[ord("X")]])
    subsetter.subset(font)
    # Requested glyphs keep their cmap entries; "X" must stay unmapped in ext.
    for table in font["cmap"].tables:
        table.cmap = {cp: name for cp, name in table.cmap.items() if cp in codepoints}
    path = face.output(part)
    shorten_glyph_names(font).save(path)
    return TTFont(path)


def shorten_glyph_names(font: TTFont) -> TTFont:
    # Standard Mac glyph names are stored as indexes and cost nothing; renaming
    # the rest (long ligature names in JetBrains Mono) keeps post-table names cheap.
    # Reloading leaves the other tables compiled, so they keep their glyph IDs.
    buffer = io.BytesIO()
    font.save(buffer)
    font = TTFont(buffer, recalcBBoxes=False, recalcTimestamp=False)
    standard = set(standardGlyphOrder)
    font.setGlyphOrder([name if name in standard else f"g{i}" for i, name in enumerate(font.getGlyphOrder())])
    font["post"].extraNames = []
    font["post"].mapping = {}
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


def font_face(face: Face, path: Path, codepoints: set[int]) -> str:
    # Vite inlines assets under 4 KiB as data URIs, which would put an ext file
    # inside the stylesheet every page downloads.
    return f"""@font-face {{
  font-family: '{face.family}';
  font-style: normal;
  font-display: swap;
  font-weight: {face.weight};
  src: url(../assets/fonts/{path.name}?no-inline) format('woff2');
  unicode-range: {unicode_range(codepoints)};
}}
"""


def package_version(package: str) -> str:
    manifest = json.loads((FONTSOURCE / package / "package.json").read_text(encoding="utf-8"))
    return f"@fontsource/{package}@{manifest['version']}"


def main() -> None:
    used = used_codepoints()
    FONTS_OUT.mkdir(parents=True, exist_ok=True)
    for stale in FONTS_OUT.glob("*.woff2"):
        stale.unlink()

    blocks: list[str] = []
    rows: list[str] = []
    for face in FACES:
        source = TTFont(face.source)
        available = set(source.getBestCmap())
        keep = (LATIN_1 | LATIN_EXT_A | used | CORE) & available
        core = keep & CORE
        parts = {"core": core, "ext": keep - core}
        sizes = []
        for part, codepoints in parts.items():
            font = subset(face, codepoints, part)
            written = set(font.getBestCmap())
            if written != codepoints:
                raise SystemExit(f"{face.output(part).name}: cmap differs from requested characters")
            blocks.append(font_face(face, face.output(part), written))
            sizes.append(f"{part} {face.output(part).stat().st_size:>6} B {len(font.getGlyphOrder()):>3} glyphs")
        dropped = "".join(chr(cp) for cp in sorted(available - keep))
        rows.append(f"{face.package}-{face.weight}: {face.source.stat().st_size:>6} B -> {' | '.join(sizes)}; dropped {dropped!r}")

    sources = " and ".join(package_version(p) for p in dict.fromkeys(f.package for f in FACES))
    header = f"""/* Generated by scripts/subset-fonts.py from {sources}. Do not edit.
   Core files hold ASCII and common punctuation and are preloaded; ext files
   only download when a page renders one of their characters. */
"""
    CSS_OUT.write_text(header + "\n" + "\n".join(blocks), encoding="utf-8")
    print("\n".join(rows))


if __name__ == "__main__":
    main()
