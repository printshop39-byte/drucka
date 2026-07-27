# Phase 3 → Phase 4 Stage Gate (Staging Sign-off)

> **STOP: no new feature code past Phase 3 until every row below is GREEN.**
> Run everything on **staging**. Companion docs: `TESTS.md` (scenarios), `ROLLBACK.md` (revert),
> `scripts/phase3-smoke.mjs` (automated HTTP checks). Fill in ☐ → ✅/❌ + date + who.
>
> Inspect DB with the Supabase SQL Editor (staging project). Replace `<ID>` with your test order id.

## Deploy prerequisite
- [ ] Phase 1 migration (`supabase/schema-redesign.sql`) applied to **staging** Supabase.
- [ ] Phase 2 + Phase 3 deployed to **staging** (not production).
- [ ] `AUTO_SEND_ON_PAID` unset/false; `CRON_SECRET` set.

---

## Gate 1 — Migration
```sql
select column_name, data_type from information_schema.columns
  where table_name='orders' and column_name in ('fulfill_attempts','next_retry_at');   -- expect 2 rows
select indexname from pg_indexes
  where tablename='orders' and indexname='orders_fulfillment_queue_idx';                -- expect 1 row
select conname from pg_constraint where conname='orders_qikink_status_chk';             -- expect 1 row
select count(*) from information_schema.columns where table_name='order_events';        -- expect 5 (id,order_id,event,detail,created_at)
```
- [ ] columns ✅ · indexes ✅ · constraint ✅ · `order_events` ✅

