/* ── Brush templates — one definition, three editors ──

   The pen used to be a single round line with a colour and a size, and it
   only existed in the Pro Editor. Customers drawing on a collage or on a
   t-shirt want the obvious art-shop set: a marker, a highlighter, chalk,
   spray, dots. Rather than write that three times, every brush is described
   ONCE here and each editor renders it with whatever engine it already has:

     Pro Editor   → Fabric brushes            (fabricBrush)
     Grid Editor  → strokes stored in % of    (drawStrokes) — preview and the
     Product      →   the sheet, replayed on   printed export run the SAME code,
       designer   →   a 2D canvas              so what is seen is what prints.

   A stroke is stored as percentages, never pixels: the collage preview is
   ~600px wide while the print is 3600px, and the product designer prints at
   300 DPI. Percentages scale to both without going soft or shifting. */

export type BrushEngine = 'stroke' | 'spray' | 'dots';

export interface BrushTemplate {
  id: string;
  label: string;
  hint: string;
  engine: BrushEngine;
  /* multiplies the size the customer picked — a marker is fatter than a pen
     at the same setting, which is what makes the templates feel different */
  widthScale: number;
  opacity: number;
  lineCap: CanvasLineCap;
  /* dash pattern in multiples of the stroke width (so it scales with size) */
  dash?: number[];
  /* glow blur in multiples of the stroke width */
  glow?: number;
  /* highlighter has to sit UNDER the artwork's darks, like a real one */
  blend?: GlobalCompositeOperation;
  /* spray / chalk: dots per step and their size relative to the stroke */
  density?: number;
  dotScale?: number;
  scatter?: number;
  /* dots: gap between stamps in multiples of the stroke width */
  gap?: number;
}

export const BRUSH_TEMPLATES: BrushTemplate[] = [
  { id: 'pen', label: 'Pen', hint: 'Clean, even line', engine: 'stroke', widthScale: 1, opacity: 1, lineCap: 'round' },
  { id: 'marker', label: 'Marker', hint: 'Bold and juicy', engine: 'stroke', widthScale: 2.2, opacity: 0.92, lineCap: 'round' },
  { id: 'highlighter', label: 'Highlighter', hint: 'See-through wash', engine: 'stroke', widthScale: 3.4, opacity: 0.32, lineCap: 'butt', blend: 'multiply' },
  { id: 'neon', label: 'Neon', hint: 'Glowing outline', engine: 'stroke', widthScale: 1.2, opacity: 1, lineCap: 'round', glow: 1.6 },
  { id: 'dash', label: 'Dashed', hint: 'Stitched line', engine: 'stroke', widthScale: 1, opacity: 1, lineCap: 'butt', dash: [2, 2.4] },
  { id: 'chalk', label: 'Chalk', hint: 'Grainy and dry', engine: 'spray', widthScale: 1.6, opacity: 0.55, lineCap: 'round', density: 14, dotScale: 0.16, scatter: 0.5 },
  { id: 'spray', label: 'Spray', hint: 'Airbrush mist', engine: 'spray', widthScale: 3.6, opacity: 0.4, lineCap: 'round', density: 18, dotScale: 0.1, scatter: 1 },
  { id: 'dots', label: 'Dots', hint: 'Spaced beads', engine: 'dots', widthScale: 1.4, opacity: 1, lineCap: 'round', gap: 2.2 },
];

export const brushById = (id: string): BrushTemplate =>
  BRUSH_TEMPLATES.find((b) => b.id === id) ?? BRUSH_TEMPLATES[0];

/* ── colour helpers ── */

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

/** '#rrggbb' (or '#rgb') + alpha → 'rgba(r, g, b, a)'. Anything already
 *  rgba() is handed back untouched so a caller can pass one through. */
export const withAlpha = (color: string, alpha: number): string => {
  if (alpha >= 1) return color;
  if (!color.startsWith('#')) return color;
  const h = color.slice(1);
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return color;
  return `rgba(${clamp255((n >> 16) & 255)}, ${clamp255((n >> 8) & 255)}, ${clamp255(n & 255)}, ${alpha})`;
};

/* ── strokes stored in design space (Grid Editor + product designer) ── */

export interface Stroke {
  brush: string;
  color: string;
  /* stroke width as a % of the sheet's SHORTER side — so a stroke keeps its
     weight whether the sheet is square or a tall poster */
  size: number;
  /* [x, y] as % of the sheet, 0–100 */
  points: [number, number][];
}

