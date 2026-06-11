/* POST /api/razorpay/create-order — { orderId }
   Creates a Razorpay order for an EXISTING Drucka order. The amount is
   read from Supabase (never trusted from the client). Returns only the
   public key_id — the key secret stays server-side. */
import { rzpCreateOrder } from "../_lib/razorpay.js";
import { sb } from "../_lib/supabase.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    const { orderId } = req.body ?? {};
    if (!orderId) return res.status(400).json({ ok: false, error: "orderId required" });

    const rows = await sb(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,total,payment_status,customer`);
    const order = rows?.[0];
    if (!order) return res.status(404).json({ ok: false, error: "Order not found — checkout again" });
    if (order.payment_status === "Paid")
      return res.status(409).json({ ok: false, error: "Order already paid" });

    const rzp = await rzpCreateOrder(order.total * 100, order.id, { drucka_order_id: order.id });
    await sb(`orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      body: { razorpay_order_id: rzp.id },
    });

    res.json({
      ok: true,
      razorpayOrderId: rzp.id,
      amount: rzp.amount,
      currency: rzp.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public by design
      name: "Drucka",
      description: `Drucka order ${order.id}`,
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
