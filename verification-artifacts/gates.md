# Gate Results — staging verification (FILL IN)

Run provenance: see `MANIFEST.md` (date, git commit, branch, environment, Supabase ref, Vercel
deployment ID, tester) — fill it in before capturing results below.

> Paste the actual SQL output / JSON under each gate. This is evidence — link the matching file in
> this folder (e.g. `smoke.log`, `order-events.csv`, `screenshots/…`). Mirrors `VERIFICATION.md`.

## Gate 1 — Migration
```
<paste: columns / index / constraint / order_events column-count query outputs>
```
Result: ⬜ PASS / FAIL

## Gate 2 — Queue (Queued → Ready → Sending → Sent to Qikink)
```
<paste: qikink_status + qikink_order_id after drain>   evidence: smoke.log / screenshots/gate2-sent.png
```
Result: ⬜ PASS / FAIL / SKU-DEFERRED (ticket #116250)

## Gate 3 — Retry (Failed + attempts=1 + next_retry_at + last_error)
```
<paste: orders row for the unmapped test order>
```
Result: ⬜ PASS / FAIL

## Gate 4 — Dead Letter
```
<paste: final qikink_status='Dead Letter' + fulfill_attempts ; and the [fulfill-dead-letter] log line>
```
Result: ⬜ PASS / FAIL

## Gate 5 — Recovery from Dead Letter (infra; button is Phase 4)
```
<paste: after manual re-enqueue → status progression>
```
Result: ⬜ PASS / FAIL

## Gate 6 — Event timeline
```
<paste: order-events.csv contents or the SELECT output>
```
Result: ⬜ PASS / FAIL

## Gate 7 — Rollback drill (≤10 min)
```
<paste: rollback.log summary — method, start/stop, total minutes>
```
Result: ⬜ PASS / FAIL   ·   time-to-green: ______ min

## Idempotency (no duplicate Qikink orders)
```
<paste: double-approval response ; concurrent-cron result ; duplicate-webhook result ;
        and: select qikink_order_id, count(*) ... having count(*)>1  →  expect 0 rows>
```
Result: ⬜ PASS / FAIL

## Stuck Sending (TICKET-001)
```
<paste: after forcing status='Sending' + cron run → still 'Sending'>
```
Result: ⬜ Reproduced → Known Issue (TICKET-001)

---

## Go / No-Go

| Gate | Result | Blocking? |
|------|--------|-----------|
| Schema | ⬜ | Yes |
| Queue | ⬜ | Yes |
| Retry | ⬜ | Yes |
| Dead Letter | ⬜ | Yes |
| Timeline | ⬜ | No |
| Rollback | ⬜ | Yes |
| Idempotency | ⬜ | Yes |
| Stuck Sending | ⬜ Known Issue | No (TICKET-001) |

```text
GO TO PRODUCTION
□ YES
□ NO
```
Signed-off by: __________________  Date: __________
