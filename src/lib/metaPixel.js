/* ─────────────────────────────────────────────────────────────
   Meta Pixel (Facebook Pixel) — one place for every event.

   The base pixel + automatic PageView load from index.html <head>.
   These helpers fire the richer conversion events from the app.

   Every call is a SAFE no-op if the pixel script hasn't loaded
   (adblock, dev, offline, consent declined) — nothing ever throws.

   Pixel ID: 1572854067777236  (set in index.html)
   ───────────────────────────────────────────────────────────── */

const CURRENCY = "INR";

/* Low-level guarded call. Standard events use fbq('track', …). */
const fire = (event, params) => {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", event, params);
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

/* Checkout started (cart → checkout). */
export const initiateCheckout = ({ ids, numItems, value, currency = CURRENCY } = {}) =>
  fire("InitiateCheckout", {
    content_ids: ids,
    num_items: numItems,
    value,
    currency,
  });

/* Order placed. */
export const purchase = ({ ids, contents, numItems, value, currency = CURRENCY } = {}) =>
  fire("Purchase", {
    content_ids: ids,
    contents,
    num_items: numItems,
    value,
    currency,
  });

/* A lead — e.g. a bulk-order enquiry. */
export const lead = ({ name, category } = {}) =>
  fire("Lead", { content_name: name, content_category: category });

/* Contact — e.g. tapping any WhatsApp button. */
export const contact = (name = "WhatsApp") => fire("Contact", { content_name: name });
