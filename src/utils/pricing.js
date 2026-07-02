/* Single source of truth for all price math across every editor.
   Leaf module — imports nothing from the data layer, so data.js /
   collageData.js / MiniPrints can all depend on it without a cycle.

   The three product families price differently on purpose (per-placement
   print methods vs. size+add-ons vs. per-copy), so this exposes one
   primitive per family rather than forcing a single formula. Each editor's
   existing pricing function delegates here; displayed prices are unchanged. */

export const FREE_SHIP_THRESHOLD = 2999;

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

/* ── Mini prints ──
   subtotal = per-print price × total copies; shipping flat `shipFee`
   (default ₹49), free once the subtotal reaches the threshold. */
export function miniPrice({ unitPrice, totalPrints, shipFee = 49 }) {
  const subtotal = totalPrints * unitPrice;
  const shipping = shippingFor(subtotal, shipFee);
  return { subtotal, shipping, total: subtotal + shipping };
}
