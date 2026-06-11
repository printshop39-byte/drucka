/* ═══════════════════════════════════════════════════════════════
   DRUCKA × QIKINK — BACKEND / SERVERLESS PSEUDO-CODE
   ────────────────────────────────────────────────────────────────
   Deploy these as serverless functions (Vercel /api, Netlify
   functions, Cloudflare Workers) or Express routes. This file is
   documentation — it is NOT imported by the frontend build.

   SECURITY RULES:
   • QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET live ONLY in server
     environment variables — never in React code or localStorage.
   • The browser talks ONLY to these endpoints, never to Qikink.
   • The access token never reaches the browser.

   Env vars to configure on your host:
     QIKINK_CLIENT_ID=...
     QIKINK_CLIENT_SECRET=...
     QIKINK_BASE_URL=https://sandbox.qikink.com   (or live URL)

   ⚠ Endpoint paths and field names below follow Qikink's public API
   pattern — confirm the exact schema in your Qikink dashboard docs
   (https://creator.qikink.com/dashboard) before going live.
   ═══════════════════════════════════════════════════════════════ */

const BASE = process.env.QIKINK_BASE_URL; // sandbox vs live

/* ────────────────────────────────────────────────
   1. POST /api/qikink/token
   Authenticates with Qikink, returns nothing secret
   to the browser — used internally + for "Test
   connection" in the Drucka admin panel.
   ──────────────────────────────────────────────── */
let cachedToken = null; // { accessToken, expiresAt }

async function getQikinkToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }
  const res = await fetch(`${BASE}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ClientId: process.env.QIKINK_CLIENT_ID,
      client_secret: process.env.QIKINK_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Qikink auth failed: ${res.status}`);
  const data = await res.json(); // { Accesstoken, expires_in, ... }
  cachedToken = {
    accessToken: data.Accesstoken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.accessToken;
}

export async function tokenHandler(req, res) {
  try {
    await getQikinkToken();
    // Only report SUCCESS — never return the token itself
    res.json({ ok: true, mode: BASE.includes("sandbox") ? "sandbox" : "live" });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

/* ────────────────────────────────────────────────
   2. POST /api/qikink/create-order
   Body: the JSON built by buildQikinkOrderPayload()
   in the Drucka frontend.
   ──────────────────────────────────────────────── */
export async function createOrderHandler(req, res) {
  const payload = req.body;

  // 1. Re-validate server-side (never trust the browser)
  if (!/^\d{6}$/.test(payload.shipping_address?.zip ?? ""))
    return res.status(400).json({ ok: false, error: "Invalid pincode" });
  if (!/^\d{10}$/.test((payload.shipping_address?.phone ?? "").replace(/\D/g, "").slice(-10)))
    return res.status(400).json({ ok: false, error: "Invalid phone" });
  if (payload.payment_status !== "Paid" && payload.gateway !== "COD")
    return res.status(402).json({ ok: false, error: "Order not paid" });

  // 2. Upload customer artwork to your CDN (S3 / Cloudinary).
  //    The frontend stores artwork as data-URLs in the order record;
  //    fetch them from your DB, upload, and replace the placeholders:
  for (const item of payload.line_items) {
    for (const design of item.designs) {
      if (design.design_link === "BACKEND_UPLOAD_REQUIRED") {
        // const publicUrl = await uploadToCdn(artworkDataUrlFromDb);
        // design.design_link = publicUrl;
        return res.status(400).json({ ok: false, error: "Artwork not uploaded to CDN yet" });
      }
    }
  }

  // 3. Create the order at Qikink
  const token = await getQikinkToken();
  const qikinkRes = await fetch(`${BASE}/api/order/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ClientId: process.env.QIKINK_CLIENT_ID,
      Accesstoken: token,
    },
    body: JSON.stringify(payload),
  });
  if (!qikinkRes.ok) {
    const detail = await qikinkRes.text();
    return res.status(502).json({ ok: false, error: `Qikink rejected order: ${detail}` });
  }
  const result = await qikinkRes.json(); // { order_id, ... }

  // 4. Persist the mapping Drucka order ↔ Qikink order in YOUR database
  // await db.orders.update(payload.order_number, { qikinkOrderId: result.order_id, status: "Sent to Qikink" });

  // 5. Return only what the frontend needs
  res.json({ ok: true, qikinkOrderId: result.order_id });
}

/* ────────────────────────────────────────────────
   3. GET /api/qikink/order-status?id=QK-xxxx
   Polls Qikink for production/shipping status and
   maps it to Drucka's local statuses.
   ──────────────────────────────────────────────── */
const STATUS_MAP = {
  pending: "Sent to Qikink",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Failed",
};

export async function orderStatusHandler(req, res) {
  const token = await getQikinkToken();
  const qikinkRes = await fetch(`${BASE}/api/order/status?order_id=${encodeURIComponent(req.query.id)}`, {
    headers: { ClientId: process.env.QIKINK_CLIENT_ID, Accesstoken: token },
  });
  if (!qikinkRes.ok) return res.status(502).json({ ok: false });
  const data = await qikinkRes.json(); // { status, tracking_number, courier, ... }
  res.json({
    ok: true,
    druckaStatus: STATUS_MAP[data.status] ?? "Sent to Qikink",
    tracking: data.tracking_number ?? null,
    courier: data.courier ?? null,
  });
  // Tip: run this on a cron (every 30 min), update your DB, and notify
  // the customer on WhatsApp when status changes to Shipped/Delivered.
}
