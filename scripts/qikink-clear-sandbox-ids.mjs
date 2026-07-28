/* ── Clear stale SANDBOX Qikink ids so an order can be re-sent live ──────
   Production ran with QIKINK_MODE=sandbox for a while, so paid orders were
   created on sandbox.qikink.com and their sandbox order_id was written to
   orders.qikink_order_id. Those orders do not exist in the live account, will
   never print, and never show on dashboard.qikink.com — but fulfillFromDb()
   returns { alreadySent: true } the moment that column is populated
   (api/_lib/fulfill.js), so "Send to Qikink" silently does nothing. Clearing
   the column is what lets the live send happen.

   Destructive, so it is deliberately hard to misfire:
     · DRY RUN by default — nothing is written without --apply.
     · It refuses to touch anything unless you name the rows: --ids, --before,
       or an explicit --all.
     · Before writing it asks the LIVE Qikink account about each order id and
       SKIPS any id the live account recognises — a real live order can never
       be cleared by accident. Needs live creds; --skip-verify to override.
     · Every old value is written to a backup JSON file before the first PATCH,
       and --restore puts them back.

   Usage (export the env vars for this shell only, never to a file):

     # see what would change — writes nothing
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
       node scripts/qikink-clear-sandbox-ids.mjs --before 2026-07-28

     # do it, verifying each id against the live account first
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     QIKINK_CLIENT_ID=<live> QIKINK_CLIENT_SECRET=<live> \
       node scripts/qikink-clear-sandbox-ids.mjs --ids DRK-1234,DRK-1235 --apply

     # undo
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
       node scripts/qikink-clear-sandbox-ids.mjs --restore qikink-cleared-<ts>.json

   Cleared rows go back to qikink_status='Draft' with tracking/courier/
   last_error blanked, which is exactly the state a never-sent order is in.
   Artwork URLs are left alone — they are real Cloudinary links and the live
   send reuses them.                                                        */

