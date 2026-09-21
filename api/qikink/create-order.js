/* POST /api/qikink/create-order — body: payload from buildQikinkOrderPayload()
   with design_link fields already replaced by Cloudinary URLs (frontend calls
   /api/upload-artwork first). Re-validates, creates the Qikink order, and
   saves the Qikink order ID back to Supabase.

   ADMIN ONLY (x-admin-secret). This route creates a real, billable Qikink
   order, and the browser payload is otherwise trusted: it names the SKU, the
   address and even gateway "COD", which skips the paid check below. Left open,
   anyone who found the URL could place orders against Drucka's Qikink account.
   The only legitimate caller is staff pressing "Send to Qikink" in the admin. */
import { qikinkFetch } from "../_lib/qikink.js";
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";
import { isAdmin } from "../_lib/adminAuth.js";

/* payment statuses that mean the money (or the COD approval) has been checked by Drucka or Razorpay */
const VERIFIED = ["Paid", "COD Approved"];

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  /* before anything else — no body parsing, no database read, no Qikink call */
  if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Admin secret required" });
  try {
    const payload = req.body;
    if (!payload?.order_number || !payload?.line_items?.length)
      return res.status(400).json({ ok: false, error: "Invalid payload" });

    // ── idempotency: never double-create at Qikink ──
    // A repeated "Retry send" (or a network retry) must not spawn a second
    // Qikink order. If this order already carries a Qikink id, return it.
    try {
      const rows = await sb(`orders?id=eq.${encodeURIComponent(payload.order_number)}&select=qikink_order_id,payment_status`);
      const existing = rows?.[0]?.qikink_order_id;
      if (existing) return res.json({ ok: true, qikinkOrderId: existing, alreadySent: true });
      /* The stored status is the truth, not the browser's payload. Only a verified
         payment ("Paid": admin or Razorpay webhook) or an approved COD may reach
         Qikink. A customer's "Payment Claimed" and a COD still awaiting approval
         may not, whatever the payload says. */
      const stored = rows?.[0]?.payment_status;
      if (stored && !VERIFIED.includes(stored))
        return res.status(402).json({ ok: false, error: `Payment not verified (order is "${stored}")` });
    } catch (e) {
      console.error("Idempotency check failed (continuing):", e.message);
    }

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
