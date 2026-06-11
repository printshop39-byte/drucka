/* Server-side fulfillment: build payload from the Supabase order row,
   upload artwork (data-URLs stored in items) to Cloudinary, create the
   Qikink order, persist results. Used by the Razorpay webhook for
   AUTO_SEND_ON_PAID and reusable for admin retries.
   Errors are saved to orders.last_error so failures are never silent. */
import { sb, rowToOrder } from "./supabase.js";
import { uploadDataUrl } from "./cloudinary.js";
import { qikinkFetch } from "./qikink.js";

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
    for (const item of order.items) {
      const m = map.find((x) => x.drucka_id === item.productId && x.active);
      if (!m) throw new Error(`No active product mapping for ${item.productId}`);
      const designs = [];
      for (const [side, layers] of Object.entries(item.design ?? {})) {
        const images = (layers ?? []).filter((l) => l.type === "image" && l.src?.startsWith("data:"));
        if (!layers?.length) continue;
        const urls = [];
        for (const layer of images) {
          const url = await uploadDataUrl(layer.src, `${order.id}-${item.productId}-${side}`);
          urls.push(url);
          artworkUrls.push(url);
        }
        designs.push({
          placement: item.placement && item.placement !== "center" ? item.placement : side,
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
