/* GET /api/qikink/order-status?id=<qikinkOrderId>&drucka=<druckaOrderId>
   Polls Qikink, maps the status to Drucka's local statuses, saves the
   tracking number to Supabase when available, returns status + tracking.
   Tip: also call this from a Vercel Cron (e.g. every 30 min) to keep
   Supabase fresh and trigger WhatsApp "shipped" notifications. */
import { qikinkFetch } from "../_lib/qikink.js";
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";

const STATUS_MAP = {
  pending: "Sent to Qikink",
  confirmed: "Sent to Qikink",
  in_production: "In Production",
  printed: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Failed",
};

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  try {
    const { id, drucka } = req.query;
    if (!id) return res.status(400).json({ ok: false, error: "id (Qikink order id) required" });

    const data = await qikinkFetch(`/api/order/status?order_id=${encodeURIComponent(id)}`);
    const druckaStatus = STATUS_MAP[String(data.status ?? "").toLowerCase()] ?? "Sent to Qikink";
    const tracking = data.tracking_number ?? data.awb ?? null;
    const courier = data.courier ?? data.courier_partner ?? null;

    if (drucka) {
      await sb(`orders?id=eq.${encodeURIComponent(drucka)}`, {
        method: "PATCH",
        body: { qikink_status: druckaStatus, tracking_number: tracking, courier },
      }).catch((e) => console.error("Supabase save failed:", e.message));
    }

    res.json({ ok: true, druckaStatus, tracking, courier });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
