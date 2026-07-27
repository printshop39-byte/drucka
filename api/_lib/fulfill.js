/* Server-side fulfillment: build payload from the Supabase order row,
   upload artwork (data-URLs stored in items) to Cloudinary, create the
   Qikink order, persist results. The SINGLE source of truth for reaching
   Qikink. Callers: the retry cron and the trigger layer (Phase 3).

   Hardened (Phase 2 — infrastructure only, no business-flow change):
     • optimistic lock (Ready|Failed → Sending) prevents duplicate sends
     • capped retry ladder + Dead Letter on exhaustion
     • fulfill_attempts / next_retry_at bookkeeping
     • per-transition events (best-effort) via logEvent()
   Errors are saved to orders.last_error so failures are never silent. */
import { sb, rowToOrder } from "./supabase.js";
import { uploadDataUrl } from "./cloudinary.js";
import { qikinkFetch } from "./qikink.js";
import { logEvent, EVENTS } from "./events.js";

const enc = encodeURIComponent;

/* Retry backoff ladder in MINUTES — the single source of truth for retry
   timing. Index by the attempt number just recorded (1-based); running off the
   end of the array dead-letters the order. Do not scatter these values. */
const RETRY_MINUTES = [1, 5, 15, 30, 60, 360];

/* States a worker may claim from. A claimed order is flipped to 'Sending'. */
const CLAIMABLE = ["Ready", "Failed"];

export async function loadProductMap() {
  try {
    return await sb("product_map?select=*&order=drucka_id");
  } catch {
    return []; // table missing → mapping validation will fail loudly below
  }
}

/* Optimistic lock: atomically flip this order Ready|Failed → Sending.
   Returns true only if THIS call won the row (affected rows = 1). A second
   concurrent worker sees 0 rows and must exit — this is what prevents two
   workers from both creating the same order at Qikink. */
async function claimForSending(orderId) {
  const inList = CLAIMABLE.map((s) => `"${s}"`).join(",");
  const claimed = await sb(
    `orders?id=eq.${enc(orderId)}&qikink_status=in.(${enc(inList)})`,
    { method: "PATCH", body: { qikink_status: "Sending" } }
  );
  return Array.isArray(claimed) && claimed.length > 0;
}

