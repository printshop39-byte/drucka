import { cellRect, drawPattern, filterCss, layoutById } from "./collageData";
import { fontStack } from "../designer/data";

/* ── Full-resolution HTML5-canvas renderer ──
   Mirrors the live preview exactly: same fractional cell geometry, same
   cover-crop + zoom/pan math, same CSS filter strings (ctx.filter). */

const imageCache = new Map();
export const loadImage = (src) =>
  imageCache.get(src) ??
  imageCache.set(src, new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  })).get(src);

const roundedPath = (ctx, x, y, w, h, r) => {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
};

export async function renderCollage(state) {
  const { size, layoutId, slots, photos, gap, radius, bg, pattern, texts, stickers } = state;
  const W = size.w, H = size.h;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  /* background + pattern */
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawPattern(ctx, W, H, pattern, bg);

  /* photo cells */
  const layout = layoutById(layoutId);
  const radPx = radius * Math.min(W, H);
  for (let i = 0; i < layout.cells.length; i++) {
    const slot = slots[i];
    const rect = cellRect(layout.cells[i], W, H, gap);
    if (!slot?.photoId) {
      // empty cells export as soft panels so partial collages still look done
      ctx.save();
      roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, radPx);
      ctx.fillStyle = "rgba(127,127,127,0.12)";
      ctx.fill();
      ctx.restore();
      continue;
    }
    const photo = photos.find((p) => p.id === slot.photoId);
    if (!photo) continue;
    const img = await loadImage(photo.src);

    ctx.save();
    roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, radPx);
    ctx.clip();
    ctx.filter = filterCss(slot.filter ?? "none");

    /* cover-crop + zoom + pan — same math as the preview styles */
    const zoom = slot.zoom ?? 1;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const cellAspect = rect.w / rect.h;
    const base = imgAspect > cellAspect ? rect.h / img.naturalHeight : rect.w / img.naturalWidth;
    const s = base * zoom;
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    const cx = rect.x + rect.w / 2 + ((slot.ox ?? 0) / 100) * rect.w;
    const cy = rect.y + rect.h / 2 + ((slot.oy ?? 0) / 100) * rect.h;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }

  /* stickers (SVG data URLs draw cleanly, no canvas tainting) */
  for (const st of stickers) {
    const img = await loadImage(st.src);
    const sw = (st.size / 100) * W;
    const sh = sw; // stickers are square viewBoxes
    ctx.save();
    ctx.translate((st.x / 100) * W, (st.y / 100) * H);
    ctx.rotate(((st.rot ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  /* text overlays */
  for (const t of texts) {
    const px = (t.size / 100) * H;
    ctx.save();
    ctx.font = `${t.bold ? 700 : 400} ${px}px ${fontStack(t.font)}`;
    ctx.fillStyle = t.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = px * 0.08;
    const lines = t.text.split("\n");
    lines.forEach((line, li) => {
      ctx.fillText(line, (t.x / 100) * W, (t.y / 100) * H + (li - (lines.length - 1) / 2) * px * 1.2);
    });
    ctx.restore();
  }

  return canvas;
}

export async function collageDataUrl(state, type = "image/jpeg", quality = 0.92, maxDim = null) {
  let canvas = await renderCollage(state);
  if (maxDim && Math.max(canvas.width, canvas.height) > maxDim) {
    const s = maxDim / Math.max(canvas.width, canvas.height);
    const small = document.createElement("canvas");
    small.width = Math.round(canvas.width * s);
    small.height = Math.round(canvas.height * s);
    small.getContext("2d").drawImage(canvas, 0, 0, small.width, small.height);
    canvas = small;
  }
  return canvas.toDataURL(type, quality);
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
