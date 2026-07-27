# DECISIONS — Order Lifecycle Redesign (the "why")

> Companion to `REDESIGN.md` (which holds the "what"). This file records *rationale* only —
> why each significant choice was made, what was rejected, and when to revisit. Read this before
> changing any of these decisions.

---

## D1 — Cron-first execution (not `waitUntil`, not inline)

**Context:** after an order is enqueued (`Ready`), something must call `fulfillFromDb()`.
Vercel serverless freezes the function after the HTTP response, so a plain fire-and-forget after
`res.json()` is killed.

**Alternatives considered:**
- *Inline in the trigger* (await Qikink inside `approve-cod`/webhook) — rejected: couples approval
  latency to a 5–15 s Qikink call; a slow/failing Qikink slows or fails the operator's action.
- *`waitUntil()` background kick* (`@vercel/functions`) — good, but adds a dependency and its
  behavior varies by plan/runtime.

**Decision:** the `orders` table is the queue; a cron drain pass is the sole worker.

**Rationale:** zero new dependencies, simplest to reason about and debug, and it gives automatic
retry "for free" (a failed order simply stays in the queue). The trigger endpoints stay fast
because they only write a row and return.

**Trade-off / revisit when:** approval→sent latency ≈ the cron interval. If that latency becomes a
UX problem, add D2 (the kick) on top — it layers on without changing the queue model.

---

## D2 — `waitUntil` deferred to Phase 5 (optional optimization)

**Decision:** ship Phases 1–4 with no `waitUntil`; treat the immediate background kick as a
separate, optional latency optimization.

**Rationale:** correctness and safety must land and be verified first. The kick is a *performance*
change, not a *correctness* one — bolting it on during the risky trigger rewrite would mix two
concerns and enlarge the blast radius. Keeping it separate means the cron (the safety net) is
proven in production before we add a second, faster path.

**Revisit when:** cron-interval latency is measured as too slow in production (see `RELEASE.md`
query 7, avg approve→sent). Then add the kick; the cron stays as the fallback so the two are never
a single point of failure.

---

## D3 — Manual "Send to Qikink" button removed (replaced by Dead-Letter-only "Retry Fulfillment")

**Context:** originally the *only* way a COD order reached Qikink was an operator clicking "Send to
Qikink" — a mandatory manual step in the happy path, and a silent-failure trap if forgotten.

**Decision:** remove the always-on Send button. Fulfillment is automatic (approval/payment →
queue → worker). The only surviving manual lever is **Retry Fulfillment**, shown **only on
`Dead Letter`** orders.

**Rationale:** a manual step in the happy path is a reliability hazard (human forgets → order
stuck, no signal). Automating it removes that class of failure. But a *rescue* for exhausted
orders is still needed (Qikink/Cloudinary outage, bad SKU, manual correction) — without it an
operator would have to edit the DB. Scoping the button to `Dead Letter` keeps it a deliberate
rescue, not a routine send, so operators don't reintroduce the old manual habit.

**Note:** the Retry Fulfillment endpoint/button is Phase 4; the recovery *path* is already
supported by the engine (re-enqueue → `Ready`).

---

## D4 — Retry ladder 1 / 5 / 15 / 30 / 60 / 360 minutes

**Decision:** exponential-ish backoff `[1, 5, 15, 30, 60, 360]` minutes, then `Dead Letter`.

**Rationale:**
- **Fast first retry (1 min):** most failures are transient (a momentary Qikink/Cloudinary blip or
  network timeout) — a quick retry recovers them with near-zero operator involvement.
- **Widening gaps:** if the first retry fails, the cause is likely a longer outage; backing off to
  5→15→30→60 min avoids hammering a struggling upstream and wasting Cloudinary re-uploads.
- **6-hour last rung:** covers a multi-hour outage without giving up prematurely, while still
  bounding the total window (~8 h) so a genuinely broken order surfaces as `Dead Letter` for a
  human within a day.
- **Not more aggressive:** tighter intervals would spam Qikink and inflate cost/log noise with no
  real recovery benefit for non-transient failures.

**Implementation:** single source of truth — the `RETRY_MINUTES` array in `api/_lib/fulfill.js`;
running off the end dead-letters the order. Tune by editing that one array.

---

## D5 — TICKET-001 (stuck `Sending`) is NOT a production blocker

**Context:** if a worker wins the optimistic-lock claim (`→ Sending`) but the serverless function
dies before writing success/failure, the order is stranded in `Sending` (outside the drain
filter) and is never retried.

**Decision:** ship without the fix; track it as `TICKET-001` (target Phase 4.5 / hotfix).

**Rationale:**
- **Low probability:** requires a crash in a narrow window (after claim, before the success/fail
  write) of an already-fast code path.
- **Not silent:** it is documented (ADR §15), deterministically reproducible (`VERIFICATION.md`),
  visible in monitoring (`RELEASE.md` — stuck `Sending` alert), and has a one-line manual
  workaround (reset to `Ready`).
- **No data loss / no duplicate:** the order isn't lost or double-sent — it's paused, recoverable.
- **Clean fix needs a small schema add** (`claimed_at`) + a reclaim sweep — better done as a
  focused follow-up than smuggled into the trigger release.

**Revisit when:** any *organic* stuck `Sending` appears in production monitoring → promote
TICKET-001 to a hotfix immediately.

---

## Other decisions (brief)

- **D6 — `fulfillFromDb()` is the single source of truth; all client-side Qikink/Cloudinary calls
  removed.** One code path to audit, secure, and retry, instead of two divergent ones (client vs
  server). The browser never holds a fulfilment secret.
- **D7 — The `orders` table IS the queue (no SQS/Redis).** Adding external queue infra for this
  volume is over-engineering; a status column + `next_retry_at` + a cron gives the same
  guarantees with nothing new to operate.
- **D8 — Approval is an atomic single-row PATCH that enqueues and returns.** One row update is
  inherently atomic ("transaction/commit"); the enqueue is just the row landing in `Ready`. No
  Qikink call in the request → approval can never be slowed by Qikink.
- **D9 — Status `CHECK` added `NOT VALID`.** Guards new writes without validating (or breaking)
  existing rows, and keeps legacy `Draft` valid during the transition. Tighten later once no code
  writes `Draft`.
- **D10 — Strangler-style phased rollout (Schema → Engine → Trigger → UI) with a stage gate.**
  Each phase is independently deployable and verifiable, so production risk is introduced in small,
  reversible increments rather than one big-bang cutover.
