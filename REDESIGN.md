# ADR-0001 — Order Lifecycle Redesign (Queue + Approval-Triggered Fulfillment)

- **Status:** Accepted (design frozen — Phase 1 in progress)
- **Date:** 2026-07-07
- **Owner:** printshop39
- **Trigger execution decision:** **Cron-first (Option B)**. `waitUntil` is a Phase-5 optimization, not a dependency of Phases 1–4.
- **Scope:** How a Drucka order travels from checkout to Qikink, including COD approval,
  online payment, idempotency, automatic retries, and observability.

> This document is the frozen contract for the redesign. Implementation happens in phases
> (see §11). Do not expand scope during implementation without updating this ADR.

---

## 1. Context (why change)

Today the customer checkout and the Qikink handoff are decoupled with **no automatic trigger**
and **silent failure paths**:

- The save to Supabase is fire-and-forget and error-swallowed
  (`src/lib/orderStore.js:17-24`, called without `await` at `src/App.jsx:4044`).
- COD has **no** path to Qikink except an operator manually clicking "Send to Qikink"
  (`src/App.jsx:3943-3946` → `sendToQikink` at `src/App.jsx:4069-4087`).
- Online auto-send exists but is gated off and its failure is folded into a 200
  (`api/razorpay/webhook.js:72`, `:80`).
- There is **no retry** for a failed send. The daily cron only polls status of already-sent
  orders (`api/cron/poll-orders.js`, `api/_lib/orderStatus.js:21`).
- Artwork upload + Qikink create currently run **client-side**
  (`src/lib/orderStore.js:41-68`, `api/qikink/create-order.js`).

The one thing already correct and reusable: **`fulfillFromDb(orderId)`**
(`api/_lib/fulfill.js:18`) is a complete, server-side, **idempotent**
(`api/_lib/fulfill.js:22`), **loud-on-failure** (`api/_lib/fulfill.js:95-102`) engine that
uploads artwork from the persisted order row (`supabase/schema.sql:6`) and creates the Qikink
order. The redesign keeps this as the **single source of truth** and builds triggers, a queue,
retries, and logging around it.

---

## 2. Decision (summary)

1. **`fulfillFromDb()` is the only path to Qikink.** All client-side Qikink/Cloudinary calls
   are removed.
2. **The `orders` table is the queue.** A row's `qikink_status` is its queue state.
3. **Triggers are async and never block on Qikink:**
   - COD: **admin approval** atomically moves the order to `Ready` and returns immediately.
   - Online: the **Razorpay webhook** moves the paid order to `Ready`.
4. **Execution is hybrid:** an immediate **background kick** attempts fulfillment right after
   enqueue; a **cron safety net** drains anything the kick missed.
5. **Automatic retries** with a capped backoff ladder; exhausted orders go to **Dead Letter**.
6. **A `Retry Fulfillment` rescue action** (Dead Letter only) re-enqueues — this is the
   deliberate replacement for the removed "Send to Qikink" button.
7. **No silent failures** anywhere; every order carries a **timeline of events**.

---

## 3. State machine (simplified — 6 core states)

| `qikink_status` | Meaning | Eligible for worker? |
|---|---|---|
| `Queued` | Saved; COD awaiting approval | ❌ |
| `Ready` | Approved / paid — enqueued for pickup | ✅ |
| `Sending` | Worker holds the lock; Qikink call in flight | (claimed) |
| `Sent to Qikink` | Success — handed to Qikink | ❌ (moves to poll flow) |
| `Failed` | Attempt failed, `attempts < 6`, `next_retry_at` set | ✅ when due |
| `Dead Letter` | `attempts ≥ 6` — terminal until manual rescue | ❌ (until Retry Fulfillment) |

Downstream (unchanged, set by the status poll): `In Production → Shipped → Delivered`.

> `Failed` + `attempts` + `next_retry_at` fully expresses "retry pending" and "retrying".
> Separate `Retry Scheduled` / `Retrying` states are intentionally **not** used — it keeps
> queries and the admin dashboard simple.

```
Customer → Place Order → Supabase (Queued)
                              │
        Approve COD  ─────────┤
        Payment Success ──────┘
                              ↓
                           Ready
                              ↓
                   ┌── Background Kick ──┐   (immediate; may fail)
                   │                     │
                   └───────► Cron ◄──────┘   (safety net; drains due rows)
                              ↓
                           Sending  (worker lock)
                              ↓
                            Qikink
                    ┌─────────┴─────────┐
                    ↓                   ↓
              Sent to Qikink          Failed ──► retry ladder ──► Dead Letter
                    ↓                                                  ↓
        In Production → Shipped → Delivered                  Retry Fulfillment (admin)
                                                                       ↓
                                                                     Ready
```

