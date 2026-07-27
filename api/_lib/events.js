/* Per-order event timeline — SERVER ONLY. Best-effort observability.
   Writes one row to public.order_events (created in schema-redesign.sql).

   ⚠ logEvent() MUST NEVER throw or reject: an observability write failing must
   not fail the order flow. It swallows its own errors to console. The orders
   row stays the single source of truth; order_events is a support aid only. */
import { sb } from "./supabase.js";

/* Canonical event names. Standard vocabulary shared across the lifecycle so
   queries and dashboards stay consistent. Phase 2 (fulfill.js) emits the
   fulfilment-stage events; ORDER_CREATED / ORDER_APPROVED / FULFILLMENT_QUEUED
   are emitted by the trigger layer in Phase 3. */
export const EVENTS = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_APPROVED: "ORDER_APPROVED",
  FULFILLMENT_QUEUED: "FULFILLMENT_QUEUED",
  FULFILLMENT_STARTED: "FULFILLMENT_STARTED",
  ARTWORK_UPLOADED: "ARTWORK_UPLOADED",
  QIKINK_REQUEST: "QIKINK_REQUEST",
  QIKINK_SUCCESS: "QIKINK_SUCCESS",
  QIKINK_FAILED: "QIKINK_FAILED",
  RETRY_SCHEDULED: "RETRY_SCHEDULED",
  DEAD_LETTER: "DEAD_LETTER",
};

/* Append one event to an order's timeline. Never throws.
   details: small JSON-safe object — keep it free of PII and full artwork URLs
   (log counts / SKUs / hashes / error messages, not signed links). */
export async function logEvent(orderId, type, details = null) {
  try {
    await sb("order_events", {
      method: "POST",
      body: { order_id: orderId, event: type, detail: details },
    });
  } catch (err) {
    // best-effort only — observability must never break the main flow
    console.error(`logEvent(${orderId}, ${type}) failed:`, err?.message ?? err);
  }
}
