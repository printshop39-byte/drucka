/* Meta Conversions API (CAPI) — SERVER-SIDE event backup.

   Sends conversion events straight from our backend to Meta, so they
   survive iOS/ITP, ad blockers and dropped browser tabs. Each event
   carries an `event_id` that MATCHES the browser pixel's eventID, so
   Meta DEDUPLICATES the pair and counts the action exactly once.

   Safe no-op if META_CAPI_TOKEN isn't set (dev, or not configured yet) —
   never throws into the caller. Callers still wrap in try/catch so a
   Meta outage can never break checkout/fulfilment.

   Setup (one-time):
     Events Manager → Settings → Conversions API → generate access token.
     Add to Vercel env:  META_CAPI_TOKEN=<token>
     META_PIXEL_ID defaults to the site pixel; override via env if needed.
   ──────────────────────────────────────────────────────────────────── */
import crypto from "node:crypto";

const PIXEL_ID = process.env.META_PIXEL_ID ?? "1572854067777236";
const GRAPH = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;

/* Meta requires PII hashed as lowercase-trimmed SHA-256 hex. */
const hash = (v) =>
  v == null || v === ""
    ? undefined
    : crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");

/* Phone → E.164, India. Take the last 10 digits (drops any leading 0 or
   existing 91 prefix) and prefix the 91 country code, matching how the
   order store normalises phones. */
const hashPhone = (raw) => {
  const last10 = String(raw ?? "").replace(/\D/g, "").slice(-10);
  if (last10.length !== 10) return undefined;
  return crypto.createHash("sha256").update(`91${last10}`).digest("hex");
};

/* Build Meta's user_data block from our order.customer. More matched
   fields = higher match quality; every field is optional. */
const userData = (customer = {}) => {
  const [first, ...rest] = String(customer.name ?? "").trim().split(/\s+/);
  const hashed = {
    em: hash(customer.email),
    ph: hashPhone(customer.phone),
    fn: hash(first),
    ln: rest.length ? hash(rest.join(" ")) : undefined,
    ct: hash(customer.city),
    zp: hash(customer.pincode),
    country: hash("in"),
  };
  // Hashed identifiers go in as [hex] arrays; drop the empty ones.
  const ud = Object.fromEntries(Object.entries(hashed).filter(([, v]) => v).map(([k, v]) => [k, [v]]));

  /* Raw (NOT hashed) browser signals captured at checkout — the single
     biggest match-quality lift for server events, especially on iOS. */
  const t = customer._tracking ?? {};
  if (t.fbp) ud.fbp = t.fbp;
  if (t.fbc) ud.fbc = t.fbc;
  if (t.ua) ud.client_user_agent = t.ua;
  return ud;
};

/* Fire one server-side event. Returns { ok, skipped?, error? } — always
   resolves, never rejects. */
export async function sendCapiEvent({ eventName, eventId, order, eventSourceUrl }) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return { ok: true, skipped: "no token" }; // not configured → silent no-op
  try {
    const value = order?.total ?? order?.items?.reduce((s, i) => s + i.price * i.qty, 0);
    const body = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId, // ← dedup key, must equal the browser pixel eventID
          action_source: "website",
          event_source_url: eventSourceUrl ?? "https://drucka.in/checkout",
          user_data: userData(order?.customer),
          custom_data: {
            currency: "INR",
            value,
            content_type: "product",
            content_ids: order?.items?.map((i) => i.productId) ?? undefined,
            contents: order?.items?.map((i) => ({ id: i.productId, quantity: i.qty })) ?? undefined,
            num_items: order?.items?.reduce((s, i) => s + i.qty, 0) ?? undefined,
            order_id: order?.id,
          },
        },
      ],
    };
    /* test_event_code is ONLY for the Events Manager → Test Events tab.
       Set META_CAPI_TEST_CODE temporarily while testing, then unset it —
       it must never be present in production traffic. */
    if (process.env.META_CAPI_TEST_CODE) body.test_event_code = process.env.META_CAPI_TEST_CODE;

    const res = await fetch(`${GRAPH}?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `Meta CAPI ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
