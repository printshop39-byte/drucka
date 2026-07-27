# Verification Run Manifest (provenance)

> Fill this in **before** capturing artifacts. Every file in `verification-artifacts/` belongs to
> the run described here — this is the single provenance record so, months later, it is unambiguous
> which deployment the evidence came from. A second verification run → snapshot this folder
> (e.g. `verification-artifacts-rc2/`) or add a dated manifest; never mix runs.

| Field | Value |
|-------|-------|
| Date/Time | ⬜ e.g. 2026-07-07 18:45 IST |
| Git Commit | ⬜ `abc1234` |
| Branch | ⬜ `release/v2-redesign-rc1` |
| Environment | ⬜ `staging` |
| Supabase Project (Reference ID) | ⬜ |
| Vercel Deployment ID | ⬜ |
| Tester | ⬜ Name / Initials |

## Rule: Evidence beats opinion
Production Go/No-Go is decided by the artifacts in this folder, not by impressions.
- ❌ "smoke looks fine" — not sufficient.
- ❌ "I think it's ok" — not sufficient.
- ✅ evidence present in `verification-artifacts/` — that is the decision basis.

## Artifact inventory (tick when captured for THIS run)
- ☐ `smoke.log` · ☐ `cron.log` · ☐ `webhook.log` · ☐ `qikink-response.json`
- ☐ `order-events.csv` · ☐ `rollback.log` · ☐ `gates.md` (filled) · ☐ `screenshots/`
