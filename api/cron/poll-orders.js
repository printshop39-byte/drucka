/* GET /api/cron/poll-orders — Vercel Cron sweep.

   Polls every in-flight order's Qikink status, keeps Supabase fresh, and
   (via the shared syncOrderStatus) fires the COD Purchase the moment an
   order is delivered. Configured in vercel.json → crons.

   Secured by CRON_SECRET: Vercel automatically sends
   `Authorization: Bearer <CRON_SECRET>` when that env var is set. If it's
   unset the route stays open (fine for staging) — set it in production. */
import { sb } from "../_lib/supabase.js";
import { syncOrderStatus, IN_FLIGHT } from "../_lib/orderStatus.js";
import { fulfillFromDb } from "../_lib/fulfill.js";

const enc = encodeURIComponent;

/* PASS 1 — drain the fulfilment queue: any enqueued order whose retry time has
   arrived. fulfillFromDb() self-guards with an optimistic lock + qikink_order_id
   check, so two overlapping cron runs cannot double-send. Errors are per-order:
   one order's failure must not abort the sweep. */
async function drainFulfilmentQueue() {
  const nowIso = new Date().toISOString();
  const rows = await sb(
    `orders?select=id&qikink_status=in.(${enc('"Ready","Failed"')})` +
      `&payment_status=in.(${enc('"Paid","COD Approved"')})` +
      `&next_retry_at=lte.${enc(nowIso)}&limit=100`
  ).catch(() => []);

  const results = [];
  for (const r of rows ?? []) {
    try {
      const out = await fulfillFromDb(r.id);
      results.push({ id: r.id, ...out });
    } catch (err) {
      results.push({ id: r.id, error: err.message });
    }
  }
  return results;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    // PASS 1: send/retry enqueued orders.
    const fulfilled = await drainFulfilmentQueue();

    // PASS 2: existing shipment-status poll (UNCHANGED).
    const inList = IN_FLIGHT.map((s) => `"${s}"`).join(",");
    const rows = await sb(
      `orders?qikink_order_id=not.is.null&qikink_status=in.(${encodeURIComponent(inList)})&select=id,qikink_order_id&limit=500`
    );

    let delivered = 0;
    const results = [];
    for (const r of rows ?? []) {
      try {
        const out = await syncOrderStatus({ qikinkOrderId: r.qikink_order_id, druckaOrderId: r.id });
        if (out.druckaStatus === "Delivered") delivered += 1;
        results.push({ id: r.id, status: out.druckaStatus });
      } catch (err) {
        // one order's Qikink hiccup must not abort the whole sweep
        console.error(`poll-orders: ${r.id} failed:`, err.message);
        results.push({ id: r.id, error: err.message });
      }
    }

    res.json({ ok: true, fulfilled: fulfilled.length, polled: results.length, delivered, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
