/* POST /api/orders/approve-cod — body: { id }
   Admin approves a COD order. Atomically moves it into the fulfilment queue:
     payment_status = "COD Approved", qikink_status = "Ready", next_retry_at = now
   and returns immediately. It does NOT call Qikink — the cron drain (and the
   Phase-5 background kick) pick the order up from "Ready". Keeping Qikink out of
   this request means a slow Qikink can never slow approval.

   Idempotent: the transition only matches a COD order still "Queued", so a second
   approval (or a double click) affects 0 rows and cannot re-enqueue or double-send. */
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";
import { logEvent, EVENTS } from "../_lib/events.js";

const enc = encodeURIComponent;
const isAdmin = (req) =>
  !!process.env.ADMIN_SECRET && req.headers["x-admin-secret"] === process.env.ADMIN_SECRET;

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Admin secret required" });
  try {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ ok: false, error: "id required" });

    // Atomic, idempotent approval: only a COD order still "Queued" transitions.
    const nowIso = new Date().toISOString();
    const updated = await sb(
      `orders?id=eq.${enc(id)}&payment_mode=eq.cod&qikink_status=eq.Queued`,
      {
        method: "PATCH",
        body: { payment_status: "COD Approved", qikink_status: "Ready", next_retry_at: nowIso },
      }
    );

    if (!Array.isArray(updated) || updated.length === 0) {
      // Not eligible: already approved, not COD, or unknown. Report truthfully.
      const [cur] =
        (await sb(`orders?id=eq.${enc(id)}&select=id,qikink_status,payment_status,payment_mode`).catch(() => [])) ?? [];
      if (!cur) return res.status(404).json({ ok: false, error: "Order not found" });
      return res.json({ ok: true, alreadyApproved: true, qikink_status: cur.qikink_status });
    }

    await logEvent(id, EVENTS.ORDER_APPROVED, { by: "admin" });
    await logEvent(id, EVENTS.FULFILLMENT_QUEUED, { via: "cod-approval" });
    return res.json({ ok: true, id, qikink_status: "Ready" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