## Gate 2 — Queue happy path  `Queued → Ready → Sending → Sent to Qikink`
Use a **mapped, active** product. Then: place (COD) → approve → run cron.
```bash
# place → Queued ; approve → Ready ; drain
curl -s $BASE/api/orders -H 'content-type: application/json' -d @order.json
curl -s $BASE/api/orders/approve-cod -H "x-admin-secret: $ADMIN" -H 'content-type: application/json' -d '{"id":"<ID>"}'
curl -s $BASE/api/cron/poll-orders -H "authorization: Bearer $CRON"
```
```sql
select qikink_status, qikink_order_id from public.orders where id='<ID>';   -- expect 'Sent to Qikink' + non-null id
```
- [ ] Queued ✅ · Ready ✅ · claimed/Sending ✅ (see Gate 6 event) · Sent to Qikink ✅
- ⚠️ **Sent to Qikink depends on a working Qikink sandbox SKU (ticket #116250).** If unavailable,
  mark this line **DEFERRED** and rely on Gate 3 (failure path) — do not fake a pass.

## Gate 3 — Retry on failure  `Failed + attempts=1 + next_retry_at`
Use an **unmapped** product (deterministic failure). Place → approve → drain, then:
```sql
select qikink_status, fulfill_attempts, next_retry_at, last_error from public.orders where id='<ID>';
-- expect: 'Failed', 1, ≈now+1min, last_error populated (NOT null)
```
- [ ] Failed ✅ · attempts=1 ✅ · next_retry_at set ✅ · last_error not null ✅

## Gate 4 — Dead Letter after the ladder
Fast-forward the backoff between drains:
```sql
update public.orders set next_retry_at = now() where id='<ID>';   -- run before each re-drain
```
Re-run `GET /api/cron/poll-orders`, repeat until the ladder is exhausted (`RETRY_MINUTES` has 6
entries → 7th attempt dead-letters).
```sql
select qikink_status, fulfill_attempts from public.orders where id='<ID>';   -- expect 'Dead Letter'
```
Also confirm the alert in Vercel function logs: `[fulfill-dead-letter] order=<ID> ...`
- [ ] Dead Letter ✅ · `[fulfill-dead-letter]` log line ✅

## Gate 5 — Recovery from Dead Letter
> The operator-facing **Retry Fulfillment** endpoint/button is **Phase 4** (not built yet).
> Verify the *recovery path* now by manually re-enqueuing the dead-lettered order:
```sql
update public.orders set qikink_status='Ready', fulfill_attempts=0, last_error=null, next_retry_at=now()
  where id='<ID>';
```
Run `GET /api/cron/poll-orders`, then confirm it fulfills (→ `Sent to Qikink`, subject to the SKU
caveat in Gate 2).
- [ ] Dead Letter → Ready → Sent recovery ✅ (infra) · Phase-4 button verified later ☐

## Gate 6 — Event timeline
```sql
select created_at, event, detail from public.order_events where order_id='<ID>' order by created_at;
```
Expect (happy path): `ORDER_CREATED → ORDER_APPROVED → FULFILLMENT_QUEUED → FULFILLMENT_STARTED →
ARTWORK_UPLOADED → QIKINK_REQUEST → QIKINK_SUCCESS`. Failure path shows `QIKINK_FAILED →
RETRY_SCHEDULED` (and `DEAD_LETTER` at the end).
- [ ] Timeline complete and ordered ✅

## Gate 7 — Rollback drill (timed, ≤10 min)
Execute `ROLLBACK.md` on staging for real (don't just read it). Start a timer.
- [ ] Promote previous deployment (or git revert) → old flow live · **time to green: ____ (≤10 min)** ✅
- [ ] Manual "Send to Qikink" still works post-rollback ✅
- [ ] No order stuck / no duplicate created on rollback ✅

## Idempotency invariants (no duplicate Qikink orders)
- [ ] Double approval → 2nd returns `alreadyApproved`, single send ✅
- [ ] Two back-to-back `poll-orders` runs on one `Ready` order → single `qikink_order_id`, single `QIKINK_SUCCESS` ✅
- [ ] Same signed payment webhook twice → 2nd is a no-op (order not `Draft`), single send ✅

## Stuck-`Sending` reproduction (TICKET-001)
Serverless crash mid-fulfil is hard to force; simulate the resulting state and confirm the gap:
```sql
update public.orders set qikink_status='Sending' where id='<ID>';   -- as if a worker claimed then died
```
Run `GET /api/cron/poll-orders`.
```sql
select qikink_status from public.orders where id='<ID>';   -- still 'Sending' → NOT auto-recovered
```
- [ ] Reproduced (order stays `Sending`, drain ignores it) → **ADR TICKET-001 confirmed**, schedule as Phase 4.5 / hotfix (NOT Phase 4).

---

## Go / No-Go Matrix (production decision)

| Gate | Result | Blocking? |
|------|--------|-----------|
| Schema | ⬜ PASS / FAIL | **Yes** |
| Queue (`Queued→Ready→Sending→Sent`) | ⬜ PASS / FAIL / SKU-DEFERRED | **Yes** |
| Retry (`Failed` + attempts + next_retry_at) | ⬜ PASS / FAIL | **Yes** |
| Dead Letter | ⬜ PASS / FAIL | **Yes** |
| Timeline (`order_events`) | ⬜ PASS / FAIL | No |
| Rollback (≤10 min drill) | ⬜ PASS / FAIL | **Yes** |
| Idempotency (no duplicate Qikink orders) | ⬜ PASS / FAIL | **Yes** |
| Stuck `Sending` | ⬜ PASS / FAIL / **Known Issue** | No (tracked as TICKET-001) |

A single FAIL on any **Blocking = Yes** row → **NO GO**. `SKU-DEFERRED` on Queue is allowed only if
the failure path (Retry) is GREEN and the Qikink SKU (ticket #116250) is genuinely unavailable.

```text
GO TO PRODUCTION
□ YES
□ NO
```

Signed-off by: __________________  Date: __________

> After a GO + production deploy: run `RELEASE.md` (tag + 24h monitoring). **Phase 4 (UI) starts
> only after 24h of clean production monitoring**, not immediately after this sign-off.
