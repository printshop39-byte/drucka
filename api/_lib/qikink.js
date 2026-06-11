/* Qikink auth + fetch helper — SERVER ONLY.
   Credentials come from Vercel env vars, never from the browser.
   ⚠ Confirm exact endpoint paths/headers in your Qikink dashboard docs. */

const BASES = {
  sandbox: "https://sandbox.qikink.com",
  live: "https://api.qikink.com",
};

export const qikinkBase = () =>
  BASES[process.env.QIKINK_MODE === "live" ? "live" : "sandbox"];

let cachedToken = null; // { accessToken, expiresAt } — survives warm invocations

export async function qikinkToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }
  const res = await fetch(`${qikinkBase()}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ClientId: process.env.QIKINK_CLIENT_ID,
      client_secret: process.env.QIKINK_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Qikink auth failed (${res.status}): ${await res.text()}`);
  const data = await res.json(); // { Accesstoken, expires_in }
  cachedToken = {
    accessToken: data.Accesstoken,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return cachedToken.accessToken;
}

export async function qikinkFetch(path, { method = "GET", body } = {}) {
  const token = await qikinkToken();
  const res = await fetch(`${qikinkBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ClientId: process.env.QIKINK_CLIENT_ID,
      Accesstoken: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Qikink ${path} failed (${res.status}): ${await res.text()}`);
  return res.json();
}
