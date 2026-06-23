import { loadImage } from "../collage/exportCollage";

/* ── Mini photo print card renderer ──
   One renderer drives BOTH the live preview (small) and the cart/order
   image (high-res), so what you see is what prints. Handles transform
   (rotate/zoom/pan = crop), brightness/contrast, colour filters, a
   border style, an optional polaroid caption, a date stamp and corner
   stickers. Reuses the Collage Maker's cached `loadImage`. */

export const SIZE_ASPECT = { "2x3": 2 / 3, "3x3": 1, "4x3": 4 / 3 }; // width / height

export const BORDERS = [
  { id: "none", label: "None" },
  { id: "polaroid", label: "Polaroid" },
  { id: "gold", label: "Gold" },
  { id: "black", label: "Black" },
  { id: "dashed", label: "Dashed" },
];

export const MINI_FONTS = [
  { id: "Playfair Display", label: "Playfair", css: "'Playfair Display', Georgia, serif" },
  { id: "Dancing Script", label: "Dancing", css: "'Dancing Script', cursive" },
  { id: "Poppins", label: "Poppins", css: "'Poppins', system-ui, sans-serif" },
  { id: "Lato", label: "Lato", css: "'Lato', system-ui, sans-serif" },
];
export const fontCss = (id) => MINI_FONTS.find((f) => f.id === id)?.css ?? MINI_FONTS[0].css;
export const CAPTION_COLORS = ["#1a1208", "#ffffff", "#c19a3d", "#7a7a7a"];
export const CAPTION_SIZES = { S: 0.07, M: 0.085, L: 0.105 }; // fraction of photo width

export const FILTERS = [
  { id: "original", label: "Original", css: "none" },
  { id: "bw", label: "B&W", css: "grayscale(100%)" },
  { id: "vintage", label: "Vintage", css: "sepia(60%) contrast(90%) brightness(110%)" },
  { id: "warm", label: "Warm", css: "saturate(130%) hue-rotate(-15deg) brightness(105%)" },
  { id: "cool", label: "Cool", css: "saturate(80%) hue-rotate(15deg) brightness(105%)" },
  { id: "vivid", label: "Vivid", css: "saturate(160%) contrast(110%)" },
  { id: "fade", label: "Fade", css: "opacity(85%) brightness(115%) contrast(85%)" },
];
export const filterCss = (id) => FILTERS.find((f) => f.id === id)?.css ?? "none";

/* sticker emoji sets (Feature 4B) */
export const STICKER_SETS = [
  { label: "Love", items: ["❤", "💕", "💍"] },
  { label: "Celebration", items: ["🎂", "🎉", "⭐"] },
  { label: "Indian", items: ["🪔", "🌸", "🏵️"] },
  { label: "Nature", items: ["🌿", "🌺", "🦋"] },
];
export const STICKER_POS = ["tl", "tr", "bl", "br"];

const CONF = {
  none: { pad: 0, padBottom: 0, bg: "#ffffff", stroke: null, shadow: false },
  polaroid: { pad: 0.05, padBottom: 0.16, bg: "#ffffff", stroke: null, shadow: true },
  gold: { pad: 0.04, padBottom: 0.04, bg: "#c19a3d", stroke: null, shadow: false },
  black: { pad: 0.04, padBottom: 0.04, bg: "#1a1208", stroke: null, shadow: false },
  dashed: { pad: 0.05, padBottom: 0.05, bg: "#ffffff", stroke: "#c19a3d", shadow: false },
};
export const borderConf = (id) => CONF[id] ?? CONF.none;

let fontsReady;
const ensureFonts = () => {
  if (fontsReady) return fontsReady;
  const f = document.fonts;
  fontsReady = (f?.ready ?? Promise.resolve())
    .then(() => Promise.all([
      f?.load("600 40px 'Playfair Display'"),
      f?.load("700 40px 'Dancing Script'"),
      f?.load("600 40px 'Poppins'"),
      f?.load("700 40px 'Lato'"),
    ]))
    .catch(() => {});
  return fontsReady;
};

/* combined CSS filter string for the photo (colour preset + brightness + contrast) */
export function combinedFilter({ filter = "original", brightness = 100, contrast = 100 } = {}) {
  const parts = [];
  const base = filterCss(filter);
  if (base && base !== "none") parts.push(base);
  if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
  if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
  return parts.length ? parts.join(" ") : "none";
}

