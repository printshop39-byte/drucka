/* Supabase PostgREST helper — SERVER ONLY (uses the service-role key,
   which bypasses RLS; never ship it to the browser). No SDK needed. */

export async function sb(path, { method = "GET", body, headers = {} } = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/* DB row (snake_case) ⇆ frontend order (camelCase) */
export const orderToRow = (o) => ({
  id: o.id,
  customer: o.customer,
  items: o.items,
  total: o.total,
  payment_mode: o.paymentMode,
  payment_status: o.paymentStatus,
  qikink_status: o.qikinkStatus ?? "Draft",
  qikink_order_id: o.qikinkOrderId ?? null,
  tracking_number: o.tracking ?? null,
  notes: o.customer?.notes ?? null,
});

/* The row for a brand-new order. Customer-controlled fields come from the
   request; everything about payment and fulfilment is set HERE, whatever the
   client sent. A new order is never Paid, never approved and never already sent
   to Qikink: it starts unverified, and only the admin, the Razorpay webhook or
   the customer's own claim (PATCH) move it on.
   Prepaid starts "Payment Pending"; COD starts "COD Pending Approval", which is
   the same "not yet verified" state the admin's Approve COD button acts on. */
export function newOrderRow(o) {
  return {
    ...orderToRow(o),
    payment_status: o.paymentMode === "cod" ? "COD Pending Approval" : "Payment Pending",
    qikink_status: "Draft",
    qikink_order_id: null,
    tracking_number: null,
  };
}

export const rowToOrder = (r) => ({
  id: r.id,
  createdAt: r.created_at,
  customer: r.customer,
  items: r.items,
  total: r.total,
  paymentMode: r.payment_mode,
  paymentStatus: r.payment_status,
  qikinkStatus: r.qikink_status,
  qikinkOrderId: r.qikink_order_id,
  tracking: r.tracking_number,
  courier: r.courier,
  lastError: r.last_error,
});
