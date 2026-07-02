/* Order orchestration: API-first with graceful local fallback.
   localStorage stays the instant UI source of truth; Supabase (via
   /api/orders) is the canonical store once the backend is deployed.
   Every remote call here is safe to fail — the UI keeps working. */
import { qikinkApi } from "./qikinkClient";

/* camelCase order patch → snake_case DB columns */
const PATCH_KEYS = {
  paymentStatus: "payment_status",
  qikinkStatus: "qikink_status",
  qikinkOrderId: "qikink_order_id",
  tracking: "tracking_number",
  courier: "courier",
  lastError: "last_error",
};

export async function syncOrderCreate(order) {
  try {
    await qikinkApi.saveOrder(order);
    return "api";
  } catch {
    return "local"; // backend not deployed yet — order stays in localStorage
  }
}

export async function syncOrderPatch(id, patch) {
  const mapped = {};
  for (const [k, v] of Object.entries(patch)) if (PATCH_KEYS[k]) mapped[PATCH_KEYS[k]] = v;
  if (!Object.keys(mapped).length) return "skipped";
  try {
    await qikinkApi.patchOrder(id, mapped);
    return "api";
  } catch {
    return "local";
  }
}

/* Full fulfillment: upload every image layer to Cloudinary, fill the
   design_link fields, then create the Qikink order via the backend.
   Throws if the backend is unreachable — caller falls back to demo mode. */
export async function fulfillOrder(order, payload) {
  const uploaded = new Map(); // layer src → public URL (dedup identical artwork)

  for (const [idx, item] of order.items.entries()) {
    const designs = payload.line_items[idx]?.designs ?? [];
    // same order + filter as buildQikinkOrderPayload, so indexes line up
    const sides = Object.entries(item.design ?? {}).filter(([, ls]) => ls.length);
    for (let d = 0; d < sides.length; d++) {
      const [side, layers] = sides[d];
      const urls = [];
      for (const layer of layers) {
        if (layer.type !== "image" || !layer.src?.startsWith("data:")) continue;
        if (!uploaded.has(layer.src)) {
          const { url } = await qikinkApi.uploadArtwork(layer.src, order.id, `${item.productId}-${side}-${layer.id}`);
          uploaded.set(layer.src, url);
        }
        urls.push(uploaded.get(layer.src));
      }
      if (designs[d]) {
        designs[d].design_link = urls[0] ?? designs[d].design_link;
        designs[d].all_artwork = urls;
      }
    }
  }

  const res = await qikinkApi.createOrder(payload); // { qikinkOrderId }
  return res;
}
