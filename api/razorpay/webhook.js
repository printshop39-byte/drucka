/* POST /api/razorpay/webhook — configure in Razorpay Dashboard →
   Webhooks → URL https://<your-domain>/api/razorpay/webhook,
   events: payment.captured (and order.paid), secret = RAZORPAY_WEBHOOK_SECRET.

   Verifies the signature over the RAW body, marks the order Paid, and
   (if AUTO_SEND_ON_PAID=true) sends it straight to Qikink fulfillment.
   This is the AUTHORITATIVE payment confirmation — the frontend's
   optimistic "Paid" is just UX. */
import { verifyWebhookSignature } from "../_lib/razorpay.js";
import { sb, rowToOrder } from "../_lib/supabase.js";
import { sendCapiEvent } from "../_lib/capi.js";
import { withCors } from "../_lib/cors.js";
import { logEvent, EVENTS } from "../_lib/events.js";

// Disable body parsing — the signature is computed over the raw bytes.
export const config = { api: { bodyParser: false } };

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    const raw = await readRawBody(req);
    if (!verifyWebhookSignature(raw, req.headers["x-razorpay-signature"]))
      return res.status(401).json({ ok: false, error: "Invalid signature" });

    const event = JSON.parse(raw);
    if (!["payment.captured", "order.paid"].includes(event.event))
      return res.json({ ok: true, ignored: event.event }); // ack other events

    const payment = event.payload?.payment?.entity ?? {};
    const druckaOrderId =
      payment.notes?.drucka_order_id ??
      // fallback: look up by razorpay_order_id
      (await sb(`orders?razorpay_order_id=eq.${encodeURIComponent(payment.order_id ?? "")}&select=id`))?.[0]?.id;
    if (!druckaOrderId) return res.status(404).json({ ok: false, error: "Drucka order not found" });

    // Authoritative payment confirmation + enqueue for fulfilment, in ONE atomic
    // PATCH. Gated on qikink_status="Draft" so a duplicate/late webhook delivery
    // can never reset an already-enqueued/sent order back to "Ready" (which would
    // risk a re-send). First delivery: Draft → Paid + Ready. Re-delivery: 0 rows,
    // so payment recording, CAPI, and enqueue all no-op — idempotent.
    const [updated] =
      (await sb(`orders?id=eq.${encodeURIComponent(druckaOrderId)}&qikink_status=eq.Draft`, {
        method: "PATCH",
        body: {
          payment_status: "Paid",
          razorpay_payment_id: payment.id ?? null,
          paid_at: new Date().toISOString(),
          qikink_status: "Ready",
          next_retry_at: new Date().toISOString(),
        },
      })) ?? [];

    /* Meta Conversions API — authoritative server-side Purchase. Uses the
       SAME event_id as the browser pixel (purchase_<orderId>) so Meta
       deduplicates the pair. Best-effort: a Meta hiccup must never break a
       confirmed payment or its fulfilment. */
    try {
      const order = updated ? rowToOrder(updated) : null;
      if (order) {
        const r = await sendCapiEvent({
          eventName: "Purchase",
          eventId: `purchase_${druckaOrderId}`,
          order,
        });
        if (!r.ok) console.warn(`CAPI Purchase failed for ${druckaOrderId}:`, r.error);
      }
    } catch (err) {
      console.warn(`CAPI Purchase error for ${druckaOrderId}:`, err.message);
    }

    // Paid → enqueued as "Ready". The cron drain (and Phase-5 background kick)
    // send it to Qikink via the idempotent fulfillFromDb(). The webhook never
    // calls Qikink directly, so a slow Qikink can't hold up the payment ack.
    if (updated) await logEvent(druckaOrderId, EVENTS.FULFILLMENT_QUEUED, { via: "payment" });
    res.json({ ok: true, paid: true, queued: !!updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