import { writeFile, readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n, fallback = null) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const APPLY = flag("--apply");
const SKIP_VERIFY = flag("--skip-verify");
const RESTORE = value("--restore");
const IDS = (value("--ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const BEFORE = value("--before");
const ALL = flag("--all");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

async function rest(path, { method = "GET", body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/* The fields this script owns. Anything not listed here is never written. */
const CLEARED = {
  qikink_order_id: null,
  qikink_status: "Draft",
  tracking_number: null,
  courier: null,
  last_error: null,
};
const SAVED_FIELDS = Object.keys(CLEARED);

/* ── --restore ── put a backup file's old values back ── */
if (RESTORE) {
  const backup = JSON.parse(await readFile(RESTORE, "utf8"));
  const rows = backup.cleared ?? [];
  if (!rows.length) {
    console.error(`${RESTORE} contains no cleared rows.`);
    process.exit(1);
  }
  console.log(`Restoring ${rows.length} order(s) from ${RESTORE}${APPLY ? "" : "  (DRY RUN — pass --apply)"}`);
  for (const r of rows) {
    console.log(`  ${r.id} → qikink_order_id=${r.before.qikink_order_id} status=${r.before.qikink_status}`);
    if (APPLY) await rest(`orders?id=eq.${encodeURIComponent(r.id)}`, { method: "PATCH", body: r.before });
  }
  console.log(APPLY ? "Restored." : "Nothing written.");
  process.exit(0);
}

/* ── pick the rows ── */
if (!IDS.length && !BEFORE && !ALL) {
  console.error(
    "Refusing to run without a target. Choose one:\n" +
      "  --ids DRK-1234,DRK-1235     specific orders\n" +
      "  --before 2026-07-28         every order created before this date\n" +
      "  --all                       every order that has a qikink_order_id"
  );
  process.exit(1);
}

/* ── verify against the LIVE account ── set this up BEFORE touching Supabase,
   so a missing credential fails immediately rather than after the query ──
   An id the live account knows is a REAL order: it may already be printing, and
   clearing it would let a second copy be sent. Those are always skipped, as is
   any id the check could not answer for — the failure direction is always
   "leave the row alone". Note that sandbox and live ids are numbered
   independently, so a sandbox id can collide with an unrelated live order and
   get skipped; confirm that order by hand, then clear it with --ids
   --skip-verify. */
let verify = null;
if (!SKIP_VERIFY) {
  if (!process.env.QIKINK_CLIENT_ID || !process.env.QIKINK_CLIENT_SECRET) {
    console.error(
      "Live verification needs QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET (the LIVE keys).\n" +
        "Set them, or pass --skip-verify if you are certain every matched order is sandbox-only."
    );
    process.exit(1);
  }
  process.env.QIKINK_MODE = "live"; // read at call time by qikinkBase()
  const { qikinkFetch } = await import("../api/_lib/qikink.js");
  verify = async (qikinkOrderId) => {
    try {
      const raw = await qikinkFetch(`/api/order?id=${encodeURIComponent(qikinkOrderId)}`);
      const data = Array.isArray(raw) ? raw[0] : (raw?.data ?? raw);
      const exists = !!(data && (data.id ?? data.order_id ?? data.number ?? data.status ?? data.order_status));
      return exists ? { live: true } : { live: false };
    } catch (err) {
      const msg = String(err.message);
      // A 404 / "not found" is the answer we want: the live account has no such order.
      if (/\(404\)/.test(msg) || /not\s*found/i.test(msg)) return { live: false };
      return { error: msg.slice(0, 200) }; // anything else → fail closed, skip the row
    }
  };
}

/* ── read the rows ── */
let query = `orders?qikink_order_id=not.is.null&select=id,created_at,payment_status,${SAVED_FIELDS.join(",")}&order=created_at.desc`;
if (IDS.length) query += `&id=in.(${IDS.map((i) => `"${i}"`).join(",")})`;
if (BEFORE) query += `&created_at=lt.${encodeURIComponent(BEFORE)}`;

const rows = await rest(query);
if (!rows.length) {
  console.log("No orders match — nothing to clear.");
  process.exit(0);
}
if (IDS.length) {
  const found = new Set(rows.map((r) => r.id));
  for (const id of IDS.filter((i) => !found.has(i)))
    console.log(`  · ${id} — not found, or its qikink_order_id is already empty; skipped`);
}

/* ── plan ── */
const toClear = [];
console.log(`\n${rows.length} order(s) with a qikink_order_id matched:\n`);
for (const row of rows) {
  const line = `  ${row.id}  created=${String(row.created_at).slice(0, 10)}  payment=${row.payment_status}  qikink_id=${row.qikink_order_id}  status=${row.qikink_status}`;
  if (!verify) {
    console.log(`${line}  → clear (unverified)`);
    toClear.push(row);
    continue;
  }
  const v = await verify(row.qikink_order_id);
  if (v.live) console.log(`${line}  → SKIP: exists in the LIVE account`);
  else if (v.error) console.log(`${line}  → SKIP: could not verify (${v.error})`);
  else {
    console.log(`${line}  → clear (not in the live account)`);
    toClear.push(row);
  }
}

if (!toClear.length) {
  console.log("\nNothing to clear.");
  process.exit(0);
}
if (!APPLY) {
  console.log(`\nDRY RUN — ${toClear.length} order(s) would be cleared. Re-run with --apply to write.`);
  process.exit(0);
}

/* ── backup, then write ── */
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = value("--backup") ?? `qikink-cleared-${stamp}.json`;
const backup = {
  cleared_at: new Date().toISOString(),
  supabase_project: SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0],
  verified_against_live: !!verify,
  cleared: toClear.map((r) => ({
    id: r.id,
    before: Object.fromEntries(SAVED_FIELDS.map((k) => [k, r[k] ?? null])),
  })),
};
await writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8"); // throws → nothing is written
console.log(`\nBackup written: ${backupPath}`);

let done = 0;
for (const row of toClear) {
  try {
    await rest(`orders?id=eq.${encodeURIComponent(row.id)}`, { method: "PATCH", body: CLEARED });
    done++;
    console.log(`  cleared ${row.id}`);
  } catch (err) {
    console.error(`  FAILED ${row.id}: ${err.message}`);
  }
}

console.log(
  `\n${done}/${toClear.length} cleared. They are back to qikink_status='Draft' and can be re-sent from\n` +
    `Admin → Orders → Send to Qikink (make sure QIKINK_MODE=live is deployed first, or you will\n` +
    `write another sandbox id straight back).\n` +
    `Undo: node scripts/qikink-clear-sandbox-ids.mjs --restore ${backupPath} --apply`
);
