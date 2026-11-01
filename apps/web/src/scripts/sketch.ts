// Draws Lanmo's pencil outlines and hatch washes onto server-rendered elements.
// The geometry comes from the design system's React bundle; this site renders
// no React, so only the drawing is ported.
//
//   data-sketch            outline
//   data-sketch="wash"     hatch only
//   data-sketch="line"     horizontal rule
//   data-sketch="underline" pen stroke under inline text
//   data-wash              adds the hatch to an outline; its opacity is the
//                          CSS variable --lm-wash-op, so states stay in CSS
//   data-radius            corner radius in px, default 6

type PerimeterPoint = [x: number, y: number, normalX: number, normalY: number];
type Point = [x: number, y: number];
type Random = () => number;

interface RoughRectOptions {
  inset: number;
  radius: number;
  amp: number;
  breaks: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const GRAIN_ID = "lm-grain";

const seeds = new WeakMap<Element, number>();
let clipCount = 0;

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): Random {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function perimeter(x: number, y: number, width: number, height: number, radius: number, step: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const points: PerimeterPoint[] = [];

  function side(ax: number, ay: number, bx: number, by: number, nx: number, ny: number) {
    const count = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let i = 0; i < count; i++) {
      const t = i / count;
      points.push([ax + (bx - ax) * t, ay + (by - ay) * t, nx, ny]);
    }
  }

  function corner(cx: number, cy: number, start: number) {
    const count = r > 10 ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const angle = start + (Math.PI / 2) * (i / count);
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, Math.cos(angle), Math.sin(angle)]);
    }
  }

  side(x + r, y, x + width - r, y, 0, -1);
  corner(x + width - r, y + r, -Math.PI / 2);
  side(x + width, y + r, x + width, y + height - r, 1, 0);
  corner(x + width - r, y + height - r, 0);
  side(x + width - r, y + height, x + r, y + height, 0, 1);
  corner(x + r, y + height - r, Math.PI / 2);
  side(x, y + height - r, x, y + r, -1, 0);
  corner(x + r, y + r, Math.PI);
  return points;
}

function smoothPath(points: Point[]) {
  if (points.length < 2) return "";

  let path = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    path += `Q${round(points[i][0])} ${round(points[i][1])} ${round(midX)} ${round(midY)}`;
  }
  const last = points[points.length - 1];
  return `${path}L${round(last[0])} ${round(last[1])}`;
}

function broken(points: Point[], index: number) {
  return smoothPath(points.slice(0, index + 1)) + smoothPath(points.slice(index + 1));
}

// One pencil pass: starts at a random point, wobbles with a low-frequency
// random walk, overshoots past its start and may break once.
function roughRect(random: Random, width: number, height: number, options: RoughRectOptions) {
  const { inset, radius, amp, breaks } = options;
  const base = perimeter(inset, inset, width - inset * 2, height - inset * 2, radius, 14);
  const start = Math.floor(random() * base.length);
  const overshoot = 2 + Math.floor(random() * 2);
  let wobble = (random() - 0.5) * amp;
  const points: Point[] = [];

  for (let i = 0; i <= base.length + overshoot; i++) {
    const [x, y, nx, ny] = base[(start + i) % base.length];
    wobble = wobble * 0.55 + (random() - 0.5) * 2 * amp * 0.45;
    points.push([x + nx * wobble, y + ny * wobble]);
  }

  const last = points[points.length - 1];
  last[0] += (random() - 0.5) * amp * 2;
  last[1] += (random() - 0.5) * amp * 2;

  if (random() < breaks && points.length > 8) {
    return broken(points, 3 + Math.floor(random() * (points.length - 7)));
  }
  return smoothPath(points);
}

function roughLine(random: Random, x1: number, y1: number, x2: number, y2: number, amp: number, breaks: number) {
  const startOvershoot = (random() - 0.3) * 3;
  const endOvershoot = (random() - 0.3) * 3;
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / length;
  const uy = (y2 - y1) / length;
  const fromX = x1 - ux * startOvershoot;
  const fromY = y1 - uy * startOvershoot;
  const toX = x2 + ux * endOvershoot;
  const toY = y2 + uy * endOvershoot;
  const count = Math.max(2, Math.round((length + startOvershoot + endOvershoot) / 18));
  const bow = (random() - 0.5) * amp * 1.6;
  let wobble = 0;
  const points: Point[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    wobble = wobble * 0.5 + (random() - 0.5) * amp;
    const offset = wobble + Math.sin(Math.PI * t) * bow;
    points.push([fromX + (toX - fromX) * t - uy * offset, fromY + (toY - fromY) * t + ux * offset]);
  }

  if (random() < breaks && count > 5) {
    return broken(points, 2 + Math.floor(random() * (count - 4)));
  }
  return smoothPath(points);
}

function element(name: string, attributes: Record<string, string | number>, parent?: Element) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  parent?.append(node);
  return node;
}

