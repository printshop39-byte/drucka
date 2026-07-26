/* GET /api/qikink/mode — which Qikink account "Send to Qikink" will hit.

   The admin used to show a "Sandbox mode" checkbox that was bound to a value
   in the browser's own localStorage and wired to nothing. The server picks the
   endpoint from QIKINK_MODE alone and is never told what the browser thinks —
   so the box could read "Sandbox" while a send printed and shipped a real
   garment. Reading the answer from the server is the only honest version.

   Reports configuration, never credentials: the mode, the endpoint it implies,
   and whether the keys are present at all — enough to know a send is safe, and
   to explain a 401 without anyone pasting a secret anywhere. */
import { qikinkBase } from "../_lib/qikink.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "GET only" });
  const live = process.env.QIKINK_MODE === "live";
  res.setHeader("Cache-Control", "no-store"); // flipping the env var must show up immediately
  res.json({
    ok: true,
    mode: live ? "live" : "sandbox",
    endpoint: qikinkBase(),
    credentialsConfigured: !!(process.env.QIKINK_CLIENT_ID && process.env.QIKINK_CLIENT_SECRET),
    /* matches the webhook's own test exactly — it compares against the string
       "true", so anything else (including "1") leaves auto-send off */
    autoSendOnPaid: process.env.AUTO_SEND_ON_PAID === "true",
  });
}

export default withCors(handler);
