/* GET /api/qikink/order-status?id=<qikinkOrderId>&drucka=<druckaOrderId>
   Polls Qikink, maps the status to Drucka's local statuses, saves the
   tracking number to Supabase when available, returns status + tracking.
   For a scheduled sweep across ALL in-flight orders, see
   /api/cron/poll-orders (both share api/_lib/orderStatus.js). */
import { syncOrderStatus } from "../_lib/orderStatus.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  try {
    const { id, drucka } = req.query;
    if (!id) return res.status(400).json({ ok: false, error: "id (Qikink order id) required" });

    const { druckaStatus, tracking, courier } = await syncOrderStatus({ qikinkOrderId: id, druckaOrderId: drucka });
    res.json({ ok: true, druckaStatus, tracking, courier });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
