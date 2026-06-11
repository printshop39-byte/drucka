/* POST /api/razorpay/webhook — configure in Razorpay Dashboard →
   Webhooks → URL https://<your-domain>/api/razorpay/webhook,
   events: payment.captured (and order.paid), secret = RAZORPAY_WEBHOOK_SECRET.

   Verifies the signature over the RAW body, marks the order Paid, and
   (if AUTO_SEND_ON_PAID=true) sends it straight to Qikink fulfillment.
   This is the AUTHORITATIVE payment confirmation — the frontend's
   optimistic "Paid" is just UX. */
import { verifyWebhookSignature } from "../_lib/razorpay.js";
import { sb } from "../_lib/supabase.js";
import { fulfillFromDb } from "../_lib/fulfill.js";
import { withCors } from "../_lib/cors.js";

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

    await sb(`orders?id=eq.${encodeURIComponent(druckaOrderId)}`, {
      method: "PATCH",
      body: {
        payment_status: "Paid",
        razorpay_payment_id: payment.id ?? null,
        paid_at: new Date().toISOString(),
      },
    });

    // Paid → straight to Qikink (the full automated flow)
    if (process.env.AUTO_SEND_ON_PAID === "true") {
      try {
        const { qikinkOrderId } = await fulfillFromDb(druckaOrderId);
        return res.json({ ok: true, paid: true, qikinkOrderId });
      } catch (err) {
        // payment IS recorded; fulfillment failure is saved to last_error
        // and visible in the admin panel for a manual "Retry send".
        console.error(`Auto-fulfil failed for ${druckaOrderId}:`, err.message);
        return res.json({ ok: true, paid: true, fulfillError: err.message });
      }
    }
    res.json({ ok: true, paid: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
