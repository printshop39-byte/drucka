/* Small in-memory rate limiter for PUBLIC endpoints that cost money.

   HONEST LIMIT: each serverless instance keeps its own counters, so this
   slows one client hammering one endpoint; it is not a global quota and a
   determined attacker spread across instances gets more through. It is a
   speed bump, not a wall. A shared limit (Vercel firewall / KV) is the real
   fix and belongs in the launch security review. */
const buckets = new Map();

export function clientIp(req) {
  const xff = req.headers?.["x-forwarded-for"];
  const first = (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim();
  return first || req.socket?.remoteAddress || "unknown";
}

/* true = allowed. `limit` hits per `windowMs` per key. */
export function allow(key, limit, windowMs, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || now - b.start >= windowMs) {
    buckets.set(key, { start: now, n: 1 });
    /* keep the map from growing without bound on a long-lived instance */
    if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

export const _resetForTests = () => buckets.clear();
