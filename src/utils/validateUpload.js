/* Single upload service for every editor. No editor reads a file directly —
   they all call prepareUpload(), which runs the full pipeline:

     MIME check → magic-byte check → size check → SVG sanitize → compress → preview

   validateUpload() exposes the validation half on its own (returns
   {valid, errors}); prepareUpload() validates then downscales and returns a
   ready-to-use preview data URL plus dimensions. */

export const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/svg+xml",
];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/* iPhones report .heif as image/heif; some browsers give HEIC an empty MIME */
const TYPE_ALIASES = ["image/heif"];
const EXT_FALLBACK = /\.(png|jpe?g|webp|heic|heif|svg)$/i;

/* inline SVG can carry XSS payloads — reject scripts, event handlers and
   javascript: URLs outright */
const SVG_BLOCKLIST = [/<script\b/i, /\bon\w+\s*=/i, /javascript:/i];

/* raster formats we accept by *content* (SVG is validated as text below) */
const MAGIC_ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/heic"]);

const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/* sniff the true type from the first bytes — catches a file renamed to a
   different extension (e.g. a script saved as photo.png) */
function sniffType(b) {
  if (!b || b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif"; // detected, not allowed
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp"; // RIFF….WEBP
  if (b[0] === 0x42 && b[1] === 0x4d) return "image/bmp"; // detected, not allowed
  // ISO-BMFF (HEIC/HEIF): "ftyp" box at bytes 4-7, brand at 8-11
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase();
    if (/heic|heix|hevc|heim|heis|hevm|hevs|mif1|msf1|heif/.test(brand)) return "image/heic";
  }
  return null;
}

async function readMagic(file) {
  try {
    if (typeof file.arrayBuffer !== "function" && typeof file.slice !== "function") return null;
    const blob = file.slice ? file.slice(0, 16) : file;
    return new Uint8Array(await blob.arrayBuffer());
  } catch { return null; }
}

export async function validateUpload(file) {
  if (!file) return { valid: false, errors: ["No file selected"] };
  const errors = [];

  // 1 · declared MIME / extension whitelist
  const typeOk =
    ALLOWED_TYPES.includes(file.type) ||
    TYPE_ALIASES.includes(file.type) ||
    (!file.type && EXT_FALLBACK.test(file.name || ""));
  if (!typeOk) errors.push(`Unsupported file type "${file.type || "unknown"}" — please use PNG, JPG, WEBP, HEIC or SVG`);

  // 2 · size
  if (file.size > MAX_UPLOAD_BYTES) errors.push(`File is ${mb(file.size)} — maximum allowed is ${mb(MAX_UPLOAD_BYTES)}`);

  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");

  // 3 · content check (only if nothing already failed, to avoid needless reads)
  if (!errors.length) {
    if (isSvg) {
      const text = await file.text();
      if (!/<svg[\s>]/i.test(text)) errors.push("File does not look like a valid SVG");
      else if (SVG_BLOCKLIST.some((re) => re.test(text)))
        errors.push("SVG contains a script, event handler or javascript: URL and was rejected for safety");
    } else {
      const sniff = sniffType(await readMagic(file));
      if (!sniff) errors.push("File contents don't match a supported image — it may be renamed or corrupt");
      else if (!MAGIC_ALLOWED.has(sniff)) errors.push(`File is actually ${sniff}, which is not allowed`);
    }
  }

  return { valid: errors.length === 0, errors };
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image (unsupported format? HEIC may need converting to JPG)"));
    img.src = src;
  });

/* full pipeline: validate → compress → preview. Returns the ready data URL and
   both preview and ORIGINAL dimensions (originals let the photo customizer keep
   its DPI/print-quality maths). Throws with a user-facing message on rejection. */
export async function prepareUpload(file, { maxDim = 1600, quality = 0.9 } = {}) {
  const { valid, errors } = await validateUpload(file);
  if (!valid) throw new Error(errors.join(" · "));

  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
  if (isSvg) {
    // vectors scale infinitely — sanitised text is served as-is, no raster step
    const text = await file.text();
    const src = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
    return { src, width: 1000, height: 1000, origWidth: 1000, origHeight: 1000, aspect: 1 };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const ow = img.naturalWidth || img.width;
    const oh = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(ow, oh));
    const w = Math.max(1, Math.round(ow * scale));
    const h = Math.max(1, Math.round(oh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    // keep PNG (transparency) for PNG sources; everything else → JPEG
    const outMime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const src = canvas.toDataURL(outMime, quality);
    return { src, width: w, height: h, origWidth: ow, origHeight: oh, aspect: oh / ow };
  } finally {
    URL.revokeObjectURL(url);
  }
}