export async function fulfillFromDb(druckaOrderId) {
  const rows = await sb(`orders?id=eq.${enc(druckaOrderId)}&select=*`);
  const row = rows?.[0];
  if (!row) throw new Error(`Order ${druckaOrderId} not found`);
  // idempotency: already at Qikink → never create a second one
  if (row.qikink_order_id) return { qikinkOrderId: row.qikink_order_id, alreadySent: true };
  if (!["Paid", "COD Approved"].includes(row.payment_status))
    throw new Error(`Order not paid (status: ${row.payment_status})`);

  // ── optimistic lock: claim the order for this worker ──
  if (!(await claimForSending(druckaOrderId)))
    return { skipped: true, reason: "not-claimable" }; // not enqueued, or another worker owns it

  const attempts = Number(row.fulfill_attempts ?? 0);
  await logEvent(druckaOrderId, EVENTS.FULFILLMENT_STARTED, { attempt: attempts + 1 });

  const order = rowToOrder(row);
  const map = await loadProductMap();

  try {
    const artworkUrls = [];
    const line_items = [];
    for (const item of order.items) {
      const m = map.find((x) => x.drucka_id === item.productId && x.active);
      if (!m) throw new Error(`No active product mapping for ${item.productId}`);
      const designs = [];
      for (const [side, layers] of Object.entries(item.design ?? {})) {
        if (!layers?.length) continue;
        const urls = [];
        /* The editor now flattens each print area — every layer, text included
           — and uploads it when the item goes into the cart. Prefer that.
           Without it we are back to uploading raw image layers, which drops
           the text and every image after the first. */
        const flattened = item.artwork?.[side];
        if (flattened) {
          urls.push(flattened);
          artworkUrls.push(flattened);
        } else {
          const images = (layers ?? []).filter((l) => l.type === "image" && l.src?.startsWith("data:"));
          for (const layer of images) {
            const url = await uploadDataUrl(layer.src, `${order.id}-${item.productId}-${side}`);
            urls.push(url);
            artworkUrls.push(url);
          }
        }
        designs.push({
          /* the design's OWN print area, not item.placement — that is a joined
             label of every printed area ("Front, Back"), which the placement
             lookup can never match, so every design was sent as a front print */
          placement: side,
          width_inches: item.printSize?.[side]?.w ?? "",
          height_inches: item.printSize?.[side]?.h ?? "",
          design_link: urls[0] ?? null,
          all_artwork: urls,
        });
      }
      if (!designs.some((d) => d.design_link)) throw new Error(`No artwork on ${item.name}`);
      line_items.push({
        search_from_my_products: 0,
        qikink_product_id: m.qikink_product_id,
        sku: m.sku_pattern.replace("{color}", item.color ?? "white").replace("{size}", item.size ?? ""),
        print_type: m.print_method,
        quantity: item.qty,
        price: item.price,
        custom_size: item.customSize ?? null,
        designs,
      });
    }
    await logEvent(druckaOrderId, EVENTS.ARTWORK_UPLOADED, { count: artworkUrls.length });

    const payload = {
      order_number: order.id,
      brand_name: "Drucka", // white-label — customer sees Drucka only
      gateway: order.paymentMode === "cod" ? "COD" : "Prepaid",
      payment_status: order.paymentStatus,
      total_order_value: order.total,
      qikink_shipping: "1",
      line_items,
      shipping_address: {
        first_name: order.customer.name,
        address1: order.customer.address1,
        address2: order.customer.address2 ?? "",
        city: order.customer.city,
        province: order.customer.state,
        zip: order.customer.pincode,
        country_code: "IN",
        phone: order.customer.phone,
        email: order.customer.email ?? "",
      },
      notes: order.customer.notes ?? "",
    };

    await logEvent(druckaOrderId, EVENTS.QIKINK_REQUEST, { skus: line_items.map((li) => li.sku) });
    const result = await qikinkFetch("/api/order/create", { method: "POST", body: payload });
    const qikinkOrderId = String(result.order_id ?? result.id ?? "");
    if (!qikinkOrderId) throw new Error(`Qikink returned no order id: ${JSON.stringify(result)}`);

    await sb(`orders?id=eq.${enc(order.id)}`, {
      method: "PATCH",
      body: {
        qikink_order_id: qikinkOrderId,
        qikink_status: "Sent to Qikink",
        artwork_urls: artworkUrls,
        last_error: null,
        next_retry_at: null,
      },
    });
    await logEvent(druckaOrderId, EVENTS.QIKINK_SUCCESS, { qikinkOrderId });
    return { qikinkOrderId };
  } catch (err) {
    // never fail silently — record the error, schedule a retry, or dead-letter.
    const message = String(err.message).slice(0, 500);
    const newAttempts = attempts + 1;
    await logEvent(druckaOrderId, EVENTS.QIKINK_FAILED, { attempt: newAttempts, error: message });

    const delayMin = RETRY_MINUTES[newAttempts - 1]; // undefined once past the ladder
    const patch = { fulfill_attempts: newAttempts, last_error: message };
    if (delayMin === undefined) {
      patch.qikink_status = "Dead Letter";
      patch.next_retry_at = null;
    } else {
      patch.qikink_status = "Failed";
      patch.next_retry_at = new Date(Date.now() + delayMin * 60_000).toISOString();
    }
    await sb(`orders?id=eq.${enc(order.id)}`, { method: "PATCH", body: patch }).catch(() => {});

    if (delayMin === undefined) {
      console.error(`[fulfill-dead-letter] order=${order.id} attempts=${newAttempts} error=${message}`);
      await logEvent(druckaOrderId, EVENTS.DEAD_LETTER, { attempts: newAttempts, error: message });
    } else {
      await logEvent(druckaOrderId, EVENTS.RETRY_SCHEDULED, {
        attempt: newAttempts,
        next_retry_at: patch.next_retry_at,
        delay_minutes: delayMin,
      });
    }
    throw err;
  }
}
