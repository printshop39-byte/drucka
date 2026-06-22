/* ── Photo Print & Frame Customizer — shared data + math ──
   Everything is local-browser only: photos never leave the device;
   the customer shares the actual files on WhatsApp after ordering. */

export const WA_NUMBER = "917083811355";
export const wa = (m: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(m)}`;

export const cuid = () => Math.random().toString(36).slice(2, 9);

/* ── recommended print sizes (inches) ── */
export interface PrintSize { id: string; label: string; w: number; h: number; tag?: string }
export const PRINT_SIZES: PrintSize[] = [
  { id: "4x6", label: "4×6", w: 4, h: 6, tag: "Classic" },
  { id: "5x7", label: "5×7", w: 5, h: 7 },
  { id: "6x8", label: "6×8", w: 6, h: 8 },
  { id: "8x10", label: "8×10", w: 8, h: 10, tag: "Popular" },
  { id: "8x12", label: "8×12", w: 8, h: 12 },
  { id: "10x12", label: "10×12", w: 10, h: 12 },
  { id: "12x18", label: "12×18", w: 12, h: 18, tag: "Poster" },
  { id: "16x20", label: "16×20", w: 16, h: 20 },
  { id: "18x24", label: "18×24", w: 18, h: 24 },
  { id: "24x36", label: "24×36", w: 24, h: 36, tag: "XL" },
  { id: "a4", label: "A4", w: 8.27, h: 11.69 },
  { id: "a3", label: "A3", w: 11.69, h: 16.54 },
  { id: "a2", label: "A2", w: 16.54, h: 23.39 },
  { id: "sq8", label: "8×8 Square", w: 8, h: 8, tag: "Square" },
  { id: "sq12", label: "12×12 Square", w: 12, h: 12, tag: "Square" },
];
export const sizeById = (id: string) => PRINT_SIZES.find((s) => s.id === id) ?? PRINT_SIZES[0];

export const PRINT_TYPES = ["Glossy Photo Print", "Matte Photo Print", "Passport Size Photo", "Poster Print", "Canvas Style Print"];

export interface FrameOpening { x: number; y: number; w: number; h: number }
export interface FrameStyle {
  id: string; name: string; mat: string; accent: string | null; light?: boolean;
  img: string;                 // product-shot swatch thumbnail
  frameImg?: string;           // cropped real-frame photo for the live preview
  opening?: FrameOpening;      // photo window inside frameImg, % of the image
}
export const FRAME_STYLES: FrameStyle[] = [
  { id: "classic-black", name: "Classic Black", mat: "linear-gradient(135deg,#3a3a3a,#0c0c0c)", accent: null,
    img: "/images/frames/classic-black.jpg", frameImg: "/images/frames/classic-black-live.jpg", opening: { x: 13, y: 16, w: 74, h: 70 } },
  { id: "premium-golden", name: "Premium Golden", mat: "linear-gradient(135deg,#f6e09a,#caa033 48%,#8c5f17)", accent: "#f2d98c",
    img: "/images/frames/premium-golden.jpg", frameImg: "/images/frames/premium-golden-live.jpg", opening: { x: 14, y: 15, w: 69, h: 73 } },
  { id: "wooden-brown", name: "Wooden Brown", mat: "linear-gradient(135deg,#a06f40,#5d3819)", accent: null,
    img: "/images/frames/wooden-brown.jpg", frameImg: "/images/frames/wooden-brown-live.jpg", opening: { x: 19, y: 18, w: 62, h: 68 } },
  { id: "white-minimal", name: "White Minimal", mat: "linear-gradient(135deg,#ffffff,#e7e7ea)", accent: null, light: true,
    img: "/images/frames/white-minimal.jpg", frameImg: "/images/frames/white-minimal-live.jpg", opening: { x: 9, y: 9, w: 82, h: 83 } },
  { id: "designer-black-gold", name: "Designer Black Gold", mat: "linear-gradient(135deg,#1c1c1c,#000)", accent: "#d4af37",
    img: "/images/frames/designer-black-gold.jpg", frameImg: "/images/frames/designer-black-gold-live.jpg", opening: { x: 15, y: 10, w: 73, h: 82 } },
  { id: "traditional-ornate", name: "Traditional Ornate", mat: "linear-gradient(135deg,#d8b358,#7a5414)", accent: "#f0d98f",
    img: "/images/frames/traditional-ornate.jpg", frameImg: "/images/frames/traditional-ornate-live.jpg", opening: { x: 20, y: 17, w: 59, h: 67 } },
];

export const BORDER_OPTIONS = ["No Border", "White Border", "Premium Mat Border"];

export type CropMode = "fill" | "fit" | "center" | "free";
export const CROP_MODES: { id: CropMode; label: string; hint: string }[] = [
  { id: "fill", label: "Fill / Crop to Size", hint: "Fills the print, crops the extra" },
  { id: "fit", label: "Fit Full Image", hint: "Whole photo, border if needed" },
  { id: "center", label: "Center Crop", hint: "Crops evenly from the middle" },
  { id: "free", label: "Free Crop", hint: "Drag & resize the crop box" },
];
export const cropModeLabel = (id: CropMode) => CROP_MODES.find((m) => m.id === id)?.label ?? id;

/* ── per-photo state ── */
export interface CropState {
  mode: CropMode;
  zoom: number;            // ≥1, multiplies the cover scale (fill/center)
  ox: number; oy: number;  // pan, % of preview box (fill mode)
  box: { x: number; y: number; w: number; h: number }; // free-crop, % of image
  bright: number; contrast: number; sat: number;       // 100 = neutral
}
export interface PhotoSlot {
  id: string;
  name: string;
  src: string;        // preview bitmap (≤1600px, rotation/flip baked in)
  pw: number; ph: number;   // preview bitmap px
  ow: number; oh: number;   // ORIGINAL px (rotation-adjusted) → drives DPI
  sizeId: string;
  crop: CropState;
  qty: number;
}
export const defaultCrop = (): CropState => ({
  mode: "fill", zoom: 1, ox: 0, oy: 0,
  box: { x: 10, y: 10, w: 80, h: 80 },
  bright: 100, contrast: 100, sat: 100,
});

export const cssFilter = (c: CropState) =>
  c.bright === 100 && c.contrast === 100 && c.sat === 100
    ? "none"
    : `brightness(${c.bright}%) contrast(${c.contrast}%) saturate(${c.sat}%)`;

/* ── DPI quality check ──
   Uses ORIGINAL pixel dimensions against the physical print size,
   accounting for how much of the photo the chosen crop actually uses. */
export function effectiveDpi(slot: PhotoSlot): number {
  const s = sizeById(slot.sizeId);
  const { ow, oh } = slot;
  const c = slot.crop;
  if (c.mode === "fit") {
    // whole image printed inside the sheet — binding axis decides
    const printedW = ow / oh > s.w / s.h ? s.w : s.h * (ow / oh);
    return ow / printedW;
  }
  if (c.mode === "free") {
    const dpiW = (ow * c.box.w) / 100 / s.w;
    const dpiH = (oh * c.box.h) / 100 / s.h;
    return Math.min(dpiW, dpiH);
  }
  // fill / center: cover scale k (inches per source px), zoom crops further in
  const k = Math.max(s.w / ow, s.h / oh);
  return 1 / (k * (c.zoom || 1));
}

export interface Quality { id: string; label: string; message: string; color: string }
export function qualityFor(dpi: number): Quality {
  if (dpi >= 300) return { id: "excellent", label: "Excellent", message: "Excellent quality for this size", color: "#16a34a" };
  if (dpi >= 200) return { id: "good", label: "Good", message: "Good quality for this size", color: "#65a30d" };
  if (dpi >= 150) return { id: "fair", label: "Fair", message: "Fair quality, suitable for normal viewing", color: "#d97706" };
  return { id: "low", label: "Low", message: "Low quality, print may look blurry. Try smaller size or upload higher resolution image.", color: "#dc2626" };
}
export const slotQuality = (slot: PhotoSlot) => qualityFor(effectiveDpi(slot));

/* ── upload: original dims preserved for DPI, preview baked ≤1600px ── */
export const loadPhotoFile = (file: File): Promise<Omit<PhotoSlot, "sizeId" | "crop" | "qty">> =>
  new Promise((resolve, reject) => {
    if (!/image\/(jpe?g|png|webp|heic|heif)/i.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      reject(new Error("Please upload a JPG, PNG or WEBP image"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name}: format not supported by this browser (HEIC? convert to JPG)`)); };
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const src = canvas.toDataURL("image/jpeg", 0.9);
      URL.revokeObjectURL(url);
      resolve({ id: cuid(), name: file.name, src, pw: canvas.width, ph: canvas.height, ow: img.width, oh: img.height });
    };
    img.src = url;
  });

