/* Server-side fulfillment: build payload from the Supabase order row,
   upload artwork (data-URLs stored in items) to Cloudinary, create the
   Qikink order, persist results. Used by the Razorpay webhook for
   AUTO_SEND_ON_PAID and reusable for admin retries.
   Errors are saved to orders.last_error so failures are never silent. */
import { sb, rowToOrder } from "./supabase.js";
import { uploadDataUrl } from "./cloudinary.js";
import { qikinkFetch } from "./qikink.js";
import { isInHouseVariant } from "./qikinkCatalog.js";

export async function loadProductMap() {
  try {
    return await sb("product_map?select=*&order=drucka_id");
  } catch {
    return []; // table missing → mapping validation will fail loudly below
  }
}

export async function fulfillFromDb(druckaOrderId) {
  const rows = await sb(`orders?id=eq.${encodeURIComponent(druckaOrderId)}&select=*`);
  const row = rows?.[0];
  if (!row) throw new Error(`Order ${druckaOrderId} not found`);
  if (row.qikink_order_id) return { qikinkOrderId: row.qikink_order_id, alreadySent: true };
  if (!["Paid", "COD Approved"].includes(row.payment_status))
    throw new Error(`Order not paid (status: ${row.payment_status})`);

  const order = rowToOrder(row);
  const map = await loadProductMap();

  try {
    const artworkUrls = [];
    const line_items = [];
    const inHouse = [];
    for (const item of order.items) {
      /* Drucka makes some variants itself — checked BEFORE the mapping and
         artwork rules, because a digital invitation has real artwork and no
         Qikink SKU: it would otherwise fail "No active product mapping" or,
         worse, match the printed card's mapping and be printed. */
      if (isInHouseVariant(item.productId, item.size)) {
        inHouse.push(item.name ?? item.productId);
        continue;
      }
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

    /* Every line was in-house — there is nothing for Qikink to print. Sending
       an empty order would be rejected; throwing would mark a perfectly good
       paid order Failed and leave Razorpay retrying the webhook forever. */
    if (!line_items.length) {
      await sb(`orders?id=eq.${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        body: { qikink_status: "In Production" }, // Drucka is making it; no Qikink id to poll
      });
      console.log(`[qikink-monitor] order=${order.id} in_house_only=1 items=${inHouse.join("|")}`);
      return { inHouseOnly: true, inHouse };
    }

    const payload = {
      order_number: order.id,
      brand_name: "Drucka", // white-label — customer sees Drucka only
      gateway: order.paymentMode === "cod" ? "COD" : "Prepaid",
      payment_status: order.paymentStatus,
      /* The WHOLE order total, even when an in-house line was filtered out
         above: on COD this is what the courier collects, and the customer
         does owe it — Drucka delivers the digital half itself. */
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

    const result = await qikinkFetch("/api/order/create", { method: "POST", body: payload });
    const qikinkOrderId = String(result.order_id ?? result.id ?? "");
    if (!qikinkOrderId) throw new Error(`Qikink returned no order id: ${JSON.stringify(result)}`);

    await sb(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      body: { qikink_order_id: qikinkOrderId, qikink_status: "Sent to Qikink", artwork_urls: artworkUrls, last_error: null },
    });
    return { qikinkOrderId };
  } catch (err) {
    // never fail silently — surface in the admin panel + logs
    await sb(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      body: { qikink_status: "Failed", last_error: String(err.message).slice(0, 500) },
    }).catch(() => {});
    throw err;
  }
}
