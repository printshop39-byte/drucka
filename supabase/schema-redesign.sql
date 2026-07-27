-- ════════════════════════════════════════════════════════════════════
-- DRUCKA order-lifecycle redesign — Phase 1 (Schema)
-- Run in Supabase SQL Editor AFTER schema.sql and schema-update.sql.
-- Implements ADR-0001 (see REDESIGN.md) §10 file 1.
--
-- Fully idempotent + additive: safe to re-run, and safe to apply to a LIVE
-- database while the old app is still running (no existing row is rewritten,
-- the status CHECK is added NOT VALID so current 'Draft' writes still pass).
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Retry bookkeeping on orders ──────────────────────────────────
-- fulfill_attempts : how many times fulfillFromDb() has failed for this order.
-- next_retry_at    : when the worker/cron may next attempt fulfillment.
alter table public.orders
  add column if not exists fulfill_attempts integer not null default 0,
  add column if not exists next_retry_at   timestamptz;

-- ── 2. Fulfillment-queue index ──────────────────────────────────────
-- The cron drain query is:
--   qikink_status IN ('Ready','Failed')
--   AND payment_status IN ('Paid','COD Approved')
--   AND (next_retry_at IS NULL OR next_retry_at <= now())
--   AND fulfill_attempts < 6
-- A partial index keyed on next_retry_at, limited to the two pickup states,
-- keeps that sweep cheap even as the table grows.
create index if not exists orders_fulfillment_queue_idx
  on public.orders (next_retry_at)
  where qikink_status in ('Ready', 'Failed');

-- ── 3. Status "enum" via CHECK (the canonical qikink_status set) ─────
-- qikink_status stays a text column (the app uses string literals), but this
-- constraint documents + guards the allowed values. It includes the LEGACY
-- 'Draft' so the currently-deployed app keeps working; a later phase can drop
-- 'Draft' and run `VALIDATE CONSTRAINT` once no code writes it anymore.
-- NOT VALID => enforced on new/updated rows, existing rows left untouched.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_qikink_status_chk'
  ) then
    alter table public.orders
      add constraint orders_qikink_status_chk
      check (qikink_status in (
        'Draft',            -- legacy (pre-redesign); removable after cutover
        'Queued',           -- saved, COD awaiting approval
        'Ready',            -- approved / paid — enqueued for the worker
        'Sending',          -- worker holds the lock; Qikink call in flight
        'Sent to Qikink',   -- success
        'In Production',    -- downstream (status poll)
        'Shipped',          -- downstream (status poll)
        'Delivered',        -- downstream (status poll)
        'Failed',           -- attempt failed, attempts < 6, retry pending
        'Dead Letter'       -- attempts >= 6, terminal until manual rescue
      ))
      not valid;
  end if;
end $$;

-- ── 4. Per-order event timeline (observability) ─────────────────────
-- One row per lifecycle event, e.g. 'Order Created', 'COD Approved',
-- 'Worker Picked', 'Upload Success', 'Qikink Accepted', 'Qikink Failed'.
-- Written best-effort by api/_lib/events.js (Phase 2); the orders row stays
-- the source of truth, so an events insert failure never blocks fulfillment.
create table if not exists public.order_events (
  id         bigint generated always as identity primary key,
  order_id   text not null references public.orders(id) on delete cascade,
  event      text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx
  on public.order_events (order_id, created_at);

-- Lock it down like orders/product_map: service-role key only, no public policy.
alter table public.order_events enable row level security;
