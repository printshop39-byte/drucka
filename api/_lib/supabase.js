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