---

## 4. Triggers (async, transactional)

### 4.1 COD approval — new `POST /api/orders/approve-cod` (admin-only)
- Guard: order is COD and currently `Queued`; requires admin secret
  (same check as `api/orders.js:49-50`).
- **Atomic single-row PATCH** (this is the "transaction/commit"):
  `payment_status="COD Approved"`, `qikink_status="Ready"`, `next_retry_at=now()`.
- **Return 200 immediately.** Never calls Qikink inline — a slow Qikink can never slow approval.
- Then fire the background kick (§5).

### 4.2 Online payment — `api/razorpay/webhook.js`
- Remove the `AUTO_SEND_ON_PAID` gate (`api/razorpay/webhook.js:72`).
- On `payment.captured`/`order.paid`: PATCH `payment_status="Paid"`, `qikink_status="Ready"`.
- Return 200 to Razorpay fast; fire the background kick. (No inline `fulfillFromDb`.)

**The approval gate is preserved** because the worker only picks rows with
`payment_status ∈ {Paid, COD Approved}`. A `Queued` COD order at `COD Pending Approval`
is never sent until an admin approves it (also enforced at `api/_lib/fulfill.js:23`).

---

## 5. Execution — cron-first, with an optional kick later

**Shipped approach (Phases 1–4): cron-only.** The trigger enqueues (`Ready`) and returns; the
`api/cron/poll-orders.js` drain pass is the sole worker. No extra dependency, simplest to debug,
stable in production. Approval-to-send latency ≈ the cron interval.

**Phase 5 (optional optimization):** add a **background kick** — after enqueue, run
`fulfillFromDb(orderId)` in the request background **after the response is flushed**, via
`waitUntil()` (`@vercel/functions`), for near-instant fulfillment. The cron remains the safety
net, so the two are never a single point of failure (kick fails → cron catches it). This layers
on cleanly without changing the queue model.

Cron drain query:
```
qikink_status IN ('Ready','Failed')
  AND payment_status IN ('Paid','COD Approved')
  AND (next_retry_at IS NULL OR next_retry_at <= now())
  AND fulfill_attempts < 6
```

> **Open decision (not verifiable from repo):** `waitUntil` needs the `@vercel/functions`
> package (not currently in `package.json`); a minutely cron needs a Vercel plan that allows it
> (Hobby ≈ daily). See §12.

---

## 6. Idempotency (kept — 4 layers)

1. **Duplicate row:** client-generated PK + upsert `on_conflict=id,merge-duplicates`
   (`api/orders.js:23-26`, `supabase/schema.sql:3`).
2. **Duplicate Qikink order:** skip create if `qikink_order_id` is already set
   (`api/_lib/fulfill.js:22`).
3. **Concurrent double-send:** **new** optimistic-lock claim — `PATCH ... SET qikink_status='Sending'
   WHERE id=X AND qikink_status IN ('Ready','Failed') RETURNING representation`; proceed only if a
   row is returned. Stops the background kick and the cron from racing the same order.
4. **Qikink-side:** rely on unique `order_number` — **confirm Qikink dedupes a repeat
   `order_number`** (Qikink docs; see §12).

---

## 7. Retry ladder

Set on each failure in `api/_lib/fulfill.js` (~`:97`):

| Attempt | Wait before next |
|---|---|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 15 minutes |
| 4 | 30 minutes |
| 5 | 1 hour |
| 6 | 6 hours |
| ≥6 failed | → `Dead Letter` + alert |

On failure: `fulfill_attempts++`, `next_retry_at = now() + ladder[attempt]`,
`last_error = <message>`, `qikink_status = 'Failed'` (or `'Dead Letter'` at the cap).
On success: clear `last_error`, set `qikink_order_id` + `Sent to Qikink`.

---

## 8. Observability — per-order event timeline (new)

A support-friendly timeline so an operator sees an order's history instead of grepping logs.

- **New table `order_events`:** `(id bigserial pk, order_id text, event text, detail jsonb,
  created_at timestamptz default now())`, index on `(order_id, created_at)`.
- **New helper `logEvent(orderId, event, detail?)`** in `api/_lib/` — a best-effort insert;
  a logging write failure falls back to `console` and **never** affects order state (the
  `orders` row remains the source of truth).
- **Emit at each transition**, e.g.:
  `Order Created → Saved to DB → COD Approved → Worker Picked → Upload Started →
   Upload Success → Qikink Request → Qikink Accepted` (or `Qikink Failed: <reason>`).
