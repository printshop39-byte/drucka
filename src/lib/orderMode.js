/* ── Order mode: fixed price, or ENQUIRE on WhatsApp ─────────────────────────
   Owner's decision, 2026-09-21: every Qikink-fulfilled product is ordered by
   ENQUIRY. No fixed price is shown, nothing goes into the cart, and there is
   no checkout for it. The customer designs the item if they like, then taps
   "Enquire on WhatsApp"; Drucka replies with a price.

   WHY: Qikink's blank cost, print charge, courier slabs and GST treatment are
   not yet confirmed in writing, so any price this site showed would be a
   guess presented as a fact. Keeping the products orderable without pretending
   to know their price lets the site launch now and the margin work finish
   later (Track 2).

   HOW TO FLIP A PRODUCT BACK to a fixed price once its costs are confirmed:
   add its designer product id to PRICED_PRODUCT_IDS. Everything that shows a
   price, the cart button, the landing page and the search snippet reads this
   one set, so nothing else needs to change.

   The default is deliberate: a product NOT listed here is an enquiry. A new
   product added to designer/data.js and forgotten would otherwise start
   quoting a price nobody has checked. */
export const PRICED_PRODUCT_IDS = new Set([]);

export const isEnquiry = (productId) => !PRICED_PRODUCT_IDS.has(productId);

/* A cart line left in a customer's browser by an earlier version of the site,
   for a product that is now enquiry-only. Dropped on load so nobody arrives at
   checkout with a Qikink item that can no longer be ordered that way.

   Only editor-made lines qualify (type "custom"). The rest are excluded by
   what they ARE, not by product id, because the id alone cannot tell them
   apart: the Photo Collage is priced in-house but its cart line carries the
   Qikink "frame" id as its fulfilment product. */
export function isEnquiryCartLine(line) {
  if (!line || line.type !== "custom") return false;
  if (line.inHouse) return false;
  if (line.productId === "mini-print" || line.productId === "photo-print") return false;
  if (typeof line.name === "string" && line.name.startsWith("Photo Collage")) return false;
  return isEnquiry(line.edit?.productId ?? line.productId);
}