/* A stamped brush (spray, chalk, dots) has to land its dots in exactly the
   same places every time it is drawn — the on-screen preview and the 300 DPI
   print are two separate renders of the same stroke, and Math.random() would
   make them disagree. This is a plain deterministic hash, seeded per stroke
   and per dot. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Pixel width of a stroke on a W×H canvas. */
export const strokePx = (stroke: Stroke, W: number, H: number) =>
  Math.max(1, (stroke.size / 100) * Math.min(W, H));

const pointsPx = (stroke: Stroke, W: number, H: number): [number, number][] =>
  stroke.points.map(([x, y]) => [(x / 100) * W, (y / 100) * H]);

/* the same midpoint-quadratic smoothing Fabric's pencil uses, so a stroke
   drawn in the Grid Editor looks like one drawn in the Pro Editor */
const tracePath = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => {
  ctx.beginPath();
  if (pts.length === 1) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[0][0] + 0.01, pts[0][1] + 0.01);
    return;
  }
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
};

/* walk the polyline at a fixed step, handing back a point each time — used by
   every stamped brush so spray and dots space themselves by distance rather
   than by how fast the finger moved */
const walk = (pts: [number, number][], step: number, fn: (x: number, y: number, i: number) => void) => {
  if (pts.length === 1) { fn(pts[0][0], pts[0][1], 0); return; }
  let carry = 0;
  let i = 0;
  for (let s = 1; s < pts.length; s++) {
    const [ax, ay] = pts[s - 1];
    const [bx, by] = pts[s];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (!len) continue;
    let d = carry;
    while (d <= len) {
      fn(ax + (dx * d) / len, ay + (dy * d) / len, i++);
      d += step;
    }
    carry = d - len;
  }
};

/** Draw one stored stroke onto a 2D context sized W×H (design pixels). */
export const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, W: number, H: number, seed = 0) => {
  const t = brushById(stroke.brush);
  const pts = pointsPx(stroke, W, H);
  if (!pts.length) return;
  const w = strokePx(stroke, W, H) * t.widthScale;

  ctx.save();
  ctx.globalAlpha = t.opacity;
  if (t.blend) ctx.globalCompositeOperation = t.blend;

  if (t.engine === 'stroke') {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = w;
    ctx.lineCap = t.lineCap;
    ctx.lineJoin = 'round';
    if (t.dash) ctx.setLineDash(t.dash.map((d) => d * w));
    if (t.glow) {
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = t.glow * w;
    }
    tracePath(ctx, pts);
    ctx.stroke();
    /* a neon line is the glow plus a hot core, exactly like the Pro Editor's
       shadowed brush — one pass alone reads as a blurry smudge */
    if (t.glow) {
      ctx.shadowBlur = t.glow * w * 0.5;
      ctx.stroke();
    }
  } else if (t.engine === 'dots') {
    ctx.fillStyle = stroke.color;
    walk(pts, w * (t.gap ?? 2), (x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    /* spray / chalk — a cloud of dots around each step of the path */
    ctx.fillStyle = stroke.color;
    const dots = t.density ?? 12;
    const spread = (t.scatter ?? 1) * w * 0.5;
    const dotR = Math.max(0.4, w * (t.dotScale ?? 0.12));
    walk(pts, Math.max(1, w * 0.22), (x, y, i) => {
      for (let d = 0; d < dots; d++) {
        const k = seed * 7919 + i * 131 + d;
        const a = rand(k) * Math.PI * 2;
        const r = Math.sqrt(rand(k + 0.5)) * spread;
        ctx.globalAlpha = t.opacity * (0.45 + rand(k + 0.25) * 0.55);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, dotR * (0.6 + rand(k + 0.75) * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  ctx.restore();
};

/** Draw a whole set of strokes. Index is the seed, so redrawing is stable. */
export const drawStrokes = (ctx: CanvasRenderingContext2D, strokes: Stroke[] | undefined, W: number, H: number) => {
  for (let i = 0; i < (strokes?.length ?? 0); i++) drawStroke(ctx, strokes![i], W, H, i + 1);
};

/** Everything the strokes cover, as a transparent PNG at the given size —
 *  how the product designer turns a drawing into a normal printable layer. */
export const strokesToDataUrl = (strokes: Stroke[], W: number, H: number): string | null => {
  if (!strokes.length) return null;
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(W));
  cv.height = Math.max(1, Math.round(H));
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';
  drawStrokes(ctx, strokes, cv.width, cv.height);
  return cv.toDataURL('image/png');
};
