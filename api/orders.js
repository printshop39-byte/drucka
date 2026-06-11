/* /api/orders — Supabase-backed order store.
   POST  : create/upsert order (public — customer checkout)
   PATCH : update order. Customers may only self-mark payment_status="Paid"
           (verified by your team); everything else needs x-admin-secret.
   GET   : list orders (admin only). */
import { sb, orderToRow, rowToOrder } from "./_lib/supabase.js";
import { withCors } from "./_lib/cors.js";

const isAdmin = (req) =>
  !!process.env.ADMIN_SECRET && req.headers["x-admin-secret"] === process.env.ADMIN_SECRET;

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
      return res.json({ ok: true, id: o.id });
    }

    if (req.method === "PATCH") {
      const { id, patch } = req.body ?? {};
      if (!id || !patch || typeof patch !== "object")
        return res.status(400).json({ ok: false, error: "id and patch required" });
      const keys = Object.keys(patch);
      const selfServePaid = keys.length === 1 && keys[0] === "payment_status" && patch.payment_status === "Paid";
      if (!selfServePaid && !isAdmin(req))
        return res.status(401).json({ ok: false, error: "Admin secret required" });
      await sb(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
      return res.json({ ok: true });
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
