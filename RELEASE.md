# Release & Monitoring — v2 Order Lifecycle Redesign (Phases 1–3)

> Backend-only release (Schema + Engine + Triggers). No UI change (Phase 4 is later).
> Prereq: `VERIFICATION.md` Go/No-Go = **GO**. Rollback: `ROLLBACK.md`.

## Production deploy preflight — ALL must be "YES"

If any answer is **NO**, postpone the deploy.

1. ☐ Staging smoke (`phase3-smoke.mjs`) fully PASSED? (evidence: `verification-artifacts/smoke.log`)
2. ☐ Rollback actually executed on staging (not just read), ≤10 min? (`verification-artifacts/rollback.log`)
3. ☐ Duplicate Qikink orders = **0**? (monitoring query 6 below, on staging)
4. ☐ Dead Letter recovery strategy documented? (`VERIFICATION.md` Gate 5 + `DECISIONS.md` D3/D5)
5. ☐ Monitoring dashboard/queries ready to run at deploy time? (this file, below)

## Release branch + tags

**Do not commit to `main` directly.** Use a release branch so a production issue is isolated at the
branch level and `main` stays clean until the release is proven.

1. **Only after staging Go/No-Go = GO** — cut the release branch + RC tag from the working tree:
   ```bash
   git checkout -b release/v2-redesign-rc1
   git add .
   git commit -m "feat: redesign fulfillment engine (Phase 1-3)"
   git tag v2-redesign-rc1
   git push -u origin release/v2-redesign-rc1 --tags
   ```
   Deploy `v2-redesign-rc1` to production.

2. **After 24 h of green production monitoring** — promote and fold back into `main`:
   ```bash
   git tag v2-redesign
   git checkout main && git merge release/v2-redesign-rc1
   git push origin main --tags
   ```
   (If verification/monitoring finds fixes: commit them on the release branch, tag
   `v2-redesign-rc2`, re-verify. Only the RC that stays green becomes `v2-redesign`.)

- **Last-known-good tag before this work** (fastest rollback target): record it here →
  `PREV_GOOD = ______________`  (find via `git log --oneline` — the commit before Phase 1–3).

> Note: tag/branch creation happens only when the operator runs the above after a GO — nothing is
> committed yet; all v2 changes currently live in the working tree.

## 24-hour production monitoring

Run these right after deploy, then hourly for the first few hours and again at ~24 h. Replace the
window as needed. All read-only.

```sql
-- 1. Orders created (last 24h)
select count(*) from public.orders where created_at > now() - interval '24 hours';

-- 2. Currently queued (awaiting approval / pickup)
select qikink_status, count(*) from public.orders
  where qikink_status in ('Queued','Ready','Sending') group by qikink_status;

-- 3. Sent to Qikink (last 24h)
select count(*) from public.orders
  where qikink_order_id is not null and created_at > now() - interval '24 hours';

-- 4. Retry activity (orders that have failed at least once but aren't dead)
select count(*) from public.orders where fulfill_attempts > 0 and qikink_status = 'Failed';

-- 5. Dead Letter count  (should stay ~0; each one needs an operator)
select count(*) from public.orders where qikink_status = 'Dead Letter';

-- 6. DUPLICATE Qikink orders  (MUST be zero — top red-flag)
select qikink_order_id, count(*) from public.orders
  where qikink_order_id is not null group by qikink_order_id having count(*) > 1;

-- 7. Avg approval → sent time (from the event timeline)
select avg(s.created_at - a.created_at) as avg_approve_to_sent
from public.order_events a
join public.order_events s
  on s.order_id = a.order_id and s.event = 'QIKINK_SUCCESS'
where a.event = 'ORDER_APPROVED';
```

Also watch **Vercel → Logs**:
- `[fulfill-dead-letter] order=…` — a dead letter fired (investigate).
- `[qikink-monitor] …` / `[qikink-artwork] …` — per-send records (existing).
- Cron `/api/cron/poll-orders` runs: check `fulfilled` and `polled` counts in the JSON response.

## Alert thresholds (first 24h)

| Signal | Green | Investigate |
|--------|-------|-------------|
| Duplicate Qikink orders (query 6) | 0 | **any > 0 → rollback candidate** |
| Dead Letter count (query 5) | 0–1 | rising, or > a few |
| Retry backlog (query 4) | low, draining | growing steadily (Qikink/Cloudinary outage?) |
| Stuck `Sending` (query 2, `Sending` not clearing) | transient only | any stuck > ~15 min → TICKET-001 |
| Avg approve→sent (query 7) | ≈ cron interval | ≫ cron interval (worker not draining) |

## Post-release gate to Phase 4
- [ ] 24 h elapsed with all signals Green.
- [ ] Duplicate Qikink orders = 0 for the whole window.
- [ ] No unexplained Dead Letters.
- [ ] TICKET-001 still only reproducible via manual simulation (no organic stuck `Sending`).
→ then **Phase 4 (UI + Retry Fulfillment button)** may begin.
