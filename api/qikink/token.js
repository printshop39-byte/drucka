/* POST /api/qikink/token — verifies Qikink credentials (admin "Test connection").
   Returns only ok/mode — the access token NEVER reaches the browser. */
import { qikinkToken } from "../_lib/qikink.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    await qikinkToken();
    res.json({ ok: true, mode: process.env.QIKINK_MODE === "live" ? "live" : "sandbox" });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}

export default withCors(handler);
