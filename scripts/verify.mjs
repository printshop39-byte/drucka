/* Guard for the "plain static site" promise. Runs after every build; a failure fails the
   build, so a deploy cannot silently gain JavaScript, a form, a backend call, a tracker
   or a stray price. Exit code 1 lists every problem found. */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTACT, DELIVERY, PHOTO_SIZES, MINI_PACK_FROM, IMAGES_APPROVED, WALLPAPER_TIERS } from "../data/catalog.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLE = process.argv.includes("--sample"); // set only by `npm run dev:sample`
const dist = join(root, "dist");
const problems = [];
const bad = (msg) => problems.push(msg);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(dist);
const rel = (p) => relative(dist, p).replaceAll("\\", "/");

/* 1. only inert file types — in particular no .js / .json / .map */
const OK_EXT = new Set([".html", ".css", ".webp", ".woff2", ".svg", ".xml", ".txt"]);
for (const f of files) if (!OK_EXT.has(extname(f))) bad(`unexpected file type: ${rel(f)}`);

const FORBIDDEN_WORDS = /supabase|cloudinary|razorpay|qikink|fbq|facebook\.net|googletagmanager|google-analytics|\/api\//i;
const ALLOWED_HOSTS = new Set(["wa.me", "www.drucka.in"]);
const pageFiles = files.filter((f) => f.endsWith(".html"));
const exists = (urlPath) => {
  const p = urlPath.split("#")[0].split("?")[0];
  if (p === "/" || p === "") return existsSync(join(dist, "index.html"));
  const base = join(dist, p);
  return (existsSync(base) && statSync(base).isFile()) || existsSync(join(base, "index.html")) || existsSync(`${base}.html`);
};

