/* ── Drucka Collage Maker — layouts, templates, sizes, filters ──
   Cells are fractional rects {x,y,w,h} in 0–1 canvas space, so the same
   numbers drive the live preview (CSS %) and the full-res canvas export. */

import { calculate } from "../utils/pricing";

export const cuid = () => Math.random().toString(36).slice(2, 9);

const grid = (cols, rows) => {
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows });
  return cells;
};

export const LAYOUTS = [
  { id: "2v", label: "2 · Split", cells: grid(2, 1) },
  { id: "2h", label: "2 · Stack", cells: grid(1, 2) },
  { id: "3strip", label: "3 · Strip", cells: grid(3, 1) },
  { id: "big-left", label: "3 · Feature", cells: [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ]},
  { id: "banner", label: "3 · Banner", cells: [
    { x: 0, y: 0, w: 1, h: 0.55 },
    { x: 0, y: 0.55, w: 0.5, h: 0.45 },
    { x: 0.5, y: 0.55, w: 0.5, h: 0.45 },
  ]},
  { id: "2x2", label: "4 · Grid 2×2", cells: grid(2, 2) },
  { id: "mosaic5", label: "5 · Mosaic", cells: [
    { x: 0, y: 0, w: 0.55, h: 0.62 },
    { x: 0.55, y: 0, w: 0.45, h: 0.31 },
    { x: 0.55, y: 0.31, w: 0.45, h: 0.31 },
    { x: 0, y: 0.62, w: 0.5, h: 0.38 },
    { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
  ]},
  { id: "3x2", label: "6 · Grid 3×2", cells: grid(3, 2) },
  { id: "3x3", label: "9 · Grid 3×3", cells: grid(3, 3) },
  { id: "4x3", label: "12 · Grid 4×3", cells: grid(4, 3) },
  { id: "4x4", label: "16 · Grid 4×4", cells: grid(4, 4) },
  { id: "4x5", label: "20 · Grid 4×5", cells: grid(4, 5) },
];
export const layoutById = (id) => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[5];

/* occasion templates = layout + look + a starter caption */
export const OCCASIONS = [
  { id: "birthday", label: "🎂 Birthday", layout: "mosaic5", bg: "#fde68a", pattern: "confetti", caption: "Happy Birthday!", captionColor: "#1b1430", font: "Playfair Display" },
  { id: "wedding", label: "💍 Wedding", layout: "big-left", bg: "#faf7f2", pattern: "none", caption: "Forever begins", captionColor: "#5b21b6", font: "Brush Script MT" },
  { id: "travel", label: "✈️ Travel", layout: "3x3", bg: "#1b1430", pattern: "none", caption: "Wander often", captionColor: "#ffffff", font: "Inter" },
  { id: "baby", label: "👶 Baby", layout: "2x2", bg: "#fbe3ea", pattern: "dots", caption: "Hello little one", captionColor: "#6e1423", font: "Playfair Display" },
  { id: "family", label: "👨‍👩‍👧 Family", layout: "banner", bg: "#ffffff", pattern: "none", caption: "Family first ❤", captionColor: "#1b1430", font: "Georgia" },
  { id: "love", label: "❤️ Love", layout: "2v", bg: "#6e1423", pattern: "none", caption: "You & Me", captionColor: "#f9a8d4", font: "Brush Script MT" },
];

export const CANVAS_SIZES = [
  { id: "ig-post", label: "Instagram Post", w: 1080, h: 1080 },
  { id: "ig-story", label: "Instagram Story", w: 1080, h: 1920 },
  { id: "square-hd", label: "Square HD", w: 1800, h: 1800 },
  { id: "print-46", label: "4×6 Print", w: 1800, h: 1200 },
  { id: "print-810", label: "8×10 Print", w: 2400, h: 3000 },
  { id: "a4", label: "A4 Poster", w: 2480, h: 3508 },
];

/* ── Print sizes (PRD §5) — pixel dims @300dpi drive both the canvas
   aspect ratio and the order price. `price` = base print price (₹). ── */
export const PRINT_SIZES = [
  { id: "wallet", label: 'Wallet · 2×3"', dim: '2×3"', w: 600, h: 900, price: 49 },
  { id: "standard", label: 'Standard · 4×6"', dim: '4×6"', w: 1200, h: 1800, price: 99 },
  { id: "medium", label: 'Medium · 5×7"', dim: '5×7"', w: 1500, h: 2100, price: 149 },
  { id: "square", label: 'Square · 8×8"', dim: '8×8"', w: 2400, h: 2400, price: 349 },
  { id: "large", label: 'Large · 8×10"', dim: '8×10"', w: 2400, h: 3000, price: 299 },
  { id: "a4", label: "A4 · Poster", dim: "A4", w: 2480, h: 3508, price: 249 },
  { id: "a3", label: "A3 · Poster", dim: "A3", w: 3508, h: 4961, price: 449 },
  { id: "pano", label: 'Panoramic · 12×18"', dim: '12×18"', w: 3600, h: 5400, price: 599 },
];

/* social / digital sizes — download only, not priced for print */
export const SOCIAL_SIZES = [
  { id: "ig-post", label: "Instagram Post", dim: "1:1", w: 1080, h: 1080 },
  { id: "ig-story", label: "Instagram Story", dim: "9:16", w: 1080, h: 1920 },
];

export const printSizeById = (id) => PRINT_SIZES.find((s) => s.id === id);

/* ── Frame & lamination add-ons (PRD §11) ── */
export const FRAME_OPTIONS = [
  { id: "none", label: "No frame", price: 0 },
  { id: "white_minimal", label: "White Minimal", price: 199 },
  { id: "classic_black", label: "Classic Black", price: 199 },
  { id: "wooden_brown", label: "Wooden Brown", price: 249 },
  { id: "premium_golden", label: "Premium Golden", price: 299 },
];
export const LAMINATION_OPTIONS = [
  { id: "none", label: "None", price: 0 },
  { id: "glossy", label: "Glossy", price: 49 },
  { id: "matte", label: "Matte", price: 49 },
];

export { FREE_SHIP_THRESHOLD } from "../utils/pricing";

/* live price calculation (PRD §11) — resolves collage add-ons, then hands
   the arithmetic to the shared pricing engine (src/utils/pricing.js). */
export function calcCollagePrice({ size, frame, lamination, qty = 1 }) {
  const base = Number(size?.price) || 99;
  const framePrice = FRAME_OPTIONS.find((f) => f.id === frame)?.price ?? 0;
  const lamPrice = LAMINATION_OPTIONS.find((l) => l.id === lamination)?.price ?? 0;
  return calculate({ family: "collage", base, framePrice, lamPrice, qty });
}

export const PHOTO_FILTERS = [
  { id: "none", label: "Original", css: "none" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.05)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.7)" },
  { id: "warm", label: "Warm", css: "saturate(1.25) sepia(0.18) brightness(1.03)" },
  { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(-10deg) brightness(1.02)" },
  { id: "bright", label: "Bright", css: "brightness(1.15) contrast(1.05)" },
  { id: "fade", label: "Fade", css: "contrast(0.88) brightness(1.1) saturate(0.8)" },
];
export const filterCss = (id) => PHOTO_FILTERS.find((f) => f.id === id)?.css ?? "none";

export const BG_SWATCHES = ["#ffffff", "#faf7f2", "#1b1430", "#000000", "#5b21b6", "#fbe3ea", "#fde68a", "#dbeafe", "#dcfce7", "#6e1423"];

/* Backgrounds drawn identically in preview (tiny canvas → CSS bg) and export.

   Everything here is DRAWN, not a stock image. That is deliberate: a drawn
   background is a few hundred bytes instead of a 200 KB JPG, stays sharp at
   any print size (a 20×30″ canvas is 6000 px), recolours itself against the
   chosen background colour, and carries no licence attached to someone
   else's artwork. The first three are the originals; the rest are the
   ready-made backgrounds.

   `tile` says how it is laid down: the originals repeat across the sheet,
   while the new ones are composed against the edges and corners, so they are
   drawn ONCE at the sheet's own proportions. Getting that wrong puts four
   floral corners in the middle of the page. */
export const PATTERNS = [
  { id: "none", label: "None", tile: true },
  { id: "dots", label: "Dots", tile: true },
  { id: "stripes", label: "Stripes", tile: true },
  { id: "confetti", label: "Confetti", tile: true },
  { id: "floral", label: "Floral Corners", tile: false },
  { id: "paper", label: "Handmade Paper", tile: false },
  { id: "washi", label: "Scrapbook", tile: false },
  { id: "arch", label: "Editorial", tile: false },
  { id: "frame", label: "Thin Frame", tile: false },
  { id: "vignette", label: "Soft Vignette", tile: false },
];
export const patternTiles = (id) => PATTERNS.find((p) => p.id === id)?.tile !== false;

const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const L = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return L > 150;
};