function appendHatch(svg: Element, random: Random, width: number, height: number, radius: number) {
  const clipId = `lm-clip-${clipCount++}`;
  const inset = 2 + random() * 1.5;
  const clip = element("clipPath", { id: clipId }, svg);
  element(
    "rect",
    {
      x: round(inset + (random() - 0.5) * 2),
      y: round(inset + (random() - 0.5) * 1.5),
      width: round(width - inset * 2),
      height: round(height - inset * 2),
      rx: round(Math.max(0, Math.min(radius, (height - inset * 2) / 2))),
    },
    clip,
  );

  const wash = element("g", { class: "lm-wash", "clip-path": `url(#${clipId})` }, svg);
  const grained = element("g", { filter: `url(#${GRAIN_ID})` }, wash);
  element("rect", { class: "lm-wash-tint", width, height }, grained);

  const spacing = 3.2;
  for (let c = spacing * random(); c < width + height; c += spacing * (0.7 + random() * 0.6)) {
    const ax = Math.max(0, c - height);
    const ay = c - ax;
    const bx = Math.min(width, c);
    const by = c - bx;
    if (bx - ax < 1.5) continue;

    const startInk = (random() - 0.35) * 4;
    const endInk = (random() - 0.35) * 4;
    element(
      "line",
      {
        x1: round(ax - startInk * 0.707),
        y1: round(ay + startInk * 0.707),
        x2: round(bx + endInk * 0.707),
        y2: round(by - endInk * 0.707),
        "stroke-opacity": round(0.4 + random() * 0.6),
        "stroke-width": round(1 + random() * 1.2),
      },
      grained,
    );
  }
}

function appendStrokes(parent: Element, first: string, second: string) {
  element("path", { class: "lm-s lm-s1", d: first }, parent);
  element("path", { class: "lm-s lm-s2", d: second }, parent);
}

function draw(target: HTMLElement) {
  const width = target.offsetWidth;
  const height = target.offsetHeight;
  if (width < 2 || height < 2) return;

  const mode = target.dataset.sketch;
  const radius = Number(target.dataset.radius ?? 6);
  const random = seededRandom(seeds.get(target) ?? 1);
  const svg = element("svg", {
    class: "lm-ink",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    "aria-hidden": "true",
    focusable: "false",
  });

  if (mode === "wash" || target.dataset.wash !== undefined) {
    appendHatch(svg, random, width, height, radius);
  }

  if (mode === "line") {
    // A nearly flat line has almost no bounding box, so the grain filter's
    // percentage region would clip it.
    appendStrokes(
      svg,
      roughLine(random, 1, height / 2, width - 1, height / 2, 0.9, 0.25),
      roughLine(random, 2, height / 2 + 0.6, width - 2, height / 2 + 0.3, 1.2, 0.4),
    );
  } else if (mode === "underline") {
    appendStrokes(
      svg,
      roughLine(random, 0, height - 2, width, height - 3 + random() * 2, 0.8, 0),
      roughLine(random, width * 0.08, height + 0.5, width * 0.94, height - 0.5, 0.8, 0),
    );
  } else if (mode !== "wash") {
    const group = element("g", { filter: `url(#${GRAIN_ID})` }, svg);
    appendStrokes(
      group,
      roughRect(random, width, height, { inset: 1.5, radius, amp: 1.1, breaks: 0.25 }),
      roughRect(random, width, height, { inset: 1.5, radius, amp: 1.5, breaks: 0.45 }),
    );
  }

  const previous = target.querySelector(":scope > .lm-ink");
  if (previous) previous.replaceWith(svg);
  else target.prepend(svg);
  target.dataset.sketched = "";
}

function appendGrainFilter() {
  const svg = element("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position: absolute" });
  const filter = element("filter", { id: GRAIN_ID, x: "-10%", y: "-10%", width: "120%", height: "120%" }, svg);
  element("feTurbulence", { type: "fractalNoise", baseFrequency: 1.1, numOctaves: 2, result: "noise" }, filter);
  element(
    "feDisplacementMap",
    { in: "SourceGraphic", in2: "noise", scale: 1.3, xChannelSelector: "R", yChannelSelector: "G", result: "rough" },
    filter,
  );
  element(
    "feColorMatrix",
    { in: "noise", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.8 0 0 0 -0.12", result: "tooth" },
    filter,
  );
  element("feComposite", { in: "rough", in2: "tooth", operator: "in" }, filter);
  document.body.append(svg);
}

const targets = document.querySelectorAll<HTMLElement>("[data-sketch]");

if (targets.length > 0) {
  appendGrainFilter();

  // Also fires when a hidden element first gets a size: closed menus and
  // filtered-out cards draw the moment they appear.
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) draw(entry.target as HTMLElement);
  });

  targets.forEach((target, index) => {
    seeds.set(target, hashString(`${target.textContent}${index}`));
    observer.observe(target);
  });
}
