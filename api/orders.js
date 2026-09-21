/* /api/orders — Supabase-backed order store.
   POST  : create/upsert order (public — customer checkout)
   PATCH : update order. Everything needs x-admin-secret EXCEPT one narrow
           customer action: "I've paid" (a payment CLAIM). A customer can move
           their own order from "Payment Pending" to "Payment Claimed", proving
           ownership with the phone number on the order. They can never set
           "Paid": that comes from the admin (after checking the payment) or the
           Razorpay webhook.
   GET   : list orders (admin only). */
import { sb, orderToRow, rowToOrder } from "./_lib/supabase.js";
import { sendCapiEvent } from "./_lib/capi.js";
import { withCors } from "./_lib/cors.js";
import { isAdmin } from "./_lib/adminAuth.js";


/* what a customer's "I've paid" records: a claim awaiting the team's check, not a payment */
const CLAIMED = "Payment Claimed";

async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const o = req.body;
      if (!o?.id || !o?.customer?.name || !Array.isArray(o.items) || !o.items.length)
        return res.status(400).json({ ok: false, error: "Invalid order" });
      if (!/^\d{6}$/.test(o.customer.pincode ?? ""))
        return res.status(400).json({ ok: false, error: "Invalid pincode" });
      if (!/^\d{10}$/.test((o.customer.phone ?? "").replace(/\D/g, "").slice(-10)))
        return res.status(400).json({ ok: false, error: "Invalid phone" });
      await sb("orders?on_conflict=id", {
        method: "POST",
        body: orderToRow(o),
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      });
      /* Meta CAPI — COD orders have no payment webhook, so send a reliable
         server-side InitiateCheckout at placement (Purchase follows only on
         delivery). event_id matches the browser InitiateCheckout so Meta
         deduplicates. Awaited: Vercel freezes the function right after
         res.json(), which kills un-awaited fetches. sendCapiEvent never
         rejects, so this can delay the response slightly but never fail
         the order. */
      if (o.paymentMode === "cod") {
        const eventId = o.customer?._tracking?.checkoutId ?? `checkout_${o.id}`;
        const r = await sendCapiEvent({ eventName: "InitiateCheckout", eventId, order: o });
        if (!r.ok) console.warn(`CAPI InitiateCheckout failed for ${o.id}:`, r.error);
      }
      return res.json({ ok: true, id: o.id });
    }

    if (req.method === "PATCH") {
      const { id, patch, phone } = req.body ?? {};
      if (!id || !patch || typeof patch !== "object")
        return res.status(400).json({ ok: false, error: "id and patch required" });

      if (isAdmin(req)) {
        await sb(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
        return res.json({ ok: true });
      }

      /* Not an admin: the only thing allowed is a payment claim. Anything else,
         including the old customer request { payment_status: "Paid" }, is refused
         before the database is touched. */
      const keys = Object.keys(patch);
      const isClaim = keys.length === 1 && keys[0] === "payment_status" && patch.payment_status === CLAIMED;
      if (!isClaim) return res.status(401).json({ ok: false, error: "Admin secret required" });

      const last10 = (v) => String(v ?? "").replace(/\D/g, "").slice(-10);
      if (last10(phone).length !== 10) return res.status(400).json({ ok: false, error: "phone required" });
      const rows = await sb(`orders?id=eq.${encodeURIComponent(id)}&select=payment_status,customer`);
      const row = rows?.[0];
      /* same answer for "no such order" and "not your order": do not confirm which ids exist */
      if (!row || last10(row.customer?.phone) !== last10(phone))
        return res.status(403).json({ ok: false, error: "Order not found for this phone number" });
      /* only ever Pending -> Claimed. The filter is in the UPDATE itself, so a claim
         cannot overwrite a status the admin set a moment earlier (Paid, COD Approved…) */
      if (row.payment_status !== "Payment Pending")
        return res.status(409).json({ ok: false, error: `Order is already "${row.payment_status}"` });
      await sb(`orders?id=eq.${encodeURIComponent(id)}&payment_status=eq.${encodeURIComponent("Payment Pending")}`, {
        method: "PATCH", body: { payment_status: CLAIMED },
      });
      return res.json({ ok: true, payment_status: CLAIMED });
    }

    if (req.method === "GET") {
      if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Admin secret required" });
      const rows = await sb("orders?order=created_at.desc&limit=200");
      return res.json({ ok: true, orders: rows.map(rowToOrder) });
    }

    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