- **Surface** the timeline in the admin panel (read via an admin-gated endpoint).

Example:
```
10:15  Order Created
10:16  Saved to DB
10:17  COD Approved
10:17  Worker Picked
10:17  Upload Started
10:18  Upload Success
10:18  Qikink Request
10:18  Qikink Accepted
```

---

## 9. Never-silent policy (specific fixes)

| Silent site today | Fix |
|---|---|
| `src/lib/orderStore.js:21-23` (`catch → "local"`) | remove swallow; let `saveOrder` reject |
| `src/lib/orderStore.js:33-35` (`syncOrderPatch` swallow) | surface error to caller |
| `src/App.jsx:4044` (save not awaited) | `await`; on reject show toast + mark "unsynced" |
| `api/razorpay/webhook.js:80` (fulfill error → 200) | keep 200 ack, but leave order `Failed`+`next_retry_at` (retryable, visible) |
| Dead Letter (`attempts ≥ 6`) | grep-able alert line, e.g. `[fulfill-dead-letter] order=<id>` |
| every transition | `order_events` entry (§8) |

---

## 10. Files to change

| # | File · anchor | Change |
|---|---|---|
| 1 | **new** `supabase/schema-redesign.sql` ✅ done | `fulfill_attempts`, `next_retry_at`; partial fulfillment-queue index; `qikink_status` CHECK ("enum", NOT VALID); `order_events` table + index. Idempotent migration, separate from the already-run `schema-update.sql` |
| 2 | `api/orders.js:23-40` | COD POST → `qikink_status="Queued"`; emit `Order Created`/`Saved to DB` events |
| 3 | **new** `api/orders/approve-cod.js` | admin-only; atomic enqueue (`COD Approved`+`Ready`); return; background kick |
| 4 | **new** `api/orders/retry-fulfillment.js` | admin-only rescue; Dead Letter → `Ready`, reset `attempts`, clear `last_error` |
| 5 | **new** `api/_lib/events.js` | `logEvent(orderId, event, detail?)` best-effort helper |
| 6 | `api/_lib/fulfill.js:18`, `:90-102` | optimistic-lock claim; ladder backoff; `Failed` vs `Dead Letter`; alert; event emits; clear on success |
| 7 | `api/cron/poll-orders.js:18-38` | add drain pass (query in §5) |
| 8 | `vercel.json:22` | cron cadence per §12 decision |
| 9 | `api/razorpay/webhook.js:72`, `:80` | remove `AUTO_SEND_ON_PAID` gate; enqueue `Ready`; background kick |
| 10 | `src/lib/qikinkClient.js:29-48` | add `approveCod(id)`, `retryFulfillment(id)`; drop `uploadArtwork`/`createOrder` |
| 11 | `src/App.jsx:3939-3946`, `:4015-4058`, `:4069-4087`, `:352-353` | Approve → `approveCod`; **remove Send button**, add **Retry Fulfillment** (Dead Letter only); await save + surface errors; retire `sendToQikink`; register new statuses |
| 12 | `src/lib/orderStore.js:17-36` | stop swallowing; retire `fulfillOrder` |

**Retire (dead after cutover):** `api/qikink/create-order.js` and the client artwork-upload path
(`src/lib/orderStore.js:41-68`, `src/lib/qikinkClient.js:35-48`).

**Optional dependency:** `@vercel/functions` for `waitUntil` (§5).

---

## 11. Phased implementation plan (frozen order)

- **Phase 1 — Schema** ✅ done: retry columns + partial index + status CHECK + `order_events`. *(file 1)* — *migration must be run in Supabase SQL Editor.*
- **Phase 2 — Engine** ✅ done (infra only, no behavior change): `events.js` best-effort `logEvent` + `EVENTS`; `fulfill.js` optimistic lock (`Ready|Failed → Sending`), `RETRY_MINUTES` ladder `[1,5,15,30,60,360]`, `Failed`/`Dead Letter`, dead-letter alert, per-transition events. *(files 5, 6)*
- **Phase 3 — Trigger (cron-first)** ✅ code done (staging verification pending): `orders.js` COD → `Queued` + `ORDER_CREATED`; new `approve-cod.js` atomic idempotent enqueue; `poll-orders.js` PASS-1 drain (shipment poll untouched); `webhook.js` payment → atomic `Draft→Paid+Ready` enqueue, direct `fulfillFromDb` removed. Ships with `ROLLBACK.md`, `TESTS.md`, `scripts/phase3-smoke.mjs`. No `waitUntil`, no UI change. *(files 2, 3, 7, 8, 9)*
  - **Known gap (not in scope; decide before/after Phase 4):** if a worker crashes after the claim (`Sending`) but before success/fail, the order is stuck in `Sending` (outside the drain filter). A "reclaim stale `Sending` older than N min → `Failed`" sweep in `poll-orders.js` closes this. Low probability (serverless mid-fulfil crash), but worth a follow-up.
