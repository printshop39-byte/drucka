/* ─────────────────────────────────────────────────────────────
   Meta Pixel (Facebook Pixel) — one place for every event.

   initPixel() loads the base pixel + fires the first PageView; the
   other exports fire the richer conversion events from the app.

   Every call is a SAFE no-op if the pixel script hasn't loaded
   (adblock, dev, offline, consent declined) — nothing ever throws.

   Pixel ID: 1572854067777236
   ───────────────────────────────────────────────────────────── */

const PIXEL_ID = "1572854067777236";
const CURRENCY = "INR";

/* Fail-closed, not fail-open: this used to be an unconditional <script> in
   index.html, so every staging/preview deployment and every local
   `npm run dev` session (including manual QA click-throughs) sent real
   PageView/InitiateCheckout/Purchase events into the live Meta account.
   A negative check on VITE_STAGING would still default to "on" for any
   deployment that simply never set that variable (e.g. a Vercel Preview
   env with no VITE_STAGING configured) — so this requires an explicit
   opt-in instead, on top of a real production build. */
export function initPixel() {
  if (typeof window === "undefined" || window.fbq) return;
  const pixelEnabled = import.meta.env.PROD && import.meta.env.VITE_ENABLE_META_PIXEL === "true";
  if (!pixelEnabled) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

/* Low-level guarded call. Standard events use fbq('track', …).
   `eventId`, when given, is passed as Meta's eventID so a matching
   server-side Conversions API event with the same id is deduplicated. */
const fire = (event, params, eventId) => {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      if (eventId) window.fbq("track", event, params, { eventID: eventId });
      else window.fbq("track", event, params);
    }
  } catch {
    /* pixel unavailable — ignore silently */
  }
};

/* Same guard, for Custom events — these use fbq('trackCustom', …). */
const fireCustom = (event, params) => {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("trackCustom", event, params);
    }
  } catch {
    /* pixel unavailable — ignore silently */
  }
};

/* Explicit PageView — the base code already fires one per load; use this
   only for SPA route changes if we ever want per-route PageViews. */
export const pageView = () => fire("PageView");

/* Someone viewed a product / landing page. */
export const viewContent = ({ id, name, value, currency = CURRENCY } = {}) =>
  fire("ViewContent", {
    content_ids: id ? [id] : undefined,
    content_name: name,
    content_type: "product",
    value,
    currency,
  });

/* Someone uploaded a photo / design to personalise a product. This is a
   Custom Event (not a Meta standard event), so it fires via trackCustom. */
export const uploadDesign = ({ id, name, source } = {}) =>
  fireCustom("UploadDesign", {
    content_ids: id ? [id] : undefined,
    content_name: name,
    content_type: "product",
    source, // which surface: editor · collage · mini-prints · frames
  });

/* Someone used a search box (no product search on the site yet — kept for
   future use). */
export const search = (term) => fire("Search", { search_string: term });

/* Item added to cart. */
export const addToCart = ({ id, name, value, currency = CURRENCY } = {}) =>
  fire("AddToCart", {
    content_ids: id ? [id] : undefined,
    content_name: name,
    content_type: "product",
    value,
    currency,
  });

/* Checkout started (cart → checkout). `eventId` dedups against a server-side
   InitiateCheckout (used for COD orders, sent from the order-create API). */
export const initiateCheckout = ({ ids, numItems, value, currency = CURRENCY, eventId } = {}) =>
  fire("InitiateCheckout", {
    content_ids: ids,
    num_items: numItems,
    value,
    currency,
  }, eventId);

/* Order placed. `eventId` (e.g. purchase_<orderId>) dedups this browser
   event against the server-side Conversions API Purchase from our backend. */
export const purchase = ({ ids, contents, numItems, value, currency = CURRENCY, eventId } = {}) =>
  fire("Purchase", {
    content_ids: ids,
    contents,
    num_items: numItems,
    value,
    currency,
  }, eventId);

/* A lead — e.g. a bulk-order enquiry. */
export const lead = ({ name, category } = {}) =>
  fire("Lead", { content_name: name, content_category: category });

/* Contact — e.g. tapping any WhatsApp button. */
export const contact = (name = "WhatsApp") => fire("Contact", { content_name: name });
