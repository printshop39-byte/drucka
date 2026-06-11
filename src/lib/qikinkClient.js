/* Thin fetch wrappers for the Drucka backend (Vercel api/ routes).
   NO secrets here — the browser only ever talks to OUR endpoints.
   The admin key authorizes admin-only routes and lives in
   sessionStorage (cleared when the tab closes). */

/* API base URL — empty = same origin (Vercel hosts frontend + api/).
   When the frontend is hosted elsewhere (e.g. Hostinger) set
   VITE_API_BASE_URL=https://your-project.vercel.app at BUILD time.
   This is a public URL, safe to bundle — never put secrets in VITE_ vars. */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
export const apiFetch = (path, opts) => fetch(`${API_BASE}${path}`, opts);

const jsonOrThrow = async (res) => {
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.ok === false) throw new Error(data?.error ?? `${res.status} ${res.statusText}`);
  return data;
};

export const setAdminKey = (key) => {
  try {
    key ? sessionStorage.setItem("drucka-admin-key", key) : sessionStorage.removeItem("drucka-admin-key");
  } catch { /* private mode */ }
};
export const getAdminKey = () => {
  try { return sessionStorage.getItem("drucka-admin-key") ?? ""; } catch { return ""; }
};
const adminHeaders = () => (getAdminKey() ? { "x-admin-secret": getAdminKey() } : {});

export const qikinkApi = {
  /* admin "Test connection" — backend checks creds with Qikink */
  testConnection: () =>
    apiFetch("/api/qikink/token", { method: "POST" }).then(jsonOrThrow),

  /* upload one artwork data-URL → { url } (Cloudinary, server-signed) */
  uploadArtwork: (dataUrl, orderId, layerId) =>
    apiFetch("/api/upload-artwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, orderId, layerId }),
    }).then(jsonOrThrow),

  /* send the prepared payload → { qikinkOrderId } */
  createOrder: (payload) =>
    apiFetch("/api/qikink/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(jsonOrThrow),

  /* poll Qikink production/shipping status → { druckaStatus, tracking } */
  orderStatus: (qikinkOrderId, druckaOrderId) =>
    apiFetch(`/api/qikink/order-status?id=${encodeURIComponent(qikinkOrderId)}&drucka=${encodeURIComponent(druckaOrderId ?? "")}`)
      .then(jsonOrThrow),

  /* Supabase-backed order store */
  saveOrder: (order) =>
    apiFetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).then(jsonOrThrow),

  patchOrder: (id, patch) =>
    apiFetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ id, patch }),
    }).then(jsonOrThrow),

  listOrders: () =>
    apiFetch("/api/orders", { headers: adminHeaders() }).then(jsonOrThrow),

  /* customer tracking — order ID + phone, sanitized response */
  trackOrder: (id, phone) =>
    apiFetch(`/api/orders/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`)
      .then(jsonOrThrow),

  /* Qikink product mapping (GET public, PUT admin) */
  getProductMap: () => fetch("/api/admin/product-map").then(jsonOrThrow),
  saveProductMap: (map) =>
    apiFetch("/api/admin/product-map", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...adminHeaders() },
      body: JSON.stringify({ map }),
    }).then(jsonOrThrow),
};
