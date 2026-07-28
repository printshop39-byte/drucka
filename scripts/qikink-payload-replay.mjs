/* ── Rebuild the payload an order was sent to Qikink with ────────────────
   Support asks "share the API request payload" long after the fact, and
   Vercel's runtime logs — where api/_lib/qikink.js prints it — are kept for
   hours, not days. The payload is a pure function of the order row and the
   product map, both of which live in Supabase forever, so it can be rebuilt
   exactly rather than described from memory.

   READ ONLY. It never writes to Supabase, never uploads artwork, and never
   calls Qikink. Nothing here can change an order.

   Usage — either hand it rows you exported yourself:
     node scripts/qikink-payload-replay.mjs --file rows.json
   or let it read them straight from Supabase (needs the same two env vars the
   API uses; export them for this shell only, do not write them to a file):
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
       node scripts/qikink-payload-replay.mjs --last 3

   rows.json is whatever this SQL returns, as a JSON array:
     select id, total, payment_mode, payment_status, qikink_order_id,
            items, customer
     from public.orders
     where qikink_order_id is not null
     order by created_at desc limit 3;

   Output is redacted by default — the customer's name, phone, email and
   address are replaced with same-shaped placeholders, and artwork URLs keep
   their path but lose any signing query string. Pass --raw to skip that (do
   NOT paste raw output into a support ticket).                             */

import { readFile } from "node:fs/promises";
import { toQikinkOrderPayload } from "../api/_lib/qikink.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const REDACT = !flag("--raw");

/* ── the product map ──
   fulfillFromDb() reads it from Supabase, but the admin "Send to Qikink"
   button does not: it builds its line items in the browser, from the map the
   app ships in src/App.jsx (kept in localStorage as drucka-product-map-v5).
   An order sent that way was mapped by THAT map, so replaying it against the
   database table would be replaying the wrong one — and on a database where
   product_map was never created, the table is not even there. --map-from-app
   reads the shipped map instead.

   The entries are one per line in App.jsx, so they are picked out field by
   field rather than by trying to parse JSX as data. */
