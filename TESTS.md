# Phase 3 Acceptance Tests — Order Trigger Layer

> **Run on STAGING only.** Do not run against production. See `ROLLBACK.md` before deploying.
> Deploy order: Phase 1 migration → Phase 2 → Phase 3 → **these tests on staging** → production.

## How to inspect state
- **`qikink_status`, `last_error`, `qikink_order_id`** → admin `GET /api/orders`
  (header `x-admin-secret: <ADMIN_SECRET>`).
- **`fulfill_attempts`, `next_retry_at`, `order_events` timeline** → Supabase Table Editor / SQL
  (these aren't in the admin API until Phase 4).

## Prerequisites
- Phase 1 migration applied to the **staging** Supabase project.
- One **mapped + active** product in `product_map` (for the success path) and use a bogus
  `productId` (e.g. `__no_such_product__`) for the deterministic failure path.

---

## Core matrix (6 scenarios)

| # | Scenario | Action | Expected |
|---|----------|--------|----------|
| 1 | COD order placed | `POST /api/orders` (paymentMode `cod`) | `qikink_status = "Queued"` |
| 2 | COD approved | `POST /api/orders/approve-cod {id}` (admin) | `payment_status="COD Approved"`, `qikink_status="Ready"`, `next_retry_at` set |
| 3 | Cron picks order | `GET /api/cron/poll-orders` | order claimed → `order_events` gains `FULFILLMENT_STARTED` (state `Sending` is transient within the run) |
| 4 | Qikink success | drain a **mapped** paid/approved order | `qikink_status="Sent to Qikink"`, `qikink_order_id` set, event `QIKINK_SUCCESS` |
| 5 | Qikink failure | drain an **unmapped** order | `qikink_status="Failed"`, `fulfill_attempts=1`, `next_retry_at≈now+1m`, `last_error` set, events `QIKINK_FAILED`+`RETRY_SCHEDULED` |
| 6 | 6+ failures | force repeated failures (below) | `qikink_status="Dead Letter"`, `[fulfill-dead-letter]` log line, event `DEAD_LETTER` |

> **Scenario 4 depends on a working Qikink sandbox SKU** (ticket #116250 / real SKU). Until that
> is confirmed, scenario 4 cannot fully pass; scenarios 1,2,3,5,6 are deterministic without it.

### Forcing scenario 6 (Dead Letter) deterministically
The backoff ladder gates re-tries by `next_retry_at`, so fast-forward it between drains:
```sql
-- after each failed drain, in Supabase SQL Editor:
update public.orders set next_retry_at = now() where id = '<TEST_ID>';
```
Then re-run `GET /api/cron/poll-orders`. Repeat until `fulfill_attempts` exceeds the ladder
(`RETRY_MINUTES` has 6 entries → the 7th attempt dead-letters). Confirm final
`qikink_status='Dead Letter'`.

---

## Idempotency invariants (must all hold)

| Invariant | How to test | Expected |
|---|---|---|
| **Double approval → no duplicate send** | call `approve-cod` twice | 2nd returns `alreadyApproved:true`; only one `Ready`; only one `QIKINK_SUCCESS` ever |
| **Concurrent cron → no duplicate send** | hit `GET /api/cron/poll-orders` twice back-to-back on a single `Ready` order | exactly one worker claims (`Ready→Sending`); the other skips; one `qikink_order_id`, one `QIKINK_SUCCESS` |
| **Duplicate payment webhook → no duplicate send** | POST the same signed `payment.captured` twice | 1st: `Draft→Paid+Ready`; 2nd: 0 rows (not `Draft`) → no re-enqueue, no 2nd send |

Why they hold (design, not luck):
- Approval PATCH is filtered on `qikink_status=eq.Queued` → 2nd approval affects 0 rows.
- `fulfillFromDb()` claims with an optimistic lock (`Ready|Failed → Sending`); a 2nd concurrent
  worker sees 0 rows and exits; and it returns early if `qikink_order_id` is already set.
- Webhook PATCH is filtered on `qikink_status=eq.Draft` → a re-delivery after enqueue is a no-op.

---

## Automated smoke test
`scripts/phase3-smoke.mjs` drives the HTTP-observable deterministic checks (scenarios 1, 2, 5 +
the double-approval invariant):
```bash
BASE_URL="https://<staging>.vercel.app" ADMIN_SECRET="..." CRON_SECRET="..." \
  node scripts/phase3-smoke.mjs
```
It uses an **unmapped** product so the send fails deterministically (no real Qikink SKU needed).
Success (scenario 4), Dead Letter (scenario 6), and the concurrency/webhook invariants are
verified manually per the tables above.

---

## Sign-off checklist
- [ ] 1 Queued · 2 Ready · 3 claimed · 5 Failed+metadata · 6 Dead Letter — all pass on staging.
- [ ] 4 Sent to Qikink — passes once a real sandbox SKU is available (else explicitly deferred).
- [ ] All three idempotency invariants hold.
- [ ] No `qikink_status` or `payment_status` change is visible in the customer UI (Phase 4 owns UI).
- [ ] `ROLLBACK.md` steps rehearsed once on staging.
