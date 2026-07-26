/* ── Flatten a print area's layers into the artwork that actually gets printed ──

   Until now the artwork sent to Qikink was the FIRST image layer, raw: text
   layers were never rendered, a second image was dropped, and the position,
   scale and rotation the customer set inside the print area were all lost. A
   customer could order a tee with a caption on it and receive a blank one.

   Layer coordinates are % of the print area — x/y is the CENTRE, w/h are the
   size — exactly as DesignCanvas draws them, so this and the on-screen preview
   stay in step. Text is sized in cqh, i.e. % of the print height, which is why
   fontSize maps to a fraction of the canvas height here too. */

import { fontStack } from "./data";

/* 300 DPI is the press standard. The cap keeps a 24×36″ poster from becoming a
   7200×10800 canvas the browser cannot allocate; the uploads themselves are
   capped at 1400px by prepareUpload, so past a point there is no more detail
   to capture anyway. */
const TARGET_DPI = 300;
const MAX_PX = 4000;

export const artworkPixelSize = (inches) => {
  const dpi = Math.min(TARGET_DPI, MAX_PX / Math.max(inches.w, inches.h));
  return { w: Math.round(inches.w * dpi), h: Math.round(inches.h * dpi), dpi: Math.round(dpi) };
};

const loadImage = (src) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("artwork layer failed to load"));
    img.src = src;
  });

/* one layer, drawn about its own centre so rotation and flip behave the way
   the CSS transform on the canvas does */
async function drawLayer(ctx, layer, W, H) {
  if (layer.visible === false) return;
  const cx = (layer.x / 100) * W;
  const cy = (layer.y / 100) * H;

  ctx.save();
  ctx.globalAlpha = layer.opacity ?? 1;
  ctx.translate(cx, cy);
  ctx.rotate(((layer.rot ?? 0) * Math.PI) / 180);
  ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);

  if (layer.type === "text") {
    const px = ((layer.fontSize ?? 11) / 100) * H; // cqh → pixels
    const weight = layer.bold ? 800 : 400;
    const style = layer.italic ? "italic" : "normal";
    ctx.font = `${style} ${weight} ${px}px ${fontStack(layer.font)}`;
    ctx.fillStyle = layer.color ?? "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = String(layer.text ?? "").split("\n");
    const lineHeight = px * (layer.lineHeight ?? 1.15);
    const spacing = (layer.letterSpacing ?? 0) * px;
    /* letterSpacing has poor canvas support, so space the glyphs by hand when
       it is set — otherwise the printed text would be tighter than the preview */
    const drawLine = (text, y) => {
      if (!spacing) {
        ctx.fillText(text, 0, y);
        if (layer.underline) {
          const w = ctx.measureText(text).width;
          ctx.fillRect(-w / 2, y + px * 0.42, w, Math.max(1, px * 0.06));
        }
        return;
      }
      const chars = [...text];
      const total = chars.reduce((s, c) => s + ctx.measureText(c).width + spacing, 0) - spacing;
      let x = -total / 2;
      for (const c of chars) {
        const w = ctx.measureText(c).width;
        ctx.fillText(c, x + w / 2, y);
        x += w + spacing;
      }
      if (layer.underline) ctx.fillRect(-total / 2, y + px * 0.42, total, Math.max(1, px * 0.06));
    };
    const top = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => drawLine(line, top + i * lineHeight));
  } else if (layer.src) {
    const img = await loadImage(layer.src);
    const w = ((layer.w ?? 30) / 100) * W;
    const h = ((layer.h ?? 30) / 100) * H;
    /* the preview uses object-fit: fill, so match it rather than letterboxing */
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

/* Returns a transparent PNG data URL of everything printed in this area, or
   null when the area has nothing visible on it. */
export async function renderPlacementArtwork(layers, inches) {
  const visible = (layers ?? []).filter((l) => l.visible !== false);
  if (!visible.length || !inches) return null;

  /* the fonts have to be resolved before measuring or the first render can
     fall back to a default face and print in the wrong typeface */
  try { await document.fonts?.ready; } catch { /* not supported — proceed */ }

  const { w: W, h: H } = artworkPixelSize(inches);
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  for (const layer of visible) await drawLayer(ctx, layer, W, H);
  return cv.toDataURL("image/png");
}

/* Render every printed area and park the flattened artwork on Cloudinary,
   returning { [placementId]: url }.

   Uploading here rather than storing the image in the cart is deliberate: a
   12″ × 16″ print at 300 DPI is a 3600 × 4800 canvas, and a couple of those as
   data URLs would blow past the localStorage quota — which `save()` swallows
   silently, so the cart would simply stop persisting.

   Best-effort by design. If a placement fails to render or upload it is left
   out, and fulfillment falls back to the old behaviour for it. Losing the text
   on one placement is bad; refusing to let someone buy is worse. */
export async function uploadPlacementArtwork({ areas, layersByPlacement, inchesFor, size, key }) {
  const out = {};
  for (const area of areas) {
    try {
      const dataUrl = await renderPlacementArtwork(layersByPlacement[area.id], inchesFor(area, size));
      if (!dataUrl) continue;
      const res = await fetch("/api/upload-artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, orderId: key, layerId: area.id }),
      });
      const json = await res.json();
      if (json?.ok && json.url) out[area.id] = json.url;
      else console.warn(`artwork upload failed for ${area.id}:`, json?.error);
    } catch (err) {
      console.warn(`artwork render/upload failed for ${area.id}:`, err.message);
    }
  }
  return out;
}
