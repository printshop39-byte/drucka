/* ── Drucka Collage Maker — layouts, templates, sizes, filters ──
   Cells are fractional rects {x,y,w,h} in 0–1 canvas space, so the same
   numbers drive the live preview (CSS %) and the full-res canvas export. */

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

/* patterns drawn identically in preview (tiny canvas → CSS bg) and export */
export const PATTERNS = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "stripes", label: "Stripes" },
  { id: "confetti", label: "Confetti" },
];

const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const L = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return L > 150;
};

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
  }
  ctx.restore();
}

/* CSS background-image for the live preview (rendered via tiny canvas) */
export function patternDataUrl(patternId, bg, size = 240) {
  if (patternId === "none") return null;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  drawPattern(ctx, size, size, patternId, bg);
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
