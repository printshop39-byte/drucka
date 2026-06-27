/* POST /api/upload-artwork — { dataUrl, orderId, layerId }
   Uploads customer artwork (data-URL from the editor) to Cloudinary and
   returns a permanent public URL for Qikink. Secrets stay server-side. */
import { uploadDataUrl } from "./_lib/cloudinary.js";
import { withCors } from "./_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    const { dataUrl, orderId = "order", layerId = "art" } = req.body ?? {};
    // Allowlist safe raster types only — NOT svg (script-carrying / XSS vector).
    if (typeof dataUrl !== "string" || !/^data:image\/(jpe?g|png|webp|gif);base64,/i.test(dataUrl))
      return res.status(400).json({ ok: false, error: "Only JPG, PNG, WebP or GIF artwork is allowed" });
    if (dataUrl.length > 8_000_000)
      return res.status(413).json({ ok: false, error: "Artwork too large — keep under ~6 MB" });
    const url = await uploadDataUrl(dataUrl, `${orderId}-${layerId}`);
    res.json({ ok: true, url });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