for (const f of files.filter((x) => [".html", ".css", ".xml", ".txt", ".svg"].includes(extname(x)))) {
  const text = readFileSync(f, "utf8");
  const where = rel(f);
  const w = text.match(FORBIDDEN_WORDS);
  if (w) bad(`${where}: forbidden reference "${w[0]}"`);
  if (extname(f) === ".css") {
    for (const m of text.matchAll(/url\(["']?([^)"']+)["']?\)/g)) if (!exists(m[1])) bad(`${where}: missing asset ${m[1]}`);
    continue;
  }
  if (extname(f) !== ".html") continue;

  /* 2. no scripts (JSON-LD data is allowed), forms, embeds, inline handlers or inline styles */
  for (const m of text.matchAll(/<script\b[^>]*>/gi)) if (!/type="application\/ld\+json"/.test(m[0])) bad(`${where}: <script> found`);
  if (/<(form|input|textarea|select|iframe|object|embed)\b/i.test(text)) bad(`${where}: form/embed element found`);
  if (/\son[a-z]+\s*=/i.test(text)) bad(`${where}: inline event handler`);
  if (/\sstyle\s*=/i.test(text)) bad(`${where}: inline style (the CSP forbids it)`);

  /* 3. every link and asset: allowed hosts only, internal ones must exist */
  for (const m of text.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (u.startsWith("mailto:") || u.startsWith("#")) continue;
    if (/^https?:\/\//.test(u)) {
      const host = new URL(u).hostname;
      if (!ALLOWED_HOSTS.has(host)) bad(`${where}: link to non-allowed host ${host}`);
      if (host === "wa.me" && !u.startsWith(`https://wa.me/${CONTACT.whatsappDigits}?text=`) ) bad(`${where}: WhatsApp link with wrong number`);
    } else if (u.startsWith("/")) {
      if (!exists(u)) bad(`${where}: broken internal link ${u}`);
    } else bad(`${where}: relative link ${u}`);
  }

  /* 3b. the ready-made LAYOUT SAMPLE must never reach a normal build; in --sample mode it must stay a plain mock-up */
  const isSamplePage = where.startsWith("ready-made/");
  if (!SAMPLE && (isSamplePage || text.includes("LAYOUT SAMPLE"))) bad(`${where}: layout-sample content in a normal build`);
  if (SAMPLE && isSamplePage) {
    if (!text.includes("LAYOUT SAMPLE")) bad(`${where}: sample page without the LAYOUT SAMPLE banner`);
    if (!text.includes('<meta name="robots" content="noindex">')) bad(`${where}: sample page is not noindex`);
    if (/₹/.test(text)) bad(`${where}: sample page shows a price`);
    if (new Set(text.match(/https:\/\/wa\.me\/[^"]+/g)).size > 1) bad(`${where}: sample page has an order/enquiry button (only the generic header/footer link is allowed)`);
  }

  /* 3c. claims the owner has ruled out (2026-10-07) */
  const plain = text.replace(/<[^>]+>/g, " ");
  if (/free reprint guarantee|reprint guarantee/i.test(plain)) bad(`${where}: "free reprint guarantee" is not approved`);
  if (/\b24[\s-]*(hours?|hrs?)\b|24\s*तास|48 hours guaranteed/i.test(plain)) bad(`${where}: a 24-hour/guaranteed turnaround promise is not approved`);
  if (/same[\s-]day/i.test(plain)) bad(`${where}: a same-day promise is not approved`);
  if (/WP-\d/.test(plain)) bad(`${where}: internal wallpaper media code shown to customers`);
  /* material claims need a supplier certificate or a written policy first */
  const m = plain.match(/water[\s-]?proof|water[\s-]resistant|washable|eco[\s-]friendly|fire[\s-]retardant|flame[\s-]retardant|non[\s-]toxic/i);
  if (m) bad(`${where}: unverified material claim "${m[0]}"`);
  /* wallpaper rates are STARTING prices: every "₹X / sq ft" must read "from ₹X" */
  for (const r of plain.matchAll(/(.{0,8})₹\s?[\d,]+\s*(?:\/|per)\s*sq\.?\s*ft/gi))
    if (!/from\s*$|पासून/i.test(r[1])) bad(`${where}: wallpaper rate shown without "from": "${r[0].trim()}"`);
  /* the ₹49 / free-over-₹2,999 rule is for prints and frames only, never on the wallpaper page */
  if (where.startsWith("wallpapers/") && /₹\s?49\b|₹\s?2,?999\b/.test(plain)) bad(`${where}: prints/frames delivery rule (₹49 / ₹2,999) shown on the wallpaper page`);

  /* 4. page basics */
  if ((text.match(/<h1\b/g) ?? []).length !== 1) bad(`${where}: needs exactly one <h1>`);
  if (!/<title>[^<]{10,}<\/title>/.test(text)) bad(`${where}: missing/short <title>`);
  if (!/<meta name="description" content="[^"]{40,}"/.test(text)) bad(`${where}: missing/short meta description`);
  for (const m of text.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) bad(`${where}: <img> without alt`);

  /* 5. prices: only catalogue numbers may appear on a page */
  /* only approved figures: photo-print prices, the delivery rule, and the mini "packs from" figure.
     Size-wise mini prices (the old ₹19/₹25/₹29) are not approved and must never appear. */
  const known = new Set(PHOTO_SIZES.map((s) => s.price));
  known.add(DELIVERY.from); known.add(DELIVERY.freeOver); known.add(MINI_PACK_FROM);
  /* wallpaper: only the approved tier "starting at" prices (no per-media prices yet) */
  for (const t of WALLPAPER_TIERS) known.add(t.from);
  const body = text.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<head>[\s\S]*?<\/head>/, "");
  for (const m of body.matchAll(/₹\s?([\d,]+)/g)) {
    const n = Number(m[1].replaceAll(",", ""));
    if (!known.has(n)) bad(`${where}: price ₹${m[1]} is not in data/catalog.js`);
  }
  if (/^(canvas-prints|photo-frames|photo-decor|commercial|institutions)\//.test(where) && /₹/.test(body.replace(/<footer[\s\S]*?<\/footer>/, "")))
    bad(`${where}: this page is enquiry/quote-only — no price may appear on it`);
}

/* 5b. image rights are unconfirmed, so no picture of any kind may ship until IMAGES_APPROVED is set */
if (!IMAGES_APPROVED) {
  const RASTER = /\.(webp|jpe?g|png|gif|avif|bmp|ico)$/i;
  for (const f of files) {
    if (RASTER.test(f)) bad(`picture shipped but image rights are not approved: ${rel(f)}`);
  }
  for (const f of pageFiles) {
    const html = readFileSync(f, "utf8");
    if (html.includes("<img")) bad(`${rel(f)}: <img> found but image rights are not approved`);
  }
}

/* 6. no unreviewed pictures: every file under images/ must be used by a page, and the six old
   frame-style photos (images/frames/) must not ship until Drucka confirms its real styles and rights */
const referenced = new Set();
for (const f of files.filter((x) => [".html", ".css"].includes(extname(x))))
  for (const m of readFileSync(f, "utf8").matchAll(/\/images\/[A-Za-z0-9_\-./]+\.(?:webp|jpg|png|svg)/g)) referenced.add(m[0]);
for (const f of files.map(rel).filter((x) => x.startsWith("images/"))) {
  if (!referenced.has("/" + f)) bad(`unused image shipped: ${f}`);
  if (f.startsWith("images/frames/")) bad(`frame-style picture shipped (not approved): ${f}`);
}

/* 7. every redirect in vercel.json must land on a page that exists, and stay temporary (307) for now */
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
for (const r of vercel.redirects ?? []) {
  if (!exists(r.destination)) bad(`vercel.json: redirect ${r.source} -> ${r.destination} lands on a missing page`);
  if (r.permanent !== false) bad(`vercel.json: redirect ${r.source} must be temporary ("permanent": false) until the site is final`);
  if (exists(r.source) && r.source !== "/") bad(`vercel.json: redirect ${r.source} shadows a real page`);
}

if (problems.length) {
  console.error(`\nverify: ${problems.length} problem(s)\n - ${problems.join("\n - ")}\n`);
  process.exit(1);
}
console.log(`verify: ok (${pageFiles.length} pages, ${files.length} files, no scripts/forms/backends/trackers)`);
