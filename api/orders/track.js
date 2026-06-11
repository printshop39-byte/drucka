/* GET /api/orders/track?id=DRK-xxxx&phone=98xxxxxxxx
   Public customer tracking — authenticated by order ID + phone match
   (both must be known to the customer). Returns a SANITIZED view only:
   no address, no artwork, no payment internals. */
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  try {
    const id = String(req.query.id ?? "").trim().toUpperCase();
    const phone = String(req.query.phone ?? "").replace(/\D/g, "").slice(-10);
    if (!/^DRK-[A-Z0-9]+$/.test(id) || !/^\d{10}$/.test(phone))
      return res.status(400).json({ ok: false, error: "Order ID and 10-digit phone required" });

    const rows = await sb(`orders?id=eq.${encodeURIComponent(id)}&select=*`);
    const row = rows?.[0];
    const rowPhone = String(row?.customer?.phone ?? "").replace(/\D/g, "").slice(-10);
    // identical error for not-found vs phone-mismatch (no order-ID probing)
    if (!row || rowPhone !== phone)
      return res.status(404).json({ ok: false, error: "No order found for this ID + phone" });

    res.json({
      ok: true,
      order: {
        id: row.id,
        createdAt: row.created_at,
        items: (row.items ?? []).map((i) => ({ name: i.name, qty: i.qty, size: i.size, color: i.color })),
        total: row.total,
        paymentStatus: row.payment_status,
        status: row.qikink_status === "Draft" ? "Order received" : row.qikink_status,
        tracking: row.tracking_number ?? null,
        courier: row.courier ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
