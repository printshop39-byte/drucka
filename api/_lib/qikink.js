/* Qikink auth + fetch helper — SERVER ONLY.
   Credentials come from Vercel env vars, never from the browser.
   ⚠ Confirm exact endpoint paths/headers in your Qikink dashboard docs. */

import { createHash, randomBytes } from "node:crypto";

/* Privacy-safe artwork fingerprint: never logs the full (possibly signed)
   artwork URL. Reports only whether it's http, a short stable hash for
   correlation, and the Cloudinary delivery components so a wrong resource_type
   (raw/private) or bad format is obvious at a glance. */
function artworkFingerprint(url) {
  const u = String(url ?? "");
  const fp = {
    is_http: /^https?:\/\//.test(u),
    hash: createHash("sha1").update(u).digest("hex").slice(0, 8),
    cloud: "-", resource: "-", type: "-", format: "-",
  };
  const m = u.match(/res\.cloudinary\.com\/([^/]+)\/([^/]+)\/([^/]+)\//);
  if (m) { fp.cloud = m[1]; fp.resource = m[2]; fp.type = m[3]; }
  const ext = u.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  if (ext) fp.format = ext[1];
  return fp;
}

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
  // Fail loudly on missing creds — otherwise the token endpoint can 200 with an
  // empty body and the real order-create call fails later with a misleading
  // "Invalid AccessToken or Client Id" 401.
  if (!process.env.QIKINK_CLIENT_ID || !process.env.QIKINK_CLIENT_SECRET)
    throw new Error("Qikink credentials missing — set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET in this environment");
  // Make the active mode/endpoint obvious in logs so a sandbox↔live mismatch
  // (wrong creds for the mode) is caught at a glance before it 401s downstream.
  console.log(`Qikink mode=${process.env.QIKINK_MODE === "live" ? "LIVE" : "sandbox"} endpoint=${qikinkBase()}`);
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
  if (!data.Accesstoken)
    throw new Error(`Qikink auth returned no Accesstoken (check ClientId/secret): ${JSON.stringify(data)}`);
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

/* placement → Qikink placement_sku (front print = "fr" in the proven recipe).

   Keyed by the print-area IDS the app sends ("left-pocket") as well as the
   human labels, because only the labels were listed before: a pocket or back
   print fell through to the default and was sent as a front print. Drucka
   calls the chest placements "pocket" where Qikink calls them "chest" — same
   spot on the garment, different word. */
const PLACEMENT_SKU = {
  front: "fr", center: "fr", wrap: "fr",
  back: "bk",
  "left-pocket": "lc", "left pocket": "lc", "left chest": "lc",
  "right-pocket": "rc", "right pocket": "rc", "right chest": "rc",
};
const placementSku = (p) => PLACEMENT_SKU[String(p ?? "").trim().toLowerCase()] ?? "fr";

const alnum = (s) => String(s ?? "").replace(/[^a-zA-Z0-9]/g, "");

/* Qikink SKUs use SHORT colour codes (verified by probing the sandbox
   create endpoint): e.g. MRnHs-Wh-M, not MRnHs-White-M. The app builds SKUs
   with the full colour label/id, so normalise the colour segment here — the
   one choke-point both the admin send and the webhook auto-send flow through.
   Confirmed codes below; extend as new colours are verified. */
const QIKINK_COLOR_CODE = {
  white: "Wh", black: "Bk", navy: "Nb", red: "Rd", yellow: "Yl",
};
const normalizeSku = (sku) =>
  String(sku ?? "")
    .split("-")
    .map((seg) => QIKINK_COLOR_CODE[seg.toLowerCase()] ?? seg)
    .join("-");

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
        sku: normalizeSku(li.sku),
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
          // Qikink's verified example sends these empty; leave "" unless a real
          // print size is provided, so Qikink applies the placement default.
          width_inches: d.width_inches ?? "",
          height_inches: d.height_inches ?? "",
          placement_sku: d.placement_sku ?? placementSku(d.placement),
          design_link: d.design_link,
          // Qikink requires a valid mockup_link URL (mandatory when
          // search_from_my_products=0). The app leaves a "BACKEND_RENDER_OPTIONAL"
          // placeholder here, which is not a URL — fall back to the (already
          // http-validated) design_link, matching Qikink's own docs where
          // design_link and mockup_link are the same URL.
          mockup_link: /^https?:\/\//.test(d.mockup_link ?? "") ? d.mockup_link : d.design_link,
        }));
      return item;
    }),
    shipping_address: cleanShippingAddress(p.shipping_address),
  };
  return out;
}

/* Qikink 400s on an empty email ("Empty field in shipping_address: email")
   and rejects unknown keys. Whitelist the documented fields and guarantee a
   non-empty email — falling back to a Drucka address keeps the white-label
   intact (Qikink's order emails go to us, not the customer). */
const SHIP_EMAIL_FALLBACK = "orders@drucka.in";
function cleanShippingAddress(a = {}) {
  return {
    first_name: a.first_name ?? "",
    last_name: a.last_name ?? "",
    address1: a.address1 ?? "",
    address2: a.address2 ?? "",
    city: a.city ?? "",
    province: a.province ?? "",
    zip: a.zip ?? "",
    country_code: a.country_code || "IN",
    phone: a.phone ?? "",
    email: (a.email ?? "").trim() || SHIP_EMAIL_FALLBACK,
  };
}

export async function qikinkFetch(path, { method = "GET", body } = {}) {
  const token = await qikinkToken();
  const payload = path === "/api/order/create" ? toQikinkOrderPayload(body) : body;
  if (path === "/api/order/create")
    console.log("Qikink Payload:", JSON.stringify(payload, null, 2));
  const t0 = Date.now();
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
  const ms = Date.now() - t0;
  console.log(`Qikink ${path} → ${res.status} in ${ms}ms:`, text);
  // Grep-able one-line monitor record for order creates: order, SKUs, status, latency.
  if (path === "/api/order/create") {
    const reqId = randomBytes(4).toString("hex"); // correlates monitor + artwork lines for one request
    const skus = (payload?.line_items ?? []).map((li) => li.sku).join("|");
    let qid = "";
    try { qid = JSON.parse(text).order_id ?? ""; } catch {}
    console.log(`[qikink-monitor] request_id=${reqId} order=${payload?.order_number} skus=${skus} status=${res.status} qikink_id=${qid} ms=${ms}`);
    // Privacy-safe artwork proof (no full URLs): confirms both links are http,
    // whether they match, and the Cloudinary components — enough to prove no
    // placeholder slips through and to spot a wrong resource_type/format.
    for (const li of payload?.line_items ?? [])
      for (const d of li.designs ?? []) {
        const df = artworkFingerprint(d.design_link), mf = artworkFingerprint(d.mockup_link);
        console.log(`[qikink-artwork] request_id=${reqId} order=${payload?.order_number} design_is_http=${df.is_http} mockup_is_http=${mf.is_http} same_url=${d.design_link === d.mockup_link} design_hash=${df.hash} mockup_hash=${mf.hash} cloud=${df.cloud} resource=${df.resource} type=${df.type} format=${df.format}`);
      }
  }
  if (!res.ok) throw new Error(`Qikink ${path} failed (${res.status}): ${text}`);
  return JSON.parse(text);
}