export async function renderMiniCard(photo, photoW = 1100) {
  const {
    src, sizeId = "3x3", border = "polaroid",
    rotation = 0, zoom = 1, ox = 0, oy = 0,
    caption = "", captionFont = "Poppins", captionSize = "M", captionColor = "#1a1208",
    dateStamp = false, dateText = "", stickers = [],
  } = photo;
  await ensureFonts();

  const conf = borderConf(border);
  const aspect = SIZE_ASPECT[sizeId] ?? 1;
  const photoH = Math.round(photoW / aspect);
  const pad = Math.round(conf.pad * photoW);
  const cap = (caption || "").trim();
  const capStrip = cap ? Math.round(0.17 * photoW) : 0;
  const sidePad = pad, topPad = pad;
  const bottomPad = cap ? Math.max(capStrip, Math.round(conf.padBottom * photoW)) : Math.round(conf.padBottom * photoW);
  const cardW = photoW + sidePad * 2;
  const cardH = photoH + topPad + bottomPad;

  const cv = document.createElement("canvas");
  cv.width = cardW; cv.height = cardH;
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  /* card / border background */
  ctx.fillStyle = conf.bg;
  ctx.fillRect(0, 0, cardW, cardH);

  /* photo window */
  const px = sidePad, py = topPad;
  const img = await loadImage(src);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, photoW, photoH);
  ctx.clip();
  ctx.filter = combinedFilter(photo);
  ctx.translate(px + photoW / 2 + (ox / 100) * photoW, py + photoH / 2 + (oy / 100) * photoH);
  ctx.rotate((rotation * Math.PI) / 180);
  const swap = rotation % 180 !== 0;
  const tW = swap ? photoH : photoW, tH = swap ? photoW : photoH;
  const iAsp = img.naturalWidth / img.naturalHeight, tAsp = tW / tH;
  let dw, dh;
  if (iAsp > tAsp) { dh = tH; dw = tH * iAsp; } else { dw = tW; dh = tW / iAsp; }
  dw *= zoom; dh *= zoom;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  /* date stamp — vintage Kodak, bottom-right inside the photo */
  if (dateStamp && dateText) {
    const fs = Math.round(photoW * 0.045);
    ctx.save();
    ctx.font = `700 ${fs}px 'Courier New', monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#E8650A";
    ctx.shadowColor = "rgba(232,101,10,0.6)";
    ctx.shadowBlur = fs * 0.35;
    ctx.fillText(dateText, px + photoW - fs * 0.6, py + photoH - fs * 0.6);
    ctx.restore();
  }

  /* corner stickers (max 2) */
  if (stickers && stickers.length) {
    const ss = Math.round(photoW * 0.13);
    ctx.save();
    ctx.font = `${ss}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const m = ss * 0.75;
    const at = {
      tl: [px + m, py + m], tr: [px + photoW - m, py + m],
      bl: [px + m, py + photoH - m], br: [px + photoW - m, py + photoH - m],
    };
    stickers.slice(0, 2).forEach((st) => {
      const p = at[st.pos] ?? at.tr;
      ctx.fillText(st.emoji, p[0], p[1]);
    });
    ctx.restore();
  }

  /* caption strip — always white for readability */
  if (cap) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, py + photoH, cardW, cardH - (py + photoH));
  }

  /* dashed outline hugging the photo */
  if (conf.stroke) {
    ctx.strokeStyle = conf.stroke;
    ctx.lineWidth = Math.max(3, photoW * 0.012);
    ctx.setLineDash([photoW * 0.035, photoW * 0.022]);
    const o = ctx.lineWidth * 1.4;
    ctx.strokeRect(px - o, py - o, photoW + o * 2, photoH + o * 2);
    ctx.setLineDash([]);
  }

  /* caption text */
  if (cap) {
    ctx.fillStyle = captionColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fs = Math.round((CAPTION_SIZES[captionSize] ?? CAPTION_SIZES.M) * photoW);
    ctx.font = `${captionFont === "Dancing Script" ? 700 : 600} ${fs}px ${fontCss(captionFont)}`;
    ctx.fillText(cap, cardW / 2, py + photoH + (cardH - (py + photoH)) / 2, photoW * 0.94);
  }

  return cv;
}

export async function miniCardDataUrl(photo, photoW = 1100, type = "image/jpeg", q = 0.92) {
  const cv = await renderMiniCard(photo, photoW);
  return cv.toDataURL(type, q);
}

/* ── occasion templates (Feature 7) — border + caption + stickers + filter ── */
export const OCCASION_TEMPLATES = [
  { id: "birthday", name: "Birthday", emoji: "🎂", border: "gold", caption: "Happy Birthday!", captionFont: "Dancing Script", captionColor: "#c19a3d", stickers: ["🎉", "⭐"], filter: "vivid" },
  { id: "wedding", name: "Wedding", emoji: "💍", border: "polaroid", caption: "Forever begins", captionFont: "Playfair Display", captionColor: "#1a1208", stickers: ["❤"], filter: "warm" },
  { id: "anniversary", name: "Anniversary", emoji: "💕", border: "gold", caption: "Years Together", captionFont: "Dancing Script", captionColor: "#c19a3d", stickers: ["💕"], filter: "warm" },
  { id: "travel", name: "Travel", emoji: "✈️", border: "polaroid", caption: "Wander often", captionFont: "Poppins", captionColor: "#1a1208", stickers: [], filter: "vivid", dateStamp: true },
  { id: "baby", name: "Baby", emoji: "👶", border: "polaroid", caption: "Hello little one", captionFont: "Playfair Display", captionColor: "#1a1208", stickers: ["🌸"], filter: "warm" },
  { id: "passport", name: "Passport", emoji: "🛂", border: "none", caption: "", captionFont: "Poppins", captionColor: "#1a1208", stickers: [], filter: "original", duplicateCount: 8, size: "2x3" },
  { id: "diwali", name: "Diwali", emoji: "🪔", border: "gold", caption: "Happy Diwali", captionFont: "Dancing Script", captionColor: "#c19a3d", stickers: ["🪔", "🌸"], filter: "warm" },
  { id: "bw_art", name: "B&W Art", emoji: "🎨", border: "black", caption: "", captionFont: "Playfair Display", captionColor: "#ffffff", stickers: [], filter: "bw" },
];
