/* POST /api/qikink/token — verifies Qikink credentials (admin "Test connection").
   Returns only ok/mode — the access token NEVER reaches the browser.

   ADMIN ONLY (x-admin-secret). It is an admin action, and unauthenticated it
   let anyone make the server log in to Qikink on demand and learn from the
   answer whether the account is live or sandbox and whether its keys work. */
import { qikinkToken } from "../_lib/qikink.js";
import { withCors } from "../_lib/cors.js";
import { isAdmin } from "../_lib/adminAuth.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  /* before anything else: no Qikink login for a caller who is not staff */
  if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Admin secret required" });
  try {
    await qikinkToken();
    res.json({ ok: true, mode: process.env.QIKINK_MODE === "live" ? "live" : "sandbox" });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
