/* Razorpay checkout — browser side. Only ever touches the PUBLIC key_id
   (returned by our backend); the key secret + webhook secret stay on
   Vercel. Throws on failure so callers can fall back to manual UPI/COD. */
import { apiFetch } from "./qikinkClient";

let scriptPromise = null;
const loadRazorpayScript = () =>
  (scriptPromise ??= new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Razorpay failed to load — check connection"));
    };
    document.head.appendChild(s);
  }));

export async function payWithRazorpay(order) {
  // 1. backend creates the Razorpay order (amount comes from Supabase)
  const res = await apiFetch("/api/razorpay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: order.id }),
  });
  const init = await res.json().catch(() => null);
  if (!res.ok || init?.ok === false) throw new Error(init?.error ?? "Payment service unavailable");

  // 2. open the Razorpay modal
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: init.keyId,
      order_id: init.razorpayOrderId,
      amount: init.amount,
      currency: init.currency,
      name: "Drucka",
      description: init.description,
      notes: { drucka_order_id: order.id },
      prefill: {
        name: order.customer?.name ?? "",
        contact: order.customer?.phone ?? "",
        email: order.customer?.email ?? "",
      },
      theme: { color: "#5b21b6" },
      // success here is OPTIMISTIC UX — the webhook is the authority
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r?.error?.description ?? "Payment failed")));
    rzp.open();
  });
}
