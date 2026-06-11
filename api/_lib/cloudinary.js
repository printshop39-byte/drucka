/* Cloudinary signed upload — SERVER ONLY (API secret never leaves here).
   Uses the raw REST API + SHA-1 signature, so no SDK dependency. */
import crypto from "node:crypto";

export async function uploadDataUrl(dataUrl, publicIdHint = "artwork") {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !secret) throw new Error("Cloudinary env vars not configured");

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "drucka-artwork";
  const public_id = `${publicIdHint}-${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, "");
  // params to sign must be alphabetical: folder, public_id, timestamp
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${secret}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", dataUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", public_id);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.secure_url; // permanent public URL for Qikink
}