/* rotate (±90°) or flip the slot bitmap — baked in so all crop math stays
   rotation-free; original dims swap along with it for correct DPI */
export const transformSlot = (slot: PhotoSlot, op: "rotL" | "rotR" | "flipH"): Promise<Partial<PhotoSlot>> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Transform failed"));
    img.onload = () => {
      const rot = op !== "flipH";
      const canvas = document.createElement("canvas");
      canvas.width = rot ? img.height : img.width;
      canvas.height = rot ? img.width : img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (op === "rotL") ctx.rotate(-Math.PI / 2);
      if (op === "rotR") ctx.rotate(Math.PI / 2);
      if (op === "flipH") ctx.scale(-1, 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve({
        src: canvas.toDataURL("image/jpeg", 0.9),
        pw: canvas.width, ph: canvas.height,
        ow: rot ? slot.oh : slot.ow,
        oh: rot ? slot.ow : slot.oh,
      });
    };
    img.src = slot.src;
  });

/* ── WhatsApp order messages (exact templates from the brief) ── */
const photoLines = (slots: PhotoSlot[]) =>
  slots.map((p, i) => {
    const q = slotQuality(p);
    return `Photo ${i + 1}: ${sizeById(p.sizeId).label} · ${cropModeLabel(p.crop.mode)} · Qty ${p.qty} · Quality: ${q.label}`;
  }).join("\n");

export function printOrderMessage(slots: PhotoSlot[], printType: string, note: string) {
  return [
    "Hi Drucka, I want to order Photo Prints.",
    `Images: ${slots.length} uploaded photo${slots.length > 1 ? "s" : ""}`,
    `Print Type: ${printType}`,
    photoLines(slots),
    note.trim() ? `Note: ${note.trim()}` : null,
    "I will send/share the photos.",
  ].filter(Boolean).join("\n");
}

export function frameOrderMessage(slots: PhotoSlot[], frame: FrameStyle, border: string, note: string) {
  return [
    "Hi Drucka, I want to order Custom Photo Frames.",
    `Images: ${slots.length} uploaded photo${slots.length > 1 ? "s" : ""}`,
    `Frame Style: ${frame.name}`,
    `Border/Matting: ${border}`,
    photoLines(slots),
    note.trim() ? `Note: ${note.trim()}` : null,
    "I will send/share the photos.",
  ].filter(Boolean).join("\n");
}
