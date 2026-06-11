/* CORS wrapper — lets the frontend call this Vercel backend even when
   it's hosted elsewhere (e.g. Hostinger). Set ALLOWED_ORIGIN to your
   frontend origin in production (e.g. https://drucka.in); "*" is fine
   for staging. Handles OPTIONS preflight for every endpoint. */
export function withCors(handler) {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") return res.status(204).end();
    return handler(req, res);
  };
}
