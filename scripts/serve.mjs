/* Tiny local static server for dist/ that behaves like Vercel does for this site:
   clean URLs (/photo-prints -> photo-prints/index.html), the redirects in vercel.json,
   and 404.html for unknown paths. Local preview only; nothing here ships. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const port = Number(process.env.PORT) || 5190;
const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const redirects = new Map(config.redirects?.map((r) => [r.source, r]) ?? []);
/* the same security headers (incl. the strict CSP) that Vercel will send, so CSP problems show up locally */
const sitewide = Object.fromEntries((config.headers?.find((h) => h.source === "/(.*)")?.headers ?? []).map((h) => [h.key, h.value]));
/* local layout audits load the pages in iframes of different widths; the real headers forbid framing */
if (process.argv.includes("--allow-framing")) {
  delete sitewide["X-Frame-Options"];
  sitewide["Content-Security-Policy"] = sitewide["Content-Security-Policy"].replace("frame-ancestors 'none'", "frame-ancestors 'self'; frame-src 'self'");
}
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".webp": "image/webp", ".woff2": "font/woff2",
  ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
};

const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const rule = redirects.get(path);
  if (rule) { res.writeHead(rule.permanent ? 308 : 307, { Location: rule.destination }); return res.end(); }
  if (path.length > 1 && path.endsWith("/")) { res.writeHead(308, { Location: path.slice(0, -1) }); return res.end(); }
  const base = join(dist, normalize(path));
  if (base !== dist && !base.startsWith(dist + sep)) { res.writeHead(403); return res.end("Forbidden"); }
  for (const candidate of [base, `${base}.html`, join(base, "index.html")]) {
    if (candidate !== dist && (await isFile(candidate))) {
      res.writeHead(200, { ...sitewide, "Content-Type": types[extname(candidate)] ?? "application/octet-stream" });
      return res.end(await readFile(candidate));
    }
  }
  res.writeHead(404, { ...sitewide, "Content-Type": types[".html"] });
  res.end(await readFile(join(dist, "404.html")).catch(() => "Not found"));
}).listen(port, () => console.log(`Drucka static site: http://localhost:${port}`));