- **Phase 4 — UI**: Approve → `approveCod`; **remove Send button**; **Retry Fulfillment on `Dead Letter` only**; await save + surface errors; retire client send path; order timeline in admin. *(files 4, 10, 11, 12)*
- **Phase 5 — Optional** `waitUntil` latency optimization (§5), independent of correctness.

Phases 1–2 have no user-facing change and are independently testable. Retire the client
artwork-upload path + `create-order.js` at the end of Phase 4.

---

## 12. Decision log (resolved 2026-07-07)

1. **Worker execution → RESOLVED: cron-first (Option B).** Ship cron-only for Phases 1–4; no new
   dependency. `waitUntil` is a Phase-5 optimization only. (Cron cadence still depends on the
   Vercel plan — set in Phase 3.)
2. **Retry Fulfillment scope → RESOLVED: `Dead Letter` only.** `Failed` orders retry
   automatically; operators do not intervene mid-ladder.
3. **Qikink `order_number` dedup → DEFERRED (does not block).** DB idempotency + optimistic lock
   guarantee we never send a duplicate regardless; confirming Qikink's own dedup is a later bonus.
   *Qikink docs, not in repo.*
4. **COD approval authority → RESOLVED: unchanged.** Approval stays a manual admin action; no
   auto-approval threshold.

---

## 13. Verification checklist (acceptance)

- COD stays `Queued` until approval; approving flips it `Ready → Sending → Sent to Qikink`.
- Online paid order enqueues `Ready` and fulfills without a manual step.
- Forced Qikink failure → `Failed` and auto-recovers via the ladder; after 6 → `Dead Letter` + alert.
- `Retry Fulfillment` on a Dead Letter order re-enqueues and succeeds.
- Double-fire (kick + cron together, or repeated approval) → **no duplicate** at Qikink.
- Every order shows a complete `order_events` timeline.
- No code path swallows a failure (§9).

---

## 16. Phase 4 entry review (do BEFORE any UI code)

Phases 1–3 were designed on assumptions; staging verification may have moved them. Re-read this
ADR and answer before starting Phase 4:

1. **Which Phase 1–3 assumptions changed during verification?** (e.g. cron cadence, Qikink payload
   shape, status values, latency.) Update the ADR to match reality before building UI on top.
2. **Did verification surface new edge cases?** (partial artwork, timeouts, unexpected Qikink
   responses, race conditions.) Capture each as a note or ticket.
3. **TICKET-001 — still Phase 4.5, or fix before Phase 4?** If any *organic* stuck `Sending`
   appeared in staging/production monitoring, promote it to a pre-Phase-4 hotfix.

Do not start UI development until these three are answered in writing.

## 15. Tickets

### TICKET-001 — Stuck `Sending` after mid-fulfil crash (target: Phase 4.5 / hotfix, NOT Phase 4)
- **Status:** Open — deterministically reproducible (see `VERIFICATION.md` → Stuck-`Sending`).
- **Symptom:** if a worker wins the optimistic-lock claim (`Ready|Failed → Sending`) but the
  serverless function dies before writing success/failure, the order stays `Sending`. The cron
  drain filters on `Ready`/`Failed`, so it is never retried — a silently stuck order.
- **Fix (not to be built in Phase 4):** add a reclaim sweep to `api/cron/poll-orders.js` —
  `qikink_status='Sending' AND updated_at < now() - interval 'N min' → 'Failed'` (needs an
  `updated_at`/`claimed_at` timestamp on the claim). Then it re-enters the retry ladder.
- **Interim:** an operator can manually reset a stuck `Sending` order to `Ready` (same SQL as
  Gate 5 recovery).

## 14. Consequences

- **Positive:** one fulfillment code path; resilient to Qikink/Cloudinary/network outages;
  operator-recoverable without DB edits; observable timelines; no silent data loss.
- **Cost:** a few new columns/tables, one optional dependency, and a faster cron cadence.
- **Rollback:** the client artwork-upload path and `create-order.js` are retired only in the
  final phase, so earlier phases are reversible; feature-flag the new Approve/Retry endpoints
  if a staged rollout is desired.
