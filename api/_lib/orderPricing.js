/* Server-side order pricing — the only place an order's money is decided.

   The browser used to send `total` and every line's `price`, and the server
   stored them. Anyone could POST a ₹1 total for a ₹4,000 order. Now the client
   says WHAT it wants (product, size, quantity, options) and the server works out
   what that costs from the same catalogue the editors show, then stores its own
   figures. Whatever price or total the browser sent is ignored.

   Priced here: the products Drucka makes itself and sells through the cart:
     photo prints, mini prints, and the photo collage.
   Everything else is refused (400). Qikink-made products are enquiry-only and
   never reach checkout (lib/orderMode.js), so they get no server price by design.
   An unknown or ambiguous line refuses the WHOLE order; it is never guessed at.

   The catalogue is imported from src/, not copied, so the editor and this file
   cannot drift apart. Delivery is not part of an order total (it is confirmed on
   WhatsApp), so there is nothing to compute or trust there. */
import { MINI_SIZES, PHOTO_SIZES, PRINT_VARIANTS } from "../../src/components/printSizes.js";
import { PRINT_SIZES, FRAME_OPTIONS, LAMINATION_OPTIONS, calcCollagePrice } from "../../src/collage/collageData.js";

export const MAX_LINES = 60;
export const MAX_QTY = 500;

const fail = (error) => ({ ok: false, error });

/* a line's size: prefer the explicit id, fall back to the label older carts stored */
function printSize(sizes, line) {
  const id = line.pricing?.sizeId;
  if (id) return sizes.find((s) => s.id === id) ?? null;
  return sizes.find((s) => s.label === line.size) ?? null;
}

function unitPrice(line) {
  switch (line.productId) {
    case PRINT_VARIANTS.photo.productId: {
      const s = printSize(PHOTO_SIZES, line);
      return s ? { unit: s.price } : { error: "Unknown photo print size" };
    }
    case PRINT_VARIANTS.mini.productId: {
      const s = printSize(MINI_SIZES, line);
      return s ? { unit: s.price, mini: true } : { error: "Unknown mini print size" };
    }
    default:
      break;
  }
  /* the collage travels under the Qikink "frame" product id, so the id alone is
     ambiguous; it must say what it is and carry the options that price it */
  if (line.inHouse === true && line.pricing?.kind === "collage") {
    const p = line.pricing;
    const size = PRINT_SIZES.find((s) => s.id === p.sizeId);
    const frame = FRAME_OPTIONS.find((f) => f.id === p.frameId);
    const lam = LAMINATION_OPTIONS.find((l) => l.id === p.laminationId);
    if (!size || !frame || !lam) return { error: "Unknown collage option" };
    return { unit: calcCollagePrice({ size, frame: frame.id, lamination: lam.id, qty: 1 }).unit };
  }
  return { error: "This product cannot be ordered online" };
}

/* → { ok:true, items, total, lines:[{key,price}] }  |  { ok:false, error } */
export function priceOrder(rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length) return fail("Order has no items");
  if (rawItems.length > MAX_LINES) return fail("Too many items in one order");

  const items = [];
  let total = 0;
  let miniPrints = 0;
  for (const line of rawItems) {
    if (!line || typeof line !== "object") return fail("Invalid item");
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_QTY) return fail("Invalid quantity");
    const r = unitPrice(line);
    if (r.error) return fail(r.error);
    if (r.mini) miniPrints += line.qty;
    total += r.unit * line.qty;
    items.push({ ...line, price: r.unit });
  }
  /* Mini Prints are a pack product: 10 per ORDER, across all mini sizes */
  if (miniPrints > 0 && miniPrints < PRINT_VARIANTS.mini.minPrints)
    return fail(`Mini Prints need a minimum of ${PRINT_VARIANTS.mini.minPrints} prints per order`);
  return { ok: true, items, total, lines: items.map((i) => ({ key: i.key, price: i.price })) };
}
