/* Single source of truth for client-side upload validation.
   Every editor (Designer, CollageMaker, CollageEditor, PhotoFrameCustomizer,
   MiniPrints) must call validateUpload() before reading a user file. */

export const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/svg+xml",
];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/* iPhones report .heif as image/heif, and some browsers give HEIC files an
   empty MIME type — fall back to the extension so those uploads keep working */
const TYPE_ALIASES = ["image/heif"];
const EXT_FALLBACK = /\.(png|jpe?g|webp|heic|heif|svg)$/i;

/* inline SVG can carry XSS payloads — reject scripts, event handlers
   (onload=, onclick=, …) and javascript: URLs outright */
const SVG_BLOCKLIST = [/<script\b/i, /\bon\w+\s*=/i, /javascript:/i];

const mb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export async function validateUpload(file) {
  if (!file) return { valid: false, errors: ["No file selected"] };
  const errors = [];

  const typeOk =
    ALLOWED_TYPES.includes(file.type) ||
    TYPE_ALIASES.includes(file.type) ||
    (!file.type && EXT_FALLBACK.test(file.name || ""));
  if (!typeOk) {
    errors.push(`Unsupported file type "${file.type || "unknown"}" — please use PNG, JPG, WEBP, HEIC or SVG`);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    errors.push(`File is ${mb(file.size)} — maximum allowed is ${mb(MAX_UPLOAD_BYTES)}`);
  }

  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
  if (!errors.length && isSvg) {
    const text = await file.text();
    if (SVG_BLOCKLIST.some((re) => re.test(text))) {
      errors.push("SVG contains a script, event handler or javascript: URL and was rejected for safety");
    }
  }

  return { valid: errors.length === 0, errors };
}
