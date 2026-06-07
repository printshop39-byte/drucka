// lib/uploadDesign.ts
//
// Uploads a user's custom design image to Cloudinary (UNSIGNED upload) and
// returns a public URL that can be shared (e.g. in the WhatsApp order message).
//
// HOW IMAGES WORK IN DRUCKA
// -------------------------
// - Local preview: the customize studio reads the uploaded file as a base64
//   *data URL* and keeps it in React state + localStorage. That data URL renders
//   the live preview and the cart thumbnail. It works offline but is large and
//   cannot be opened by anyone else (you can't paste a 2MB data URL into WhatsApp).
//
// - Shareable URL: we upload the image to Cloudinary, which returns a short
//   public https URL (secure_url). That URL goes into the WhatsApp order message
//   so DRUCKA can actually see the customer's design.
//
// CLOUDINARY UNSIGNED UPLOAD SETUP
// --------------------------------
// 1. Create a free Cloudinary account: https://cloudinary.com
// 2. Dashboard → note your "Cloud name".
// 3. Settings → Upload → Upload presets → "Add upload preset".
//      - Signing Mode: **Unsigned**
//      - (optional) Folder: drucka-designs
//      - Save, and note the preset name.
// 4. Put both values in .env.local (see .env.local.example):
//      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
//      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
//    These are NEXT_PUBLIC_ because the upload happens in the browser. Unsigned
//    presets are designed for client-side uploads and do NOT expose your API secret.
// 5. Restart `npm run dev` after editing env vars.
//
// If env vars are missing or the upload fails, this module degrades gracefully:
// it returns the original data URL with `uploaded: false`, so the cart/preview
// keep working and the WhatsApp message shows a "pending" placeholder instead.

export interface UploadResult {
  /** Public URL if uploaded; otherwise the original data URL (local only). */
  url: string | null;
  /** True only when a real public Cloudinary URL was returned. */
  uploaded: boolean;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = "drucka-designs";

/** Convert a base64 data URL to a Blob for multipart upload. */
function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Upload a design image (base64 data URL) to Cloudinary and return its public URL.
 *
 * - Missing env vars  -> { url: dataUrl, uploaded: false }  (no crash)
 * - Upload error/!ok  -> { url: dataUrl, uploaded: false }  (no crash)
 * - Success           -> { url: secure_url, uploaded: true }
 */
export async function uploadDesignImage(dataUrl: string): Promise<UploadResult> {
  if (!dataUrl) return { url: null, uploaded: false };

  // No Cloudinary configured yet — keep local-only behavior.
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return { url: dataUrl, uploaded: false };
  }

  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return { url: dataUrl, uploaded: false };

  try {
    const form = new FormData();
    form.append("file", blob);
    form.append("upload_preset", UPLOAD_PRESET);
    form.append("folder", FOLDER);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: form }
    );

    if (!res.ok) return { url: dataUrl, uploaded: false };

    const json = await res.json();
    if (json && typeof json.secure_url === "string") {
      return { url: json.secure_url, uploaded: true };
    }
    return { url: dataUrl, uploaded: false };
  } catch {
    // network error, CORS, etc. — never block the user's flow
    return { url: dataUrl, uploaded: false };
  }
}

/**
 * Line for the WhatsApp order message.
 * - Real uploaded public URL -> show it.
 * - Otherwise -> a clear pending placeholder (customer shares the image in chat).
 */
export function designImageLine(publicUrl?: string | null, uploaded?: boolean): string {
  if (uploaded && publicUrl) return `Design Image: ${publicUrl}`;
  return "Design Image: [URL pending upload — customer will share in chat]";
}
