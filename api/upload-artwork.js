/* POST /api/upload-artwork — { dataUrl, orderId, layerId }
   Uploads customer artwork (data-URL from the editor) to Cloudinary and
   returns a permanent public URL for Qikink. Secrets stay server-side.

   PUBLIC on purpose: the photo-frame customizer calls it from the customer's
   browser before any order exists, so it cannot require the admin secret.
   Because anyone can reach it, it is limited instead of authenticated:
     - the file must really BE the image type it claims (magic bytes), not just
       start with a data:image/... label
     - size cap, and a short cap on the id fields that end up in the file name
     - a per-client rate limit (best effort, see _lib/rateLimit.js)
   None of that makes it private. Uploads are public URLs by design. */
import { uploadDataUrl } from "./_lib/cloudinary.js";
import { withCors } from "./_lib/cors.js";
import { allow, clientIp } from "./_lib/rateLimit.js";

/* a 4-photo frame order uploads 4 files, and a retry doubles that */
const LIMIT = 40;
const WINDOW_MS = 10 * 60 * 1000;

const MAGIC = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  gif: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  webp: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
};

/* the declared type must match the bytes: a script or HTML renamed image/png is refused */
export function imageMatchesDeclaredType(dataUrl) {
  const m = /^data:image\/(jpe?g|png|webp|gif);base64,/i.exec(dataUrl);
  if (!m) return false;
  const head = Buffer.from(dataUrl.slice(m[0].length, m[0].length + 32), "base64");
  return head.length >= 12 && !!MAGIC[m[1].toLowerCase()]?.(head);
}

const idField = (v, fallback) => String(v ?? fallback).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || fallback;

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!allow(`upload:${clientIp(req)}`, LIMIT, WINDOW_MS))
    return res.status(429).json({ ok: false, error: "Too many uploads — please wait a few minutes and try again" });
  try {
    const { dataUrl, orderId, layerId } = req.body ?? {};
    // Allowlist safe raster types only — NOT svg (script-carrying / XSS vector).
    if (typeof dataUrl !== "string" || !/^data:image\/(jpe?g|png|webp|gif);base64,/i.test(dataUrl))
      return res.status(400).json({ ok: false, error: "Only JPG, PNG, WebP or GIF artwork is allowed" });
    if (dataUrl.length > 8_000_000)
      return res.status(413).json({ ok: false, error: "Artwork too large — keep under ~6 MB" });
    if (!imageMatchesDeclaredType(dataUrl))
      return res.status(400).json({ ok: false, error: "That file is not a valid image" });
    const url = await uploadDataUrl(dataUrl, `${idField(orderId, "order")}-${idField(layerId, "art")}`);
    res.json({ ok: true, url });
  } catch (err) {
    /* the upstream message can carry Cloudinary account detail — keep it in
       the server log, not in a public response */
    console.error("upload-artwork failed:", err.message);
    res.status(502).json({ ok: false, error: "Upload failed — please try again" });
  }
}

export default withCors(handler);
