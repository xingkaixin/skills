#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.63.0"]
# ///
"""Subset the site's web font into a preloaded core file and compact CJK slices.

Run manually from the repository root, after a build so the script can read
the rendered pages:

    pnpm build
    uv run scripts/subset-fonts.py

Commit the regenerated apps/web/src/assets/fonts/*.woff2 and
apps/web/src/styles/fonts.css. Re-run when content starts using a character
the subsets do not hold; until then that character falls back to Kaiti.
"""

from collections import defaultdict
import hashlib
import html
import io
import re
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
# The footer's language links render these on every page; without them each
# English page would download CJK slices.
LANGUAGE_LABELS = {ord(c) for c in "中文日本語"}

SCRIPT_STYLE_RE = re.compile(r"<(?:script|style)\b[\s\S]*?</(?:script|style)>", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
RENDERED_ATTR_RE = re.compile(
    r'(?:placeholder|data-copy-\w+|data-count-\w+|data-local-only|data-empty)="([^"]*)"',
    re.IGNORECASE,
)
HEADER_RE = re.compile(r"<header\b[\s\S]*?</header>", re.IGNORECASE)
HERO_RE = re.compile(r'<section\b[^>]*aria-labelledby="hero-heading"[\s\S]*?</section>', re.IGNORECASE)

GLYPH_BYTES = 185
SLICE_OVERHEAD_BYTES = 2000


def source_font() -> Path:
    if not SOURCE.exists():
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(SOURCE_URL, SOURCE)
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        SOURCE.unlink()
        raise SystemExit(f"{SOURCE_URL}: unexpected sha256 {digest}")
    return SOURCE


def extract_visible_codepoints(fragment: str) -> set[int]:
    stripped = SCRIPT_STYLE_RE.sub("", fragment)
    attrs = " ".join(RENDERED_ATTR_RE.findall(stripped))
    text = html.unescape(TAG_RE.sub("", stripped) + " " + attrs)
    return {ord(c) for c in set(text) if c.isprintable()}


def collect_pages() -> tuple[dict[str, set[int]], dict[str, set[int]]]:
    pages = sorted(DIST.rglob("*.html"))
    if not pages:
        raise SystemExit(f"No pages in {DIST.relative_to(ROOT)}; run `pnpm build` first.")
    visible: dict[str, set[int]] = {}
    above_fold: dict[str, set[int]] = {}
    for page in pages:
        rel = str(page.relative_to(DIST))
        raw = page.read_text(encoding="utf-8")
        visible[rel] = extract_visible_codepoints(raw)
        if rel in ("zh.html", "ja.html"):
            header = HEADER_RE.search(raw)
            hero = HERO_RE.search(raw)
            fold_html = (header.group(0) if header else "") + (hero.group(0) if hero else "")
            above_fold[rel] = extract_visible_codepoints(fold_html)
    return visible, above_fold


def cluster_domain(
    codepoints: set[int],
    page_sets: list[set[int]],
    target_k: int,
    max_glyphs: int = 0,
) -> list[set[int]]:
    if not codepoints:
        return []
    if target_k <= 1:
        return [set(codepoints)]

    by_mask: dict[int, list[int]] = defaultdict(list)
    for cp in sorted(codepoints):
        mask = 0
        for idx, pset in enumerate(page_sets):
            if cp in pset:
                mask |= 1 << idx
        by_mask[mask].append(cp)

    groups = [[set(cps), mask, mask.bit_count()] for mask, cps in by_mask.items()]
    alive = list(range(len(groups)))

    def merge_cost(i: int, j: int) -> float:
        ci, mi, pi = len(groups[i][0]), groups[i][1], groups[i][2]
        cj, mj, pj = len(groups[j][0]), groups[j][1], groups[j][2]
        penalty = (ci + cj - max_glyphs) * 4000.0 if max_glyphs and ci + cj > max_glyphs else 0.0
        pu = (mi | mj).bit_count()
        return (
            pu * ((ci + cj) * GLYPH_BYTES + SLICE_OVERHEAD_BYTES)
            - pi * (ci * GLYPH_BYTES + SLICE_OVERHEAD_BYTES)
            - pj * (cj * GLYPH_BYTES + SLICE_OVERHEAD_BYTES)
            + penalty
        )

    def best_for(idx: int) -> tuple[float, int]:
        best_delta = float("inf")
        best_j = -1
        for j in alive:
            if j == idx:
                continue
            delta = merge_cost(idx, j)
            if delta < best_delta:
                best_delta = delta
                best_j = j
        return best_delta, best_j

    if len(alive) > target_k:
        nearest = {idx: best_for(idx) for idx in alive}
        while len(alive) > target_k:
            best_i = min(alive, key=lambda i: nearest[i][0])
            _, best_j = nearest[best_i]
            groups[best_i][0] |= groups[best_j][0]
            groups[best_i][1] |= groups[best_j][1]
            groups[best_i][2] = groups[best_i][1].bit_count()
            alive.remove(best_j)
            del nearest[best_j]
            nearest[best_i] = best_for(best_i)
            for k in alive:
                if k == best_i:
                    continue
                if nearest[k][1] in (best_i, best_j):
                    nearest[k] = best_for(k)
                else:
                    delta = merge_cost(k, best_i)
                    if delta < nearest[k][0]:
                        nearest[k] = (delta, best_i)

    return [
        groups[i][0]
        for i in sorted(alive, key=lambda i: (-groups[i][2], min(groups[i][0])))
    ]


def partition_cjk(
    cjk: set[int],
    pages: dict[str, set[int]],
    above_fold: dict[str, set[int]],
) -> list[tuple[str, set[int]]]:
    """Partition CJK characters into a compact set of locale and skill-body slices.

    Keeping slice count low avoids HTTP/1.1 queueing, WOFF2 per-file header
    overhead, and multi-slice relayouts while isolating zh, ja, and skill-body
    glyphs so each page only fetches what it renders.
    """
    page_sets = [pages[key] for key in sorted(pages)]
    zh_pages = [pages[k] for k in pages if k == "zh.html" or k.startswith("zh/")]
    ja_pages = [pages[k] for k in pages if k == "ja.html" or k.startswith("ja/")]

    zh_home = pages.get("zh.html", set()) & cjk
    ja_home = pages.get("ja.html", set()) & cjk
    both_home = zh_home & ja_home
    zh_only_home = zh_home - ja_home
    ja_only_home = ja_home - zh_home
    body_only = cjk - zh_home - ja_home

    zh_common = {cp for cp in cjk if sum(1 for p in zh_pages if cp in p) >= 8}
    ja_common = {cp for cp in cjk if sum(1 for p in ja_pages if cp in p) >= 8}
    zh_fold = above_fold.get("zh.html", set()) & cjk
    ja_fold = above_fold.get("ja.html", set()) & cjk

    # Compact, strictly disjoint slices:
    # - cjk-shared: all chars shared by zh.html & ja.html (1 file)
    # - cjk-zh-ui:  common zh chrome + zh hero (preloaded on zh pages)
    # - cjk-ja-ui:  common ja chrome + ja hero (preloaded on ja pages)
    # - cjk-zh-cat / cjk-zh-home: remaining zh catalog chars (split into 2 by page coverage)
    # - cjk-ja-rest: remaining ja catalog chars (1 file)
    # - cjk-body-00..04: skill-body-only chars (never loaded on home/category/EN-skill pages)
    zh_ui = zh_only_home & (zh_common | zh_fold)
    ja_ui = ja_only_home & (ja_common | ja_fold)
    zh_rest = zh_only_home - zh_ui
    ja_rest = ja_only_home - ja_ui

    slices: list[tuple[str, set[int]]] = []
    for name, group in [
        ("cjk-shared", both_home),
        ("cjk-zh-ui", zh_ui),
        ("cjk-ja-ui", ja_ui),
    ]:
        if group:
            slices.append((name, group))

    for idx, group in enumerate(cluster_domain(zh_rest, page_sets, 2)):
        slices.append((f"cjk-zh-{idx:02d}", group))
    for idx, group in enumerate(cluster_domain(ja_rest, page_sets, 2)):
        slices.append((f"cjk-ja-{idx:02d}", group))
    for idx, group in enumerate(cluster_domain(body_only, page_sets, 8, max_glyphs=100)):
        slices.append((f"cjk-body-{idx:02d}", group))
    return slices


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
    pages, above_fold = collect_pages()
    used = set().union(*pages.values())
    source = TTFont(source_font())
    available = set(source.getBestCmap())
    keep = used & available

    core = {cp for cp in keep if cp < CJK_START} | LANGUAGE_LABELS
    cjk = keep - core
    cjk_slices = partition_cjk(cjk, pages, above_fold)

    FONTS_OUT.mkdir(parents=True, exist_ok=True)
    for stale in FONTS_OUT.glob("*.woff2"):
        stale.unlink()

    rows: list[str] = []
    total_bytes = 0
    all_parts: list[tuple[str, set[int]]] = [("core", core), *cjk_slices]
    for part, codepoints in all_parts:
        font = subset(codepoints, part)
        written = set(font.getBestCmap())
        if written != codepoints:
            raise SystemExit(f"{output(part).name}: cmap differs from requested characters")
        size = output(part).stat().st_size
        total_bytes += size
        rows.append(f"{part:14s}: {size:>7} B {len(codepoints):>5} characters")

    covered = set().union(*(cps for _, cps in all_parts))
    if covered != keep | LANGUAGE_LABELS:
        raise SystemExit("Font slices do not cover all requested codepoints")

    missing = "".join(chr(cp) for cp in sorted(used - available))
    rows.append(f"total ({len(all_parts)} files): {total_bytes} B")
    rows.append(f"not in {FAMILY}: {missing!r}")

    # When ranges overlap the last rule wins, so core must follow cjk slices
    # for the language labels to come from the preloaded file.
    header = f"""/* Generated by scripts/subset-fonts.py from Xiaolai {SOURCE_VERSION}. Do not edit.
   The core file holds Latin text and is preloaded; compact locale and
   skill-body CJK slices let each page download only the glyphs it renders. */
"""
    blocks = [
        *(font_face(output(part), unicode_range(codepoints)) for part, codepoints in cjk_slices),
        font_face(output("core"), f"U+0-{CJK_START - 1:X}, {unicode_range(LANGUAGE_LABELS)}"),
    ]
    CSS_OUT.write_text(header + "\n" + "\n".join(blocks), encoding="utf-8")
    print("\n".join(rows))


if __name__ == "__main__":
    main()
