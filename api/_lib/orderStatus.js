/* Shared order-status sync — used by both the on-demand endpoint
   (api/qikink/order-status.js) and the Vercel Cron sweep
   (api/cron/poll-orders.js), so the polling + status-mapping + COD
   Purchase logic lives in exactly one place. */
import { qikinkFetch } from "./qikink.js";
import { sb, rowToOrder } from "./supabase.js";
import { sendCapiEvent } from "./capi.js";

const STATUS_MAP = {
  pending: "Sent to Qikink",
  confirmed: "Sent to Qikink",
  in_production: "In Production",
  printed: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Failed",
};

/* Local statuses that are still "in flight" — worth polling. Draft (not yet
   sent) and the terminal Delivered/Failed are excluded. */
export const IN_FLIGHT = ["Sent to Qikink", "In Production", "Shipped"];

/* Poll one order, persist the new status/tracking, and — for a COD order
   that has JUST been delivered — fire the server-side Purchase exactly once.
   Returns { druckaStatus, tracking, courier }. Throws only on a Qikink error;
   Supabase/CAPI failures are best-effort and logged. */
export async function syncOrderStatus({ qikinkOrderId, druckaOrderId }) {
  /* Qikink has no /api/order/status route — it 404s with "Can't find a route
     for 'get: api/order/status'", which is why the admin's ⟳ Status button and
     the nightly poll-orders sweep never once updated a tracking number.
     Retrieving one order is GET /api/order?id=<id>, per Qikink's API reference. */
  const raw = await qikinkFetch(`/api/order?id=${encodeURIComponent(qikinkOrderId)}`);
  /* that endpoint answers with the order, or with a list containing it */
  const data = Array.isArray(raw) ? (raw[0] ?? {}) : (raw?.data ?? raw ?? {});

  const druckaStatus = STATUS_MAP[String(data.status ?? data.order_status ?? "").toLowerCase()] ?? "Sent to Qikink";
  const tracking = data.tracking_number ?? data.awb ?? data.awb_number ?? null;
  const courier = data.courier ?? data.courier_partner ?? data.courier_name ?? null;

  if (druckaOrderId) {
    // Read prior state first so we can detect the FIRST flip into Delivered.
    const [prev] =
      (await sb(`orders?id=eq.${encodeURIComponent(druckaOrderId)}&select=id,qikink_status,payment_mode,customer,items,total`).catch(() => [])) ?? [];

    await sb(`orders?id=eq.${encodeURIComponent(druckaOrderId)}`, {
      method: "PATCH",
      body: { qikink_status: druckaStatus, tracking_number: tracking, courier },
    }).catch((e) => console.error("Supabase save failed:", e.message));

    /* Meta CAPI — a COD order becomes a real Purchase only when DELIVERED
       (cash collected). Fire once, on the first flip into Delivered, for COD
       only (prepaid already fired its Purchase at the Razorpay webhook).
       event_id purchase_<id> also dedups against any earlier signal. */
    if (druckaStatus === "Delivered" && prev && prev.qikink_status !== "Delivered" && prev.payment_mode === "cod") {
      const order = rowToOrder({ ...prev, qikink_status: druckaStatus });
      // Awaited: Vercel freezes the function after the response is sent,
      // killing un-awaited fetches — this Purchase must not be lost.
      // sendCapiEvent never rejects, so a Meta hiccup can't abort the sync.
      const r = await sendCapiEvent({ eventName: "Purchase", eventId: `purchase_${druckaOrderId}`, order });
      if (!r.ok) console.warn(`CAPI COD Purchase failed for ${druckaOrderId}:`, r.error);
      // mark cash collected so admin sees it (and we never re-fire)
      await sb(`orders?id=eq.${encodeURIComponent(druckaOrderId)}`, {
        method: "PATCH",
        body: { payment_status: "Paid", paid_at: new Date().toISOString() },
      }).catch((e) => console.error("COD paid mark failed:", e.message));
    }
  }

  return { druckaStatus, tracking, courier };
}
