/* Qikink auth + fetch helper — SERVER ONLY.
   Credentials come from Vercel env vars, never from the browser.
   ⚠ Confirm exact endpoint paths/headers in your Qikink dashboard docs. */

const BASES = {
  sandbox: "https://sandbox.qikink.com",
  live: "https://api.qikink.com",
};

export const qikinkBase = () =>
  BASES[process.env.QIKINK_MODE === "live" ? "live" : "sandbox"];

let cachedToken = null; // { accessToken, expiresAt } — survives warm invocations

export async function qikinkToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }
  const res = await fetch(`${qikinkBase()}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ClientId: process.env.QIKINK_CLIENT_ID,
      client_secret: process.env.QIKINK_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Qikink auth failed (${res.status}): ${await res.text()}`);
  const data = await res.json(); // { Accesstoken, expires_in }
  cachedToken = {
    accessToken: data.Accesstoken,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return cachedToken.accessToken;
}

/* Qikink print-method name → numeric print_type_id.
   Verified shapes: 1=DTG, 2=All-over, 3=Embroidery, 5=Accessories/Sublimation,
   6=Puff, 7=Glow, 17=DTF. Confirm the exact id against each Qikink product. */
const PRINT_TYPE_ID = {
  dtg: 1, "all over": 2, "all-over": 2, allover: 2, embroidery: 3,
  accessories: 5, sublimation: 5, puff: 6, glow: 7, dtf: 17,
};
const printTypeId = (li) =>
  Number.isFinite(li.print_type_id)
    ? li.print_type_id
    : (PRINT_TYPE_ID[String(li.print_type ?? "").trim().toLowerCase()] ?? 1);

/* placement label → Qikink placement_sku (front print = "fr" in the proven recipe) */
const PLACEMENT_SKU = { front: "fr", center: "fr", back: "bk", "left chest": "lc", "right chest": "rc" };
const placementSku = (p) => PLACEMENT_SKU[String(p ?? "").trim().toLowerCase()] ?? "fr";

const alnum = (s) => String(s ?? "").replace(/[^a-zA-Z0-9]/g, "");

/* Coerce any order payload into the EXACT shape Qikink's /api/order/create
   accepts. Qikink 400s on unknown keys, so this is a strict whitelist +
   rename, not a merge. Both create paths (admin "Send to Qikink" and the
   webhook auto-send) flow through qikinkFetch, so sanitizing here fixes both. */
export function toQikinkOrderPayload(p = {}) {
  const out = {
    order_number: alnum(p.order_number), // ALPHANUMERIC only — no dashes
    gateway: p.gateway,
    total_order_value: p.total_order_value,
    qikink_shipping: p.qikink_shipping,
    line_items: (p.line_items ?? []).map((li) => {
      const seller = Number(li.search_from_my_products) === 1;
      const item = {
        search_from_my_products: seller ? 1 : 0,
        sku: li.sku,
        quantity: li.quantity,
        price: li.price,
      };
      // Seller products: Qikink wants NO print_type_id and NO designs.
      if (seller) return item;
      item.print_type_id = printTypeId(li);
      item.designs = (li.designs ?? [])
        .filter((d) => d && d.design_link)
        .map((d) => ({
          design_code: alnum(d.design_code ?? d.placement ?? "design") || "design",
          width_inches: d.width_inches ?? 11,
          height_inches: d.height_inches ?? 14,
          placement_sku: d.placement_sku ?? placementSku(d.placement),
          design_link: d.design_link,
          ...(d.mockup_link ? { mockup_link: d.mockup_link } : {}),
        }));
      return item;
    }),
    shipping_address: p.shipping_address,
  };
  return out;
}

export async function qikinkFetch(path, { method = "GET", body } = {}) {
  const token = await qikinkToken();
  const payload = path === "/api/order/create" ? toQikinkOrderPayload(body) : body;
  if (path === "/api/order/create")
    console.log("Qikink Payload:", JSON.stringify(payload, null, 2));
  const res = await fetch(`${qikinkBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ClientId: process.env.QIKINK_CLIENT_ID,
      Accesstoken: token,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  console.log(`Qikink ${path} → ${res.status}:`, text);
  if (!res.ok) throw new Error(`Qikink ${path} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}
