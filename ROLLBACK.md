# Phase 3 Rollback Plan — Order Trigger Layer

> Read this BEFORE touching trigger logic. Phase 3 rewires how orders reach Qikink
> (COD approval + payment webhook + cron drain). This is the highest-risk phase.
> Target: revert to the old manual flow in **under 5 minutes**, with no data loss.

## What Phase 3 changes (blast radius)

| File | Change | Reversible? |
|---|---|---|
| `api/orders.js` | COD POST → `qikink_status="Queued"` (+ `ORDER_CREATED` event) | yes (git revert) |
| `api/orders/approve-cod.js` (new) | admin approval → `COD Approved` + `Ready` | yes (delete file) |
| `api/cron/poll-orders.js` | new queue-drain pass (shipment poll untouched) | yes (git revert) |
| `api/razorpay/webhook.js` | payment → enqueue `Ready`; removed direct `fulfillFromDb()` | yes (git revert) |

Phase 1 (schema) and Phase 2 (`fulfill.js`, `events.js`) are **left in place** on rollback —
they are inert without the triggers and safe to keep.

## Fastest rollback (no code, ~2 min) — PREFERRED

1. **Vercel → Deployments → the last pre-Phase-3 deployment → "Promote to Production".**
   This instantly restores the previous behavior on the live URL.
2. Confirm `AUTO_SEND_ON_PAID` is **false** (Vercel → Settings → Env). It should already be.
3. Done. The old admin **"Send to Qikink"** button (still present until Phase 4) is the manual
   fulfillment path again.

## Code rollback (git, ~5 min)

1. Revert the four files to the pre-Phase-3 commit:
   ```
   git revert <phase3-commit>        # or: git checkout <pre-phase3-sha> -- \
     api/orders.js api/cron/poll-orders.js api/razorpay/webhook.js
   git rm api/orders/approve-cod.js
   git commit && git push            # Vercel auto-deploys
   ```
2. Verify the deployment is live and `/api/orders` POST returns the old shape.

## Cron: how to disable the drain immediately

- **Option 1 (no deploy):** Vercel → Settings → Cron Jobs → disable `/api/cron/poll-orders`.
- **Option 2 (env kill-switch):** the cron is already gated by `CRON_SECRET`
  (`api/cron/poll-orders.js:14-16`); rotating/removing it does **not** stop scheduled runs, so
  prefer Option 1 or revert `poll-orders.js` (removes the drain pass; shipment poll returns to
  daily-only).
- The drain only *reads* `Ready`/`Failed` rows and calls the idempotent `fulfillFromDb()`, so a
  stray run cannot double-send (optimistic lock + `qikink_order_id` guard).

## DB changes — all reversible / safe to leave

- Phase 1 columns (`fulfill_attempts`, `next_retry_at`), the `order_events` table, and the
  `qikink_status` CHECK are **additive**. Leaving them after rollback is harmless; the old code
  simply ignores them.
- If a full DB revert is ever required (not needed for rollback):
  ```sql
  alter table public.orders drop constraint if exists orders_qikink_status_chk;
  alter table public.orders drop column if exists fulfill_attempts;
  alter table public.orders drop column if exists next_retry_at;
  drop table if exists public.order_events;
  ```
- **In-flight order states after rollback:** orders left in `Queued`/`Ready`/`Sending`/`Failed`/
  `Dead Letter` are handled by the old manual flow — the operator uses "Send to Qikink"
  (`api/qikink/create-order.js`), which is idempotent (`create-order.js:20-22` short-circuits on
  an existing `qikink_order_id`), so no duplicate is created at Qikink.

## Post-rollback checklist

- [ ] Live deployment is the pre-Phase-3 build.
- [ ] `AUTO_SEND_ON_PAID=false`.
- [ ] A test COD order can still be fulfilled via the manual "Send to Qikink" button.
- [ ] No order is stuck: any `Ready`/`Failed`/`Queued` order can be sent manually.
- [ ] Cron drain is disabled or reverted.
