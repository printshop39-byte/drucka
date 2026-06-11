/* POST /api/qikink/create-order — body: payload from buildQikinkOrderPayload()
   with design_link fields already replaced by Cloudinary URLs (frontend calls
   /api/upload-artwork first). Re-validates, creates the Qikink order, and
   saves the Qikink order ID back to Supabase. */
import { qikinkFetch } from "../_lib/qikink.js";
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    const payload = req.body;
    if (!payload?.order_number || !payload?.line_items?.length)
      return res.status(400).json({ ok: false, error: "Invalid payload" });

    // ── server-side re-validation (never trust the browser) ──
    const addr = payload.shipping_address ?? {};
    if (!/^\d{6}$/.test(addr.zip ?? ""))
      return res.status(400).json({ ok: false, error: "Invalid pincode" });
    if (!/^\d{10}$/.test((addr.phone ?? "").replace(/\D/g, "").slice(-10)))
      return res.status(400).json({ ok: false, error: "Invalid phone" });
    if (payload.gateway !== "COD" && payload.payment_status !== "Paid")
      return res.status(402).json({ ok: false, error: "Order is not paid" });
    for (const li of payload.line_items) {
      if ((li.sku ?? "").startsWith("UNMAPPED"))
        return res.status(400).json({ ok: false, error: `Unmapped product SKU: ${li.sku}` });
      for (const d of li.designs ?? []) {
        if (!/^https?:\/\//.test(d.design_link ?? ""))
          return res.status(400).json({ ok: false, error: "Artwork not uploaded — design_link must be a public URL" });
      }
    }

    // ── create the order at Qikink ──
    const result = await qikinkFetch("/api/order/create", { method: "POST", body: payload });
    const qikinkOrderId = String(result.order_id ?? result.id ?? "");
    if (!qikinkOrderId) throw new Error(`Qikink returned no order id: ${JSON.stringify(result)}`);

    // ── persist Drucka order ↔ Qikink order in Supabase (best effort) ──
    await sb(`orders?id=eq.${encodeURIComponent(payload.order_number)}`, {
      method: "PATCH",
      body: {
        qikink_order_id: qikinkOrderId,
        qikink_status: "Sent to Qikink",
        artwork_urls: payload.line_items.flatMap((li) => (li.designs ?? []).map((d) => d.design_link)),
      },
    }).catch((e) => console.error("Supabase save failed:", e.message));

    res.json({ ok: true, qikinkOrderId });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