/* deterministic pseudo-random — the same background must come out of the
   preview and the 6000 px export identically, so Math.random is out */
const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* one botanical spray, drawn from the corner outwards. `dir` flips it so the
   same routine serves all four corners. */
function drawSpray(ctx, u, petal, leaf, dir, rnd) {
  ctx.save();
  ctx.scale(dir.x, dir.y);
  for (let stem = 0; stem < 5; stem++) {
    /* fan the stems INTO the sheet: from the top-left corner that is between
       straight-down and straight-right, so the angle has to be positive.
       `dir` mirrors the whole fan for the opposite corner. */
    const ang = (Math.PI / 2) * (0.15 + stem * 0.19);
    const len = u * (0.20 + rnd() * 0.16);
    ctx.save();
    ctx.rotate(ang);
    /* stem */
    ctx.strokeStyle = leaf;
    ctx.lineWidth = u * 0.004;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.4, -len * 0.1, len, 0);
    ctx.stroke();
    /* leaves along it */
    for (let i = 1; i <= 3; i++) {
      const t = i / 4, lx = len * t, ls = u * 0.022;
      ctx.fillStyle = leaf;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(lx, s * ls * 0.5, ls, ls * 0.42, s * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    /* a flower at the tip: five petals + centre */
    const fr = u * (0.017 + rnd() * 0.012);
    ctx.fillStyle = petal;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(len + Math.cos(a) * fr, Math.sin(a) * fr, fr * 0.72, fr * 0.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = leaf;
    ctx.beginPath();
    ctx.arc(len, 0, fr * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/* draw a pattern onto any 2D context — unit = canvas min dimension */
export function drawPattern(ctx, w, h, patternId, bg) {
  if (patternId === "none") return;
  const ink = isLight(bg) ? "rgba(27,20,48,0.10)" : "rgba(255,255,255,0.13)";
  const u = Math.min(w, h);
  ctx.save();
  if (patternId === "dots") {
    ctx.fillStyle = ink;
    const step = u * 0.06;
    for (let y = step / 2; y < h; y += step)
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, u * 0.006, 0, Math.PI * 2);
        ctx.fill();
      }
  } else if (patternId === "stripes") {
    ctx.strokeStyle = ink;
    ctx.lineWidth = u * 0.012;
    const step = u * 0.08;
    for (let x = -h; x < w + h; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }
  } else if (patternId === "confetti") {
    const colors = ["#f97316", "#5b21b6", "#f9a8d4", "#22c55e", "#3b82f6"];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // deterministic
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = colors[i % colors.length] + "55";
      const x = rnd() * w, y = rnd() * h, s = u * (0.006 + rnd() * 0.01);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rnd() * Math.PI);
      ctx.fillRect(-s, -s / 2, s * 2, s);
      ctx.restore();
    }
  } else if (patternId === "floral") {
    /* botanical sprays in opposite corners — the shape the pinned reference
       images use most. Petals pick up the background's warmth so it works on
       a blush, a navy or a cream. */
    const rnd = seeded(23);
    const light = isLight(bg);
    const petal = light ? "rgba(139,92,168,0.55)" : "rgba(255,255,255,0.72)";
    const leaf = light ? "rgba(45,92,62,0.45)" : "rgba(226,232,240,0.42)";
    ctx.save(); ctx.translate(0, 0); drawSpray(ctx, u, petal, leaf, { x: 1, y: 1 }, rnd); ctx.restore();
    ctx.save(); ctx.translate(w, h); drawSpray(ctx, u, petal, leaf, { x: -1, y: -1 }, rnd); ctx.restore();
  } else if (patternId === "paper") {
    /* handmade-paper speckle plus a soft deckled edge */
    const rnd = seeded(101);
    const fleck = isLight(bg) ? "rgba(27,20,48,0.055)" : "rgba(255,255,255,0.07)";
    ctx.fillStyle = fleck;
    for (let i = 0; i < 1400; i++) {
      const s = u * (0.0012 + rnd() * 0.0022);
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = isLight(bg) ? "rgba(27,20,48,0.10)" : "rgba(255,255,255,0.14)";
    ctx.lineWidth = u * 0.003;
    const m = u * 0.035;
    ctx.beginPath();
    for (let x = m; x <= w - m; x += u * 0.02) ctx.lineTo(x, m + Math.sin(x / (u * 0.05)) * u * 0.004);
    for (let y = m; y <= h - m; y += u * 0.02) ctx.lineTo(w - m + Math.sin(y / (u * 0.05)) * u * 0.004, y);
    for (let x = w - m; x >= m; x -= u * 0.02) ctx.lineTo(x, h - m + Math.sin(x / (u * 0.05)) * u * 0.004);
    for (let y = h - m; y >= m; y -= u * 0.02) ctx.lineTo(m + Math.sin(y / (u * 0.05)) * u * 0.004, y);
    ctx.closePath();
    ctx.stroke();
  } else if (patternId === "washi") {
    /* scrapbook: washi-tape strips at the corners and a scatter of hearts */
    const rnd = seeded(57);
    const tapes = ["rgba(249,168,212,0.42)", "rgba(147,197,253,0.42)", "rgba(253,230,138,0.5)"];
    const strip = (x, y, ang, len) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = tapes[Math.floor(rnd() * tapes.length)];
      ctx.fillRect(-len / 2, -u * 0.016, len, u * 0.032);
      ctx.restore();
    };
    strip(u * 0.13, u * 0.10, -0.5, u * 0.30);
    strip(w - u * 0.13, u * 0.13, 0.45, u * 0.26);
    strip(u * 0.15, h - u * 0.12, 0.4, u * 0.26);
    strip(w - u * 0.14, h - u * 0.11, -0.42, u * 0.30);
    ctx.fillStyle = isLight(bg) ? "rgba(190,24,93,0.20)" : "rgba(255,255,255,0.24)";
    for (let i = 0; i < 26; i++) {
      const x = rnd() * w, y = rnd() * h, s = u * (0.006 + rnd() * 0.006);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rnd() * 0.6 - 0.3);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.6);
      ctx.bezierCurveTo(-s * 1.4, -s * 0.5, -s * 0.4, -s * 1.2, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.4, -s * 1.2, s * 1.4, -s * 0.5, 0, s * 0.6);
      ctx.fill();
      ctx.restore();
    }
  } else if (patternId === "arch") {
    /* modern editorial: an arch and two blocks, the poster look */
    const tint = isLight(bg) ? "rgba(27,20,48,0.07)" : "rgba(255,255,255,0.09)";
    ctx.fillStyle = tint;
    const aw = w * 0.5, ax = (w - aw) / 2, ay = h * 0.10;
    ctx.beginPath();
    ctx.moveTo(ax, h * 0.78);
    ctx.lineTo(ax, ay + aw / 2);
    ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0);
    ctx.lineTo(ax + aw, h * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(w * 0.06, h * 0.06, w * 0.14, h * 0.14);
    ctx.fillRect(w * 0.80, h * 0.80, w * 0.14, h * 0.14);
  } else if (patternId === "frame") {
    /* a double hairline border — quiet, works under any layout */
    ctx.strokeStyle = ink;
    const m1 = u * 0.030, m2 = u * 0.045;
    ctx.lineWidth = u * 0.005;
    ctx.strokeRect(m1, m1, w - m1 * 2, h - m1 * 2);
    ctx.lineWidth = u * 0.002;
    ctx.strokeRect(m2, m2, w - m2 * 2, h - m2 * 2);
  } else if (patternId === "vignette") {
    /* soft corner falloff — lifts photos off a flat background */
    const g = ctx.createRadialGradient(w / 2, h / 2, u * 0.2, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, isLight(bg) ? "rgba(27,20,48,0.16)" : "rgba(0,0,0,0.34)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/* CSS background-image for the live preview (rendered via a small canvas).

   A tiling pattern is drawn square and repeated by CSS. A whole-sheet design
   has to be drawn at the SHEET's proportions and then stretched to fill,
   otherwise the preview shows a square composition letterboxed into a
   portrait print and stops matching what exports. Pass the print size. */
export function patternDataUrl(patternId, bg, size = 240, sheet = null) {
  if (patternId === "none") return null;
  const tiles = patternTiles(patternId);
  const ratio = tiles || !sheet ? 1 : sheet.h / sheet.w;
  const c = document.createElement("canvas");
  /* whole-sheet designs get more pixels — they carry detail (petals, speckle)
     rather than a motif repeated every 240px */
  const W = tiles ? size : 620;
  const H = Math.round(W * ratio);
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  drawPattern(ctx, W, H, patternId, bg);
  return c.toDataURL();
}

/* geometry shared by preview + export: apply gap to a fractional cell.
   gap is a fraction of the canvas min dimension (0 – 0.05). */
export function cellRect(cell, W, H, gap) {
  const g = gap * Math.min(W, H);
  const availW = W - 2 * g, availH = H - 2 * g;
  return {
    x: g + cell.x * availW + g / 2,
    y: g + cell.y * availH + g / 2,
    w: cell.w * availW - g,
    h: cell.h * availH - g,
  };
}
