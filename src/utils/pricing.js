/* Single source of truth for all price math across every editor.
   Leaf module — imports nothing from the data layer, so data.js /
   collageData.js / MiniPrints can all depend on it without a cycle.

   The three product families price differently on purpose (per-placement
   print methods vs. size+add-ons vs. per-copy), so this exposes one
   primitive per family rather than forcing a single formula. Each editor's
   existing pricing function delegates here; displayed prices are unchanged. */

import { FREE_DELIVERY_MIN } from "../seo/policies.js";

/* Derived, NOT redefined. This used to be a second hardcoded 2999 sitting
   alongside FREE_DELIVERY_MIN in src/seo/policies.js — change one and the
   Mini Prints / Collage editors would silently disagree with the checkout,
   the announcement bar and the published shipping policy. One number now. */
export const FREE_SHIP_THRESHOLD = FREE_DELIVERY_MIN;

/* free at/above the threshold (or when the cart is empty), else `fee` */
export const shippingFor = (subtotal, fee) =>
  subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : fee;

/* print cost of one placement: small add-ons (pockets) cost 60% of the
   method price, rounded; full placements cost the full method price */
export const placementPrintCost = (method, placement) =>
  placement.small ? Math.round(method.price * 0.6) : method.price;

/* ── Designer (apparel + gifts) ──
   unit = base + size surcharge + per-printed-placement print cost.
   profitMargin (admin-only) adds to the unit before qty. No shipping here. */
export function designerPrice({
  product, layersByPlacement, selectedPrintMethod, selectedSize, qty = 1, profitMargin = 0,
}) {
  const method = product.printingOptions.find((m) => m.id === selectedPrintMethod) ?? product.printingOptions[0];
  const printed = product.printAreas.filter((p) => (layersByPlacement[p.id] ?? []).some((l) => l.visible !== false));
  const printCost = printed.reduce((s, p) => s + placementPrintCost(method, p), 0);
  const unit = product.basePrice + (product.sizeSurcharge?.[selectedSize] ?? 0) + printCost;
  const selling = unit + (Number(profitMargin) || 0);
  return { unit, selling, total: selling * qty, printed, method, printCost };
}

/* ── Collage prints ──
   unit = size base + frame add-on + lamination add-on; shipping flat `shipFee`
   (default ₹99) until the order total reaches the free-ship threshold.
   Caller resolves base/framePrice/lamPrice from its own option tables. */
export function collagePrice({ base, framePrice, lamPrice, qty = 1, shipFee = 99 }) {
  const unit = base + framePrice + lamPrice;
  const q = Math.max(1, qty);
  const total = unit * q;
  const shipping = total >= FREE_SHIP_THRESHOLD ? 0 : shipFee;
  return { base, framePrice, lamPrice, unit, total, shipping, grandTotal: total + shipping };
}

/* ── Flat photo prints (mini + regular) ──
   Two call shapes, because the editor lets one order mix sizes:

     • { lines: [{ unitPrice, copies }] } — the mixed-size case. Subtotal is
       the sum of the lines, so a 4×6 and an A3 in the same order each price
       at their own rate.
     • { unitPrice, totalPrints }        — the original single-size shape,
       kept so existing callers keep working.

   Shipping is flat `shipFee` (default ₹49) and free once the subtotal reaches
   the threshold. `minPrints` is informational: it reports whether the order
   clears the product's minimum (Mini Prints: 10 per order) so the caller can
   disable checkout, rather than silently repricing. */
export function miniPrice({ unitPrice, totalPrints, lines, shipFee = 49, minPrints = 1 }) {
  const rows = lines ?? [{ unitPrice, copies: totalPrints }];
  const prints = rows.reduce((n, l) => n + (Number(l.copies) || 0), 0);
  const subtotal = rows.reduce((s, l) => s + (Number(l.unitPrice) || 0) * (Number(l.copies) || 0), 0);
  const shipping = shippingFor(subtotal, shipFee);
  const shortBy = Math.max(0, minPrints - prints);
  return {
    subtotal, shipping, total: subtotal + shipping,
    totalPrints: prints, minPrints, shortBy, meetsMinimum: shortBy === 0,
  };
}

/* ── the one public entry point ──
   Every caller prices through pricingEngine.calculate({ family, ... }).
   Product families price differently, so this dispatches to the right
   calculator; a new family adds a case here, never a new pricing file. */
export function calculate(input = {}) {
  switch (input.family) {
    case "designer": return designerPrice(input);
    case "collage":  return collagePrice(input);
    case "mini":     return miniPrice(input);
    default: throw new Error(`pricingEngine.calculate: unknown family "${input.family}"`);
  }
}

export const pricingEngine = { calculate };
