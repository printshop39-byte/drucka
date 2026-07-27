# Verification Artifacts — staging evidence (audit trail)

> Purpose: turn "verification PASSED" from a claim into **evidence**. Every file here is a real
> capture from the staging run — do **not** hand-write or fake outputs. If a run didn't happen, the
> file stays absent. Keep this folder with the release so a future production incident has a trail.
>
> Set once: `BASE=https://<staging>.vercel.app  ADMIN=<admin_secret>  CRON=<cron_secret>`
> and for CSV export: `SB_URL=<staging SUPABASE_URL>  SB_KEY=<service_role_key>`.

**Fill in `MANIFEST.md` first** — it records the run's provenance (date, git commit, branch,
environment, Supabase project ref, Vercel deployment ID, tester) that all artifacts below share.
Decision rule: **evidence beats opinion** — Go/No-Go is decided by these files, not impressions.

## Contents & how to capture each

| File | What it holds | How to generate |
|------|---------------|-----------------|
| `smoke.log` | full `phase3-smoke.mjs` output | `BASE_URL=$BASE ADMIN_SECRET=$ADMIN CRON_SECRET=$CRON node scripts/phase3-smoke.mjs 2>&1 \| tee verification-artifacts/smoke.log` |
| `cron.log` | each `poll-orders` drain response (JSON: `fulfilled`,`polled`,`delivered`) | `curl -s $BASE/api/cron/poll-orders -H "authorization: Bearer $CRON" \| tee -a verification-artifacts/cron.log; echo >> verification-artifacts/cron.log` |
| `webhook.log` | test payment-webhook deliveries + responses (incl. the duplicate-delivery idempotency test) | save the Razorpay test-webhook response bodies, or the signed-curl responses, appended here |
| `qikink-response.json` | raw Qikink `/api/order/create` response for one order (proof of Sent / of the exact error) | copy from Vercel logs (`Qikink /api/order/create → …`) or the create response body |
| `order-events.csv` | the full timeline of the test order(s) | `curl -s "$SB_URL/rest/v1/order_events?order_id=eq.<ID>&order=created_at&select=created_at,event,detail" -H "apikey: $SB_KEY" -H "authorization: Bearer $SB_KEY" -H "accept: text/csv" -o verification-artifacts/order-events.csv` |
| `rollback.log` | timed rollback drill: each step + wall-clock timestamps, total ≤10 min | record manually while running `ROLLBACK.md` (start/stop time, method used, result) |
| `gates.md` | filled Go/No-Go matrix + per-gate SQL outputs | fill from `VERIFICATION.md` (template already in this folder) |
| `screenshots/` | admin panel states, Vercel cron logs, Supabase table rows, `[fulfill-dead-letter]` log line | PNGs |

## Integrity notes
- Redact secrets before saving (no service-role keys, no signed Cloudinary URLs — the app already
  logs artwork by fingerprint, keep it that way).
- Name screenshots by gate, e.g. `screenshots/gate2-sent.png`, `gate4-deadletter.png`.
- Timestamp each capture (the tools above include timestamps; for manual notes add ISO time).
- Commit this folder on the release branch alongside the `v2-redesign-rc1` tag (see `RELEASE.md`).
