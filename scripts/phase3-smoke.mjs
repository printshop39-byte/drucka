#!/usr/bin/env node
/* Phase 3 acceptance smoke test — RUN ON STAGING, never production.
   Drives the HTTP-observable, deterministic lifecycle assertions:
     1) COD placed        → Queued
     2) COD approved      → Ready   (+ double-approval idempotency)
     5) drain (unmapped)  → Failed + last_error, no qikink_order_id
   Scenario 4 (Qikink success), 6 (Dead Letter) and the concurrency/webhook
   invariants are manual — see TESTS.md.

   Usage:
     BASE_URL="https://<staging>.vercel.app" ADMIN_SECRET="..." CRON_SECRET="..." \
       node scripts/phase3-smoke.mjs
   Node 18+ (global fetch). No dependencies. */
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const ADMIN = process.env.ADMIN_SECRET || "";
const CRON = process.env.CRON_SECRET || "";
if (!ADMIN) {
  console.error("✗ Set ADMIN_SECRET (and BASE_URL) before running.");
  process.exit(2);
}

const call = async (path, opts = {}) => {
  const res = await fetch(`${BASE}${path}`, opts);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
};
const adminHeaders = () => ({ "x-admin-secret": ADMIN, "Content-Type": "application/json" });

async function getOrder(id) {
  const r = await call("/api/orders", { headers: { "x-admin-secret": ADMIN } });
  assert.equal(r.body?.ok, true, "admin GET /api/orders ok");
  const o = (r.body.orders ?? []).find((x) => x.id === id);
  assert.ok(o, `order ${id} present in admin list`);
  return o;
}

// A COD order using a deliberately UNMAPPED product → deterministic Qikink failure,
// so the send fails without needing a real Qikink SKU.
function makeOrder() {
  const id = `TEST-${Date.now().toString(36).toUpperCase()}`;
  return {
    id,
    customer: {
      name: "Test Buyer", phone: "9999999999", address1: "1 Test St",
      city: "Kolhapur", state: "Maharashtra", pincode: "416001", email: "orders@drucka.in",
    },
    items: [{
      productId: "__no_such_product__", name: "Unmapped Test", qty: 1, price: 100,
      color: "white", size: "M",
      design: { front: [{ type: "image", src: "data:image/png;base64,iVBORw0KGgo=" }] },
    }],
    total: 100,
    paymentMode: "cod",
    paymentStatus: "COD Pending Approval",
    qikinkStatus: "Draft",
    qikinkOrderId: null,
  };
}

async function main() {
  const order = makeOrder();
  console.log(`→ staging ${BASE}, test order ${order.id}`);

  // 1) place → Queued
  let r = await call("/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order),
  });
  assert.equal(r.body?.ok, true, "1: place order ok");
  let o = await getOrder(order.id);
  assert.equal(o.qikinkStatus, "Queued", "1: COD placed → Queued");
  console.log("✓ 1  COD placed → Queued");

  // 2) approve → Ready
  r = await call("/api/orders/approve-cod", {
    method: "POST", headers: adminHeaders(), body: JSON.stringify({ id: order.id }),
  });
  assert.equal(r.body?.qikink_status, "Ready", "2: approve → Ready (response)");
  o = await getOrder(order.id);
  assert.equal(o.qikinkStatus, "Ready", "2: status Ready after approve");
  assert.equal(o.paymentStatus, "COD Approved", "2: payment_status COD Approved");
  console.log("✓ 2  COD approved → Ready");

  // 2b) double approval is idempotent
  r = await call("/api/orders/approve-cod", {
    method: "POST", headers: adminHeaders(), body: JSON.stringify({ id: order.id }),
  });
  assert.equal(r.body?.alreadyApproved, true, "2b: double approve → alreadyApproved (no re-enqueue)");
  console.log("✓ 2b double approval idempotent");

  // 5) drain → Failed (unmapped product fails deterministically)
  r = await call("/api/cron/poll-orders", {
    headers: CRON ? { Authorization: `Bearer ${CRON}` } : {},
  });
  assert.equal(r.body?.ok, true, "5: cron ran");
  o = await getOrder(order.id);
  assert.equal(o.qikinkStatus, "Failed", "5: Qikink failure → Failed");
  assert.ok(o.lastError, "5: last_error populated (never silent)");
  assert.ok(!o.qikinkOrderId, "5: no qikink_order_id on failure");
  console.log(`✓ 5  Qikink failure → Failed (last_error: ${String(o.lastError).slice(0, 60)}…)`);

  console.log("\nPASS — HTTP-observable Phase 3 checks (1, 2, 2b, 5).");
  console.log("Manual (TESTS.md): 4 Sent to Qikink, 6 Dead Letter, concurrent-cron + duplicate-webhook invariants.");
}

main().catch((err) => {
  console.error("\n✗ FAIL:", err.message);
  process.exit(1);
});