async function mapFromApp(appPath) {
  const src = await readFile(appPath, "utf8");
  const field = (line, name) => {
    const m = line.match(new RegExp(`${name}:\\s*"([^"]*)"`));
    return m ? m[1] : null;
  };
  const out = [];
  for (const line of src.split("\n")) {
    if (!/druckaId:\s*"/.test(line)) continue;
    const drucka_id = field(line, "druckaId");
    if (!drucka_id) continue;
    out.push({
      drucka_id,
      qikink_product_id: field(line, "qikinkProductId"),
      sku_pattern: field(line, "skuPattern"),
      print_method: field(line, "printMethod"),
      product_name: field(line, "druckaName"),
      active: !/active:\s*false/.test(line),
    });
  }
  if (!out.length) throw new Error(`No QIKINK_PRODUCT_MAP entries found in ${appPath}`);
  return out;
}

/* ── fetch rows ── */
async function fromSupabase(limit) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --last (or use --file)");
  const get = async (path) => {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`Supabase ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
  };
  const orders = await get(
    `orders?qikink_order_id=not.is.null&select=id,total,payment_mode,payment_status,qikink_order_id,items,customer` +
      `&order=created_at.desc&limit=${encodeURIComponent(limit)}`
  );
  /* product_map may not exist at all — on the live database it never was
     created, which is why the automated path cannot map a SKU and the admin
     button's browser-side map is the one that mattered. Fall back rather
     than fail. */
  const map = await get("product_map?select=*&order=drucka_id").catch(() => []);
  return { orders, map };
}

/* ── the payload assembly, mirroring api/_lib/fulfill.js ──
   The lines below are the same construction fulfillFromDb() performs before
   handing the object to qikinkFetch(); only the side effects are absent. If
   fulfill.js's payload ever changes, this has to follow it — the sanitizer
   itself (toQikinkOrderPayload) is imported, not copied, so the final shape
   is guaranteed to match whatever the app actually sends. */
function buildPayload(order, map) {
  const notes = [];
  const line_items = [];
  for (const item of order.items ?? []) {
    const m = (map ?? []).find((x) => x.drucka_id === item.productId && x.active);
    if (!m) {
      notes.push(`no active product mapping for ${item.productId} — line item skipped`);
      continue;
    }
    const designs = [];
    for (const [side, layers] of Object.entries(item.design ?? {})) {
      if (!layers?.length) continue;
      const flattened = item.artwork?.[side];
      const urls = [];
      if (flattened) {
        urls.push(flattened);
      } else {
        /* the live path uploads each raw image layer to Cloudinary here; this
           script must not upload, so it reports the gap instead of inventing
           a URL that was never sent */
        const n = (layers ?? []).filter((l) => l.type === "image" && l.src?.startsWith("data:")).length;
        notes.push(`${item.productId}/${side}: no flattened artwork stored — the live send uploaded ${n} raw layer(s), whose URLs are not recoverable from the order row`);
      }
      designs.push({
        placement: side,
        width_inches: item.printSize?.[side]?.w ?? "",
        height_inches: item.printSize?.[side]?.h ?? "",
        design_link: urls[0] ?? null,
        all_artwork: urls,
      });
    }
    line_items.push({
      search_from_my_products: 0,
      qikink_product_id: m.qikink_product_id,
      sku: String(m.sku_pattern ?? "")
        .replace("{color}", item.color ?? "white")
        .replace("{size}", item.size ?? ""),
      print_type: m.print_method,
      quantity: item.qty,
      price: item.price,
      custom_size: item.customSize ?? null,
      designs,
    });
  }

  const raw = {
    order_number: order.id,
    brand_name: "Drucka",
    gateway: order.paymentMode === "cod" ? "COD" : "Prepaid",
    payment_status: order.paymentStatus,
    total_order_value: order.total,
    qikink_shipping: "1",
    line_items,
    shipping_address: {
      first_name: order.customer?.name,
      address1: order.customer?.address1,
      address2: order.customer?.address2 ?? "",
      city: order.customer?.city,
      province: order.customer?.state,
      zip: order.customer?.pincode,
      country_code: "IN",
      phone: order.customer?.phone,
      email: order.customer?.email,
    },
  };
  /* the app never sends `raw` — qikinkFetch sanitizes it first, and that is
     the object Qikink received */
  return { sent: toQikinkOrderPayload(raw), notes };
}

/* ── redaction ── */
const keepShape = (s, filler = "x") => String(s ?? "").replace(/[^\s]/g, filler);
const redactUrl = (u) => {
  if (!u) return u;
  const [base] = String(u).split("?");
  return base + (String(u).includes("?") ? "?<signature-removed>" : "");
};
function redact(payload) {
  const p = structuredClone(payload);
  const a = p.shipping_address ?? {};
  p.shipping_address = {
    ...a,
    first_name: a.first_name ? "<customer name>" : "",
    last_name: a.last_name ? "<surname>" : "",
    address1: a.address1 ? keepShape(a.address1) : "",
    address2: a.address2 ? keepShape(a.address2) : "",
    city: a.city ? "<city>" : "",
    province: a.province ? "<state>" : "",
    zip: a.zip ? keepShape(a.zip, "9") : "",
    phone: a.phone ? keepShape(a.phone, "9") : "",
    /* the customer's own address goes through whenever they gave one — only
       the Drucka fallback (used when they did not) is safe to show */
    email: a.email === "orders@drucka.in" ? a.email : "<customer email>",
  };
  for (const li of p.line_items ?? [])
    for (const d of li.designs ?? []) {
      d.design_link = redactUrl(d.design_link);
      d.mockup_link = redactUrl(d.mockup_link);
    }
  return p;
}

/* ── run ── */
let { orders, map } = flag("--file")
  ? await (async () => {
      const parsed = JSON.parse(await readFile(value("--file"), "utf8"));
      return Array.isArray(parsed)
        ? { orders: parsed, map: [] }
        : { orders: parsed.orders ?? [], map: parsed.product_map ?? parsed.map ?? [] };
    })()
  : await fromSupabase(Number(value("--last", "3")));

if (flag("--map-from-app") || !map?.length) {
  map = await mapFromApp(value("--map-from-app", "src/App.jsx"));
  console.log(`(product map: ${map.length} entries from the app's built-in QIKINK_PRODUCT_MAP)`);
}

if (!orders.length) {
  console.error("No orders with a qikink_order_id found.");
  process.exit(1);
}

for (const row of orders) {
  const order = {
    id: row.id,
    items: row.items,
    total: row.total,
    customer: row.customer,
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
  };
  const { sent, notes } = buildPayload(order, map);
  console.log(`\n${"═".repeat(72)}`);
  console.log(`Drucka order ${row.id}   →   Qikink order_id ${row.qikink_order_id ?? "(none)"}`);
  console.log(`POST {sandbox|api}.qikink.com/api/order/create`);
  console.log(`Headers: Content-Type: application/json · ClientId: <redacted> · Accesstoken: <redacted>`);
  if (notes.length) console.log(`⚠ ${notes.join("\n⚠ ")}`);
  console.log(`${"─".repeat(72)}`);
  console.log(JSON.stringify(REDACT ? redact(sent) : sent, null, 2));
}
console.log(
  REDACT
    ? "\n(Customer details and artwork signatures redacted. Re-run with --raw to see them — do not paste raw output into a ticket.)"
    : "\n⚠ RAW OUTPUT — contains customer PII. Do not paste into a support ticket."
);
