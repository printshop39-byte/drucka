/* Static site generator — no dependencies, no runtime JavaScript in the output.
   Reads data/catalog.js + data/policies.js and writes the whole site to dist/. */
import { cpSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, CONTACT, DELIVERY, RETURN_WINDOW_DAYS, PHOTO_SIZES, MINI_MIN, MINI_PACK_FROM, MINI_SIZE_RANGE, CANVAS_SIZES, FRAME_SIZES, LAUNCH_BLOCKERS, IMAGES_APPROVED, WALLPAPER_STYLES, WALLPAPER_MEDIA, WALLPAPER_TIERS, CUSTOM_REPORT_HOURS, PHOTO_DECOR_MEDIA, COMMERCIAL_SERVICES, INSTITUTION_THEMES } from "../data/catalog.js";
import { POLICIES } from "../data/policies.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

/* ── helpers ── */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inr = (n) => `₹${n.toLocaleString("en-IN")}`;
/* BMP characters only in WhatsApp text: 4-byte emoji are mangled by WhatsApp Desktop's wa.me handoff */
const wa = (lines) => `https://wa.me/${CONTACT.whatsappDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
const WA_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41"/></svg>`;

const minPhoto = Math.min(...PHOTO_SIZES.map((s) => s.price));
const GENERAL_WA = wa(["Hi Drucka! I'd like to order. Here is what I need:"]);
/* "Help measuring" band (blueprint): the customer sends a photo of the wall */
const MEASURE_WA = wa(["Hi Drucka! I need help measuring my wall.", "I'll send a photo of the wall here.", "City / PIN code: "]);

/* wallpaper: media offered on the site (names only, never the WP codes) and the lowest tier "starting at" price */
const WP_MEDIA = WALLPAPER_MEDIA.filter((m) => m.show && m.name);
const wpFrom = Math.min(...WALLPAPER_TIERS.map((t) => t.from));
const wpPriceLabel = `From ${inr(wpFrom)} / sq ft`;
const dispatchLine = `Dispatch normally within ${DELIVERY.dispatch}; delivery then takes ${DELIVERY.days}, ${DELIVERY.daysNote}.`;

/* picture-free card headers: simple line icons (no photo has approved rights yet) */
const ICONS = {
  wallpaper: '<svg viewBox="0 0 120 90" focusable="false"><path d="M22 12h56v66H22z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 34c10-8 18 8 28 0s18 8 28 0M22 56c10-8 18 8 28 0s18 8 28 0" fill="none" stroke="currentColor" stroke-width="3"/><rect x="84" y="12" width="16" height="66" rx="8" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  photo: '<svg viewBox="0 0 120 90" focusable="false"><rect x="22" y="10" width="76" height="70" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M30 68l18-22 14 16 10-12 20 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="76" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  prints: '<svg viewBox="0 0 120 90" focusable="false"><rect x="14" y="22" width="52" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="3" transform="rotate(-8 40 42)"/><rect x="52" y="26" width="52" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="3" transform="rotate(6 78 46)"/></svg>',
  shop: '<svg viewBox="0 0 120 90" focusable="false"><path d="M16 36l9-22h70l9 22zM24 36v44h72V36" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="48" y="54" width="24" height="26" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  school: '<svg viewBox="0 0 120 90" focusable="false"><rect x="18" y="12" width="84" height="52" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M60 64v14M42 80h36M32 28h30M32 40h44M32 52h22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
};
const card = ({ icon, title, price, text, href, cta }) => `<article class="card">
  <div class="tile" aria-hidden="true">${ICONS[icon]}</div>
  <div class="card-body">
    <h3>${esc(title)}</h3>
    ${price ? `<p class="price">${esc(price)}</p>` : ""}
    <p class="muted">${esc(text)}</p>
    <a class="btn btn-outline" href="${href}">${esc(cta)}</a>
  </div>
</article>`;
/* a list of WhatsApp "chips": each opens WhatsApp with that item already in the message */
const waChips = (items, lines) =>
  `<ul class="chips">${items.map((it) => `<li><a href="${wa(lines(it))}" target="_blank" rel="noopener noreferrer">${esc(it)}</a></li>`).join("")}</ul>`;
const helpBand = `<section class="band">
  <div class="wrap band-row">
    <div>
      <h2>Need help measuring your wall?</h2>
      <p>Send us a photo of the wall and its rough size. We will tell you what to measure and what it will cost.</p>
    </div>
    <a class="btn btn-light" href="${MEASURE_WA}" target="_blank" rel="noopener noreferrer">${WA_ICON}<span>Send a photo of your wall</span></a>
  </div>
</section>`;
/* `npm run dev:sample` only: adds a clearly-marked layout sample of the ready-made section. A normal build never has it. */
const SAMPLE = process.argv.includes("--sample");

/* Blueprint menu: four catalogue groups plus "your own photo" as a separate, highlighted item.
   Canvas Prints and Photo Frames are reached from Photo Décor and the footer. */
const NAV = [
  { href: "/wallpapers", label: "Wallpapers" },
  { href: "/photo-decor", label: "Your own photo", highlight: true },
  { href: "/photo-prints", label: "Photo Prints" },
  { href: "/commercial", label: "Commercial" },
  { href: "/institutions", label: "Schools & Hospitals" },
];
if (SAMPLE) NAV.push({ href: "/ready-made", label: "Ready-made (sample)" });

/* ── layout ── */
/* `waLink` = the page's own pre-filled WhatsApp message, used by the header button and the floating button */
function layout({ path, title, description, body, current = "", image = "", jsonld = "", noindex = false, waLink = GENERAL_WA }) {
  const url = SITE.url + (path === "/" ? "/" : path);
  const nav = NAV.map((n) => `<a href="${n.href}"${n.highlight ? ' class="hl"' : ""}${n.href === current ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`).join("");
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : ""}<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0f6e56">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${SITE.url}${image}">
` : ""}<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/fraunces-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">
${jsonld}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap head">
    <a class="logo" href="/" aria-label="Drucka — home">DRUCKA</a>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <a class="btn btn-outline btn-sm head-wa" href="${waLink}" target="_blank" rel="noopener noreferrer">${WA_ICON}<span>WhatsApp</span></a>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer on-dark">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h2>Drucka</h2>
        <p>Custom wallpaper, photo prints, canvas prints and photo frames, printed in our studio in Kolhapur and delivered across India. We also print for shops, offices, schools and hospitals. Printing since ${SITE.printingSince}.</p>
        <p>WhatsApp: <a href="${GENERAL_WA}" target="_blank" rel="noopener noreferrer">${CONTACT.whatsappDisplay}</a><br>
        Email: <a href="mailto:${CONTACT.email}">${CONTACT.email}</a><br>
        Studio: ${esc(CONTACT.studio)}</p>
      </div>
      <div>
        <h2>For your home</h2>
        <ul>
          <li><a href="/wallpapers">Wallpapers</a></li>
          <li><a href="/wallpapers#media">Media guide</a></li>
          <li><a href="/photo-decor">Your own photo</a></li>
          <li><a href="/photo-prints">Photo Prints</a></li>
          <li><a href="/photo-prints#mini">Mini Prints</a></li>
          <li><a href="/canvas-prints">Canvas Prints</a></li>
          <li><a href="/photo-frames">Photo Frames</a></li>
        </ul>
      </div>
      <div>
        <h2>For business</h2>
        <ul>
          <li><a href="/commercial">Commercial &amp; Branding</a></li>
          <li><a href="/institutions">Schools &amp; Hospitals</a></li>
          <li><a href="/#how-to-order">How to order</a></li>
        </ul>
      </div>
      <div>
        <h2>Policies</h2>
        <ul>${POLICIES.map((p) => `<li><a href="/${p.slug}">${esc(p.label)}</a></li>`).join("")}</ul>
      </div>
    </div>
    <p class="fine">© ${new Date().getFullYear()} Drucka.${IMAGES_APPROVED ? " Sample artwork in product pictures is for illustration." : ""}</p>
  </div>
</footer>
<a class="fab" href="${waLink}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Drucka on WhatsApp">${WA_ICON}</a>
</body>
</html>
`;
}

/* `sr` = extra words for screen readers only, so repeated labels ("Order", "Ask", "Get a quote") stay distinguishable */
const waBtn = (href, label, cls = "btn-primary", extra = "", sr = "") =>
  `<a class="btn ${cls}${extra}" href="${href}" target="_blank" rel="noopener noreferrer">${WA_ICON}<span>${esc(label)}${sr ? `<span class="visually-hidden"> ${esc(sr)}</span>` : ""}</span></a>`;

const crumbs = (name) => `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span>${esc(name)}</span></nav></div>`;

function priceTable(caption, sizes, orderLines) {
  const rows = sizes
    .map(
      (s) => `<tr>
  <td class="size"><strong>${esc(s.label)}</strong><span>${esc(s.name)}</span></td>
  <td class="price">${inr(s.price)}</td>
  <td class="go">${waBtn(wa(orderLines(s)), "Order", "btn-outline", " btn-sm", `${s.label} on WhatsApp`)}</td>
</tr>`
    )
    .join("\n");
  return `<div class="table-wrap"><table class="prices">
<caption>${esc(caption)}</caption>
<thead><tr><th scope="col">Size</th><th scope="col">Price</th><th scope="col"><span class="visually-hidden">Order</span></th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

/* owner ruling 2026-10-07: the ₹49 / free-over-₹2,999 rule is for photo prints, mini prints and frames ONLY.
   Wallpaper and large-format items ship in tubes or big parcels and are quoted per order. */
const deliveryLine = `Delivery for photo prints, mini prints and frames is extra: from ${inr(DELIVERY.from)}, free on orders of ${inr(DELIVERY.freeOver)} and above. The exact charge is confirmed on WhatsApp before you pay.`;
const largeDeliveryLine = "Delivery for wallpaper, photo décor, canvas and commercial work is charged separately, based on the size of the parcel and the destination. We tell you the charge on WhatsApp before you confirm the order.";

/* ── pages ── */
const pages = [];

/* HOME */
pages.push({
  path: "/",
  file: "index.html",
  title: "Custom Wallpaper, Photo Prints, Canvas & Frames | Drucka",
  description: `Custom wallpaper made to your wall size, photo prints from ${inr(minPhoto)}, mini prints — packs from ${inr(MINI_PACK_FROM)}, canvas prints and photo frames. Printing since ${SITE.printingSince} in Kolhapur; order on WhatsApp.`,
  jsonld: `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE.name,
    url: SITE.url,
    telephone: "+917083811355",
    email: CONTACT.email,
    description: `Custom wallpaper, photo prints, canvas prints and photo frames, printed in Kolhapur and delivered across India. Printing since ${SITE.printingSince}.`,
    areaServed: "IN",
    address: { "@type": "PostalAddress", addressLocality: "Kolhapur", addressRegion: "Maharashtra", postalCode: "416001", addressCountry: "IN" },
    foundingDate: SITE.foundingDate,
    sameAs: [CONTACT.instagram],
  })}</script>
`,
  body: `
<section class="hero">
  <div class="wrap hero-text">
    <div>
      <p class="eyebrow">Custom wallpaper · Photo prints · Canvas &amp; frames</p>
      <h1>${esc(SITE.tagline)}</h1>
      <p class="lead">Custom wallpaper made to the size of your wall, photo prints, canvas prints and photo frames, all printed in our Kolhapur studio. We also print for shops, offices, schools and hospitals. Tell us what you need on WhatsApp and we take care of the rest.</p>
      <div class="row">
        ${waBtn(GENERAL_WA, "Order on WhatsApp")}
        <a class="btn btn-outline" href="/wallpapers">See wallpapers</a>
      </div>
    </div>
  </div>
  <div class="wrap">
    <ul class="trustbar" aria-label="Why Drucka">
      <li>Printing since ${SITE.printingSince}</li>
      <li>Made-to-size wallpaper</li>
      <li>Premium print quality</li>
      <li>Secure packaging</li>
      <li><a href="/returns-policy">Defect support</a></li>
    </ul>
  </div>
</section>

<section class="tint" id="shop">
  <div class="wrap">
    <p class="eyebrow">For your home</p>
    <h2>What we make</h2>
    <div class="cards">
      ${card({ icon: "wallpaper", title: "Wallpapers", price: wpPriceLabel, text: `Made to your wall size, in ${WALLPAPER_STYLES.length} styles and ${WP_MEDIA.length} wallpaper media.`, href: "/wallpapers", cta: "See styles & media" })}
      ${card({ icon: "photo", title: "Canvas, Frames & Photo Décor", price: "Price on WhatsApp", text: "Your own photo as a canvas, a framed print, a décor print, a photo wallpaper or a mobile back cover.", href: "/photo-decor", cta: "Use your own photo" })}
      ${card({ icon: "prints", title: "Photo Prints", price: `From ${inr(minPhoto)}`, text: `Single prints from ${PHOTO_SIZES[0].label} to ${PHOTO_SIZES[PHOTO_SIZES.length - 1].label}. Mini prints — packs from ${inr(MINI_PACK_FROM)}.`, href: "/photo-prints", cta: "See sizes & prices" })}
    </div>
    <p class="eyebrow mt-xl">For business and institutions</p>
    <h2>Commercial, schools and hospitals</h2>
    <div class="cards">
      ${card({ icon: "shop", title: "Commercial & Branding", price: "Quote on WhatsApp", text: "Retail and office graphics, glass film, vinyl stickers, vehicle graphics, backlit signage and fine-art reproduction.", href: "/commercial", cta: "See commercial work" })}
      ${card({ icon: "school", title: "Schools & Hospitals", price: "Quote on WhatsApp", text: "Learning walls for classrooms and calm, clear walls for hospitals, planned for all your walls together.", href: "/institutions", cta: "See learning walls" })}
    </div>
  </div>
</section>

${helpBand}

<section id="how-to-order">
  <div class="wrap">
    <p class="eyebrow">Simple ordering</p>
    <h2>How to order</h2>
    <ol class="steps">
      <li><h3>Choose</h3><p>Pick a product and size on this website.</p></li>
      <li><h3>Message us</h3><p>Tap Order on WhatsApp. Your choice is already filled into the message.</p></li>
      <li><h3>Send your photos</h3><p>Share your photos in the chat. For the best quality, send them as a Document so WhatsApp does not compress them.</p></li>
      <li><h3>We confirm and print</h3><p>We confirm the total, delivery charge and payment details with you, print in our studio and ship to you.</p></li>
    </ol>
    <p class="muted mt">There is no checkout and no photo upload on this website, so there is nothing to sign up for.</p>
  </div>
</section>

<section class="tint">
  <div class="wrap two">
    <div>
      <p class="eyebrow">Good to know</p>
      <h2>What you can count on</h2>
      <ul class="ticks">
        <li>Printing experience since ${SITE.printingSince}</li>
        <li>Printed to order in our own studio in Kolhapur</li>
        <li>Photo prints from a single piece; mini prints in packs of ${MINI_MIN} or more</li>
        <li>${esc(dispatchLine)}</li>
        <li>Defect support: report printing defects, wrong items or transit damage within ${CUSTOM_REPORT_HOURS} hours for custom-made products, or within ${RETURN_WINDOW_DAYS} days for photo prints and frames — see <a href="/returns-policy">Returns &amp; Replacement</a></li>
        <li>We check your photo for the print size you choose and tell you before printing if we see a quality concern</li>
      </ul>
      <p class="muted mt-sm">${esc(deliveryLine)} ${esc(largeDeliveryLine)}</p>
    </div>
    <div id="faq">
      <p class="eyebrow">Questions</p>
      <h2>FAQ</h2>
      <details><summary>How do I order?</summary><p>Tap Order on WhatsApp on any product. Your message is pre-filled; send your photos and delivery details in the chat. There is no checkout on this website.</p></details>
      <details><summary>How do I pay?</summary><p>We confirm the total, delivery charge and payment details with you on WhatsApp before we print. This website does not take payments.</p></details>
      <details><summary>Can I upload photos on the website?</summary><p>No. You send your photos to us directly on WhatsApp (or by e-mail) after choosing a product.</p></details>
      <details><summary>What photo quality do I need?</summary><p>Send the original, full-size photo, not a screenshot. Larger prints need higher-resolution photos. We check your photo for your chosen size and tell you before printing if we see a concern.</p></details>
      <details><summary>How long does it take?</summary><p>${esc(dispatchLine)} For large commercial, school or hospital projects the timeline depends on the quantity; we tell you the date before we print.</p></details>
      <details><summary>What does delivery cost?</summary><p>${esc(deliveryLine)} ${esc(largeDeliveryLine)} You can also collect from our Kolhapur studio.</p></details>
      <details><summary>How much does wallpaper cost?</summary><p>${WALLPAPER_TIERS.map((t) => `${esc(t.name)} from ${inr(t.from)}`).join(", ")} per sq ft. These are starting prices: the exact price depends on the media, your wall size and any customisation. Send us the width and height of the wall on WhatsApp and we tell you the exact price.</p></details>
      <details><summary>How much are canvas prints, frames and commercial work?</summary><p>We confirm availability, sizes and price on WhatsApp for canvas prints, photo frames, photo décor and all commercial, school and hospital work.</p></details>
      <details><summary>What if something goes wrong?</summary><p>Custom-made products (wallpaper, photo décor, canvas and other made-to-size work) are not returnable for change of mind. If there is a printing defect, a wrong item or transit damage, tell us within ${CUSTOM_REPORT_HOURS} hours of delivery with photos or a video; after checking, we replace or reprint it or offer another suitable resolution. Photo prints, mini prints and frames: message us within ${RETURN_WINDOW_DAYS} days. Details: <a href="/returns-policy">Returns &amp; Replacement</a>.</p></details>
    </div>
  </div>
</section>`,
});

/* PHOTO PRINTS (+ mini prints) */
pages.push({
  path: "/photo-prints",
  file: "photo-prints/index.html",
  current: "/photo-prints",
  waLink: wa(["Hi Drucka! I'd like to order Photo Prints.", "Size: ", "Quantity: ", "I'll send my photos here."]),
  title: `Photo Prints from ${inr(minPhoto)} & Mini Prints — packs from ${inr(MINI_PACK_FROM)} | Drucka`,
  description: `Photo prints ${PHOTO_SIZES[0].label} to ${PHOTO_SIZES[PHOTO_SIZES.length - 1].label} from ${inr(minPhoto)}, no minimum. Mini prints — packs from ${inr(MINI_PACK_FROM)}, minimum ${MINI_MIN} per order. Order on WhatsApp.`,
  body: `${crumbs("Photo Prints")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Photo prints</p>
      <h1>Photo Prints</h1>
      <p class="lead muted">Prints from ${esc(PHOTO_SIZES[0].label)} up to ${esc(PHOTO_SIZES[PHOTO_SIZES.length - 1].label)}. Order a single print or as many as you like — there is no minimum for photo prints.</p>
      <p>Tap <strong>Order</strong> next to a size. WhatsApp opens with your choice filled in; send your photos there.</p>
      <p class="muted">${esc(deliveryLine)}</p>
    </div>
  </div>
</section>
<section class="tint tight">
  <div class="wrap">
    ${priceTable("Photo print prices (per print)", PHOTO_SIZES, (s) => ["Hi Drucka! I'd like to order Photo Prints.", `Size: ${s.label} (${inr(s.price)} each)`, "Quantity: ", "I'll send my photos here."])}
  </div>
</section>
<section id="mini">
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Small prints, big memories</p>
      <h2>Mini Prints</h2>
      <p class="price-line">Mini prints — packs from ${inr(MINI_PACK_FROM)}</p>
      <p class="lead muted">Small prints for wallets, scrapbooks and gifting, in sizes from ${MINI_SIZE_RANGE}. Mini prints are sold in packs: <strong>minimum ${MINI_MIN} prints per order</strong>.</p>
      <div class="notice">We confirm the size and the exact price with you on WhatsApp. Want just one or two prints? Choose a regular photo print above.</div>
      ${waBtn(wa([`Hi Drucka! I'd like to order Mini Prints (minimum ${MINI_MIN} per order).`, "Size: ", `Quantity (${MINI_MIN} or more): `, "I'll send my photos here."]), "Order mini prints on WhatsApp")}
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap two">
    <div>
      <h2>Sending your photos</h2>
      <ul class="ticks">
        <li>Send the original, full-size photo, not a screenshot.</li>
        <li>In WhatsApp, attach photos as a <strong>Document</strong> so they are not compressed.</li>
        <li>Larger prints need higher-resolution photos. We check each photo for your chosen size and tell you before printing if we see a concern.</li>
        <li>Tell us the size, quantity and your delivery address and PIN code.</li>
      </ul>
    </div>
    <div>
      <h2>Not sure which size?</h2>
      <p class="muted">Message us and we will help you choose.</p>
      ${waBtn(GENERAL_WA, "Ask on WhatsApp")}
    </div>
  </div>
</section>`,
});

/* CANVAS PRINTS (enquiry only — no prices, no fixed sizes) */
const canvasWa = wa(["Hi Drucka! I'd like a price for a Canvas Print.", "Size I have in mind: ", "Quantity: 1", "I'll send my photo here."]);
pages.push({
  path: "/canvas-prints",
  file: "canvas-prints/index.html",
  current: "/canvas-prints",
  waLink: canvasWa,
  title: "Canvas Prints — Your Photo on Canvas | Drucka",
  description: "Turn a favourite photo into a canvas print. Tell us the size you have in mind on WhatsApp and we confirm availability and price. Printed in Kolhapur, delivered across India.",
  body: `${crumbs("Canvas Prints")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Canvas prints</p>
      <h1>Canvas Prints</h1>
      <p class="lead muted">Turn a favourite photo into a canvas print for your wall.</p>
      <div class="notice"><strong>Price on WhatsApp.</strong> We do not list canvas sizes or prices on the website. Tell us the size you have in mind and we will confirm whether we can make it and what it costs.</div>
      ${CANVAS_SIZES.length ? `<h2>Available sizes</h2><ul class="ticks">${CANVAS_SIZES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ul>` : ""}
      ${waBtn(canvasWa, "Ask about a canvas print")}
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap">
    <h2>How it works</h2>
    <ol class="steps">
      <li><h3>Message us</h3><p>Tap the button. Add the size you have in mind and how many you want.</p></li>
      <li><h3>Send your photo</h3><p>Share the original, full-size photo in the chat, as a Document so WhatsApp does not compress it.</p></li>
      <li><h3>We check and quote</h3><p>We check the photo for the size you want and confirm the price and delivery charge.</p></li>
      <li><h3>We print and ship</h3><p>After you confirm, we print in our studio and ship to you.</p></li>
    </ol>
  </div>
</section>`,
});

/* PHOTO FRAMES (enquiry only — no styles, no pictures of styles, no prices) */
const frameWa = wa(["Hi Drucka! I'd like to know about Photo Frame options and prices.", "Size I have in mind: ", "Quantity: 1", "I'll send my photo here."]);
pages.push({
  path: "/photo-frames",
  file: "photo-frames/index.html",
  current: "/photo-frames",
  waLink: frameWa,
  title: "Photo Frames — Your Photo Printed & Framed | Drucka",
  description: "Your photo printed and framed. Frame options, sizes and prices are shared on WhatsApp. Printed in Kolhapur, delivered across India.",
  body: `${crumbs("Photo Frames")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Photo frames</p>
      <h1>Photo Frames</h1>
      <p class="lead muted">Your photo, printed and framed.</p>
      <div class="notice"><strong>Frame options on WhatsApp.</strong> Frame styles, sizes and prices are shared on WhatsApp. Tell us the size you have in mind and we will confirm what is available and the price.</div>
      ${FRAME_SIZES.length ? `<h2>Available sizes</h2><ul class="ticks">${FRAME_SIZES.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ul>` : ""}
      ${waBtn(frameWa, "Ask about frame options")}
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap">
    <h2>How it works</h2>
    <ol class="steps">
      <li><h3>Message us</h3><p>Tap the button. Add the size you have in mind and how many you want.</p></li>
      <li><h3>Send your photo</h3><p>Share the original, full-size photo in the chat, as a Document so WhatsApp does not compress it.</p></li>
      <li><h3>We check and confirm</h3><p>We check the photo for that size and confirm the frame options, price and delivery charge.</p></li>
      <li><h3>We print, frame and ship</h3><p>After you confirm, we print and frame it in our studio and ship to you.</p></li>
    </ol>
  </div>
</section>`,
});

/* a product card without a picture tile, with its own pre-filled WhatsApp button (or a link to its page) */
const actionCard = ({ title, text, waLines, href, cta, sr = "" }) => `<article class="card">
  <div class="card-body">
    <h3>${esc(title)}</h3>
    <p class="muted">${esc(text)}</p>
    ${waLines ? waBtn(wa(waLines), cta, "btn-outline", "", sr) : `<a class="btn btn-outline" href="${href}">${esc(cta)}</a>`}
  </div>
</article>`;
const previewLine = `<p class="trust">We send you a digital preview on WhatsApp and print only after you approve it.</p>`;

/* WALLPAPERS (blueprint: made-to-size wallpaper). No live calculator: the site has no JavaScript. */
const wallLines = (style = "", media = "") => ["Hi Drucka! I'd like a wallpaper for my wall.", "Wall size (width × height): ", `Style: ${style}`, `Media: ${media}`, "I'll send a photo of the wall here."];
const WALL_WA = wa(wallLines());
const showBestFor = WP_MEDIA.some((m) => m.bestFor);
const mediaTable = `<div class="table-wrap"><table class="prices">
<caption>Wallpaper media</caption>
<thead><tr><th scope="col">Media</th>${showBestFor ? '<th scope="col">Best for</th>' : ""}<th scope="col"><span class="visually-hidden">Ask</span></th></tr></thead>
<tbody>
${WP_MEDIA.map((m) => `<tr>
  <td class="size"><strong>${esc(m.name)}</strong></td>
  ${showBestFor ? `<td>${esc(m.bestFor || "Ask us")}</td>` : ""}
  <td class="go">${waBtn(wa(wallLines("", m.name)), "Ask", "btn-outline", " btn-sm", `about ${m.name} on WhatsApp`)}</td>
</tr>`).join("\n")}
</tbody></table></div>`;
const tierTable = `<div class="table-wrap"><table class="prices">
<caption>Starting prices (per sq ft)</caption>
<thead><tr><th scope="col">Range</th><th scope="col">Starting at</th></tr></thead>
<tbody>
${WALLPAPER_TIERS.map((t) => `<tr><td class="size"><strong>${esc(t.name)}</strong></td><td class="price">From ${inr(t.from)} / sq ft</td></tr>`).join("\n")}
<tr><td class="size"><strong>Custom artwork or special design</strong></td><td class="price">Quote on WhatsApp</td></tr>
</tbody></table></div>`;
pages.push({
  path: "/wallpapers",
  file: "wallpapers/index.html",
  current: "/wallpapers",
  waLink: WALL_WA,
  title: "Custom Wallpaper, Made to Your Wall Size | Drucka",
  description: `Custom wallpaper printed to the exact size of your wall, in ${WALLPAPER_STYLES.length} styles and ${WP_MEDIA.length} wallpaper media, with starting prices per sq ft. Send your wall size on WhatsApp for a price and a design preview. Printed in Kolhapur.`,
  body: `${crumbs("Wallpapers")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Made-to-size wallpaper</p>
      <h1>Wallpapers</h1>
      <p class="lead muted">Wallpaper printed to the exact size of your wall. Choose a style and a wallpaper media, send us the width and height of your wall, and we send you the price and a digital preview.</p>
      <p class="price-line">${esc(wpPriceLabel)}</p>
      <p class="muted">A starting price, not a flat rate: the exact price depends on the media, your wall size and any customisation. We confirm it on WhatsApp before printing.</p>
      ${waBtn(WALL_WA, "Get a wallpaper price on WhatsApp")}
      ${previewLine}
    </div>
  </div>
</section>
<section class="tint" id="styles">
  <div class="wrap">
    <p class="eyebrow">Shop by style</p>
    <h2>Choose a style</h2>
    <p class="muted">Tap a style to ask about it on WhatsApp. The style is already in the message.</p>
    ${waChips(WALLPAPER_STYLES, (s) => wallLines(s))}
  </div>
</section>
<section id="media">
  <div class="wrap">
    <p class="eyebrow">Media guide</p>
    <h2>Wallpaper media</h2>
    <p class="muted">Your wallpaper is printed on one of these media. Not sure which one suits your room? Tap Ask and we will help you choose.</p>
    ${mediaTable}
  </div>
</section>
<section class="tight">
  <div class="wrap">
    ${tierTable}
    <p class="muted mt-sm">${esc(dispatchLine)} ${esc(largeDeliveryLine)}</p>
  </div>
</section>
<section class="tint" id="measure">
  <div class="wrap">
    <h2>How to measure your wall</h2>
    <ol class="steps">
      <li><h3>Width</h3><p>Measure the wall from side to side at its widest point.</p></li>
      <li><h3>Height</h3><p>Measure from the floor (or skirting) to the ceiling at its highest point.</p></li>
      <li><h3>Openings</h3><p>Note any doors, windows, switches or shelves on the wall.</p></li>
      <li><h3>Photo</h3><p>Take a photo of the whole wall and send it to us with the sizes, in feet, inches or cm.</p></li>
    </ol>
  </div>
</section>
<section>
  <div class="wrap">
    <h2>How ordering works</h2>
    <ol class="steps">
      <li><h3>Send your wall size</h3><p>Tap the WhatsApp button and add the width, height, style and media.</p></li>
      <li><h3>Digital preview</h3><p>We send you the price and a preview of the design at your wall's size.</p></li>
      <li><h3>You approve</h3><p>Tell us if the preview is right, or what to change.</p></li>
      <li><h3>Print and ship</h3><p>We print in our studio, pack and ship to you.</p></li>
    </ol>
  </div>
</section>
${helpBand}`,
});

/* PHOTO DECOR — the customer's own photo (blueprint /photo-decor). No upload: photos come on WhatsApp. */
const DECOR_WA = wa(["Hi Drucka! I'd like to use my own photo.", "Product (wallpaper / décor print / mobile back cover): ", "Size: ", "I'll send my photo here."]);
pages.push({
  path: "/photo-decor",
  file: "photo-decor/index.html",
  current: "/photo-decor",
  waLink: DECOR_WA,
  title: "Your Own Photo as Wallpaper, Décor Print or Canvas | Drucka",
  description: "Turn your own photo into a wallpaper for a whole wall, a décor print, a canvas, a framed print or a mobile back cover. Send your photo on WhatsApp; we print in Kolhapur.",
  body: `${crumbs("Your own photo")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Your own photo</p>
      <h1>Your Photo, Your Wall</h1>
      <p class="lead muted">Turn your own photo into a wallpaper for a whole wall, a décor print, a canvas, a framed print or a mobile back cover. There is no upload on this website: you send the photo to us on WhatsApp.</p>
      ${waBtn(DECOR_WA, "Send your photo on WhatsApp")}
      ${previewLine}
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap">
    <h2>Choose a product</h2>
    <div class="cards">
      ${actionCard({ title: "Photo Wallpaper", text: "Your photo printed to the size of your wall.", waLines: ["Hi Drucka! I'd like my own photo as a wallpaper.", "Wall size (width × height): ", "I'll send my photo and a photo of the wall here."], cta: "Ask about photo wallpaper" })}
      ${actionCard({ title: "Photo Décor Print", text: `Your photo printed on a décor media: ${PHOTO_DECOR_MEDIA.join(", ")}.`, waLines: ["Hi Drucka! I'd like a Photo Décor print of my own photo.", `Media (${PHOTO_DECOR_MEDIA.join(" / ")}): `, "Size I have in mind: ", "I'll send my photo here."], cta: "Ask about décor prints" })}
      ${actionCard({ title: "Mobile Back Cover", text: "Your photo on a back cover for your phone.", waLines: ["Hi Drucka! I'd like a mobile back cover with my own photo.", "Phone model: ", "Quantity: 1", "I'll send my photo here."], cta: "Ask about back covers" })}
      ${actionCard({ title: "Canvas Print", text: "Your photo printed on canvas for your wall.", href: "/canvas-prints", cta: "See canvas prints" })}
      ${actionCard({ title: "Photo Frame", text: "Your photo printed and framed.", href: "/photo-frames", cta: "See photo frames" })}
      ${actionCard({ title: "Photo Prints", text: "Photo-paper prints and mini prints, with prices listed.", href: "/photo-prints", cta: "See photo prints" })}
    </div>
  </div>
</section>
<section>
  <div class="wrap two">
    <div>
      <h2>Sending your photo</h2>
      <ul class="ticks">
        <li>Send the original, full-size photo, not a screenshot.</li>
        <li>In WhatsApp, attach it as a <strong>Document</strong> so it is not compressed.</li>
        <li>A wall or a large print needs a high-resolution photo. We check your photo for the size you want and tell you before printing if it is not sharp enough.</li>
        <li>Tell us which part of the photo matters most; we show it to you in the preview.</li>
      </ul>
    </div>
    <div>
      <h2>How it works</h2>
      <ol class="numbered">
        <li>Send your photo and the product you want.</li>
        <li>We check the photo and send you the price and a digital preview.</li>
        <li>You approve the preview.</li>
        <li>We print in our studio and ship to you.</li>
      </ol>
    </div>
  </div>
</section>
${helpBand}`,
});

/* COMMERCIAL & WIDE-FORMAT — quote only */
const quoteLines = (service) => [`Hi Drucka! I'd like a quote for ${service}.`, ...(service === "Vehicle graphics" ? ["Vehicle type: "] : ["Where (shop / office / other): "]), "Size or area: ", "City: ", "I'll send photos of the space here."];
const COMM_WA = wa(["Hi Drucka! I'd like a quote for commercial printing.", "What I need: ", "Size or area: ", "City: ", "I'll send photos of the space here."]);
pages.push({
  path: "/commercial",
  file: "commercial/index.html",
  current: "/commercial",
  waLink: COMM_WA,
  title: "Commercial & Branding Prints — Retail, Office, Glass, Vehicle | Drucka",
  description: "Large-format printing for shops, offices and vehicles: retail branding, office graphics, glass film, vinyl stickers, vehicle graphics, backlit signage and fine-art reproduction. Quote on WhatsApp.",
  body: `${crumbs("Commercial")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Commercial &amp; wide-format</p>
      <h1>Commercial &amp; Branding</h1>
      <p class="lead muted">Large-format printing for shops, offices and vehicles. Tell us what you need, the size and the city, send a photo of the space, and we send you a quote.</p>
      ${waBtn(COMM_WA, "Get a quote on WhatsApp")}
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap">
    <h2>What we print</h2>
    <div class="cards">
      ${COMMERCIAL_SERVICES.map((s) => actionCard({ title: s.name, text: s.detail, waLines: quoteLines(s.name), cta: "Get a quote", sr: `for ${s.name}` })).join("\n      ")}
      ${actionCard({ title: "Canvas prints", text: "Canvas prints for offices, hotels and shops.", href: "/canvas-prints", cta: "See canvas prints" })}
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <h2>How a quote works</h2>
    <ol class="steps">
      <li><h3>Tell us</h3><p>What you need, where it goes, the size and your city.</p></li>
      <li><h3>Send photos</h3><p>Photos of the wall, glass, shop front or vehicle help us quote correctly.</p></li>
      <li><h3>Quote</h3><p>We send you the price and a digital preview of the design.</p></li>
      <li><h3>Print</h3><p>After you approve, we print in our studio. The timeline depends on the size of the project; we confirm it with the quote.</p></li>
    </ol>
  </div>
</section>`,
});

/* SCHOOLS & HOSPITALS — quote only. The buyer is a principal, trustee or hospital admin, so: catalogue + quote. */
const instLines = (theme = "") => ["Hi Drucka! I'd like a quote for institution walls.", "Institution name: ", "School or hospital: ", "City: ", "Number of walls: ", "Wall sizes (width × height): ", `Themes: ${theme}`, "Contact person: ", "I'll send photos of the walls here."];
const INST_WA = wa(instLines());
const INST_MAIL = `mailto:${CONTACT.email}?subject=${encodeURIComponent("Quote for institution walls")}&body=${encodeURIComponent(instLines().slice(1).join("\n"))}`;
pages.push({
  path: "/institutions",
  file: "institutions/index.html",
  current: "/institutions",
  waLink: INST_WA,
  title: "Learning Walls for Schools & Calm Walls for Hospitals | Drucka",
  description: "Printed wall graphics for classrooms, corridors, wards and waiting areas: alphabet, world map, solar system, the Marathi alphabet (Barakhadi), wayfinding and calm nature walls. One combined quote on WhatsApp.",
  body: `${crumbs("Schools & Hospitals")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Schools &amp; Hospitals</p>
      <h1>Learning Walls and Calm Walls</h1>
      <p class="lead muted">Printed wall graphics for classrooms, corridors, wards and waiting areas. Tell us how many walls you have and their sizes, and we send one combined quote for all of them.</p>
      <div class="row">
        ${waBtn(INST_WA, "Get an institution quote")}
        <a class="btn btn-outline" href="${esc(INST_MAIL)}">Email us instead</a>
      </div>
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap two">
    <div>
      <h2>For schools</h2>
      <p class="muted">Tap a theme to ask about it on WhatsApp. Includes Maharashtra designs such as the Marathi alphabet (Barakhadi) and a history timeline.</p>
      ${waChips(INSTITUTION_THEMES.schools, (t) => instLines(t))}
    </div>
    <div>
      <h2>For hospitals</h2>
      <p class="muted">Clear, calm walls for children's wards, corridors and waiting areas.</p>
      ${waChips(INSTITUTION_THEMES.hospitals, (t) => instLines(t))}
    </div>
  </div>
</section>
<section>
  <div class="wrap">
    <h2>Plan all your walls together</h2>
    <ol class="steps">
      <li><h3>List your walls</h3><p>How many classrooms, corridors or wards, and the width and height of each wall.</p></li>
      <li><h3>Send photos</h3><p>A photo of each wall helps us plan the designs and sizes.</p></li>
      <li><h3>One quote</h3><p>We suggest themes and media and send one combined quote with digital previews.</p></li>
      <li><h3>Print</h3><p>After you approve, we print in our studio. The timeline depends on the size of the project; we confirm it with the quote.</p></li>
    </ol>
    <div class="row mt">
      ${waBtn(INST_WA, "Send your wall list on WhatsApp", "btn-outline")}
    </div>
  </div>
</section>`,
});

/* READY-MADE ARTWORK — LAYOUT SAMPLE ONLY.
   Generated only by `npm run dev:sample` (--sample). It shows where real designs will go: no real designs, no prices,
   no pictures, no order buttons. Pages are noindex, left out of the sitemap, and the guard (scripts/verify.mjs) fails
   any normal build that contains them. Replace with real data once the owner supplies designs, pictures and rules. */
if (SAMPLE) {
  const ICON = '<svg viewBox="0 0 120 90" focusable="false"><rect x="22" y="10" width="76" height="70" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M30 68l18-22 14 16 10-12 20 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="76" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
  const banner = `<div class="notice sample"><strong>LAYOUT SAMPLE.</strong> Placeholder cards only. There are no real designs, prices, pictures or order buttons here yet.</div>`;
  const card = (n) => `<article class="card">
  <div class="tile tall" aria-hidden="true">${ICON}<span>Artwork photo</span></div>
  <div class="card-body">
    <h3>Design name ${n}</h3>
    <p class="muted">Type · Size</p>
    <p class="price">Price: to be added</p>
    <a class="btn btn-outline" href="/ready-made/sample-design">View details</a>
  </div>
</article>`;
  pages.push({
    path: "/ready-made",
    file: "ready-made/index.html",
    current: "/ready-made",
    noindex: true,
    title: "Ready-made artwork (layout sample) | Drucka",
    description: "Layout sample of the ready-made artwork section: placeholder cards only, no real designs, prices or pictures yet.",
    body: `${crumbs("Ready-made (sample)")}
<section>
  <div class="wrap">
    <p class="eyebrow">Ready-made artwork</p>
    <h1>Ready-made Artwork</h1>
    <p class="lead muted">Browse ready-made designs, choose one, and order it on WhatsApp.</p>
    ${banner}
    <h2 class="mt-lg">Canvas prints</h2>
    <div class="cards mt-sm">${[1, 2, 3].map(card).join("\n")}</div>
    <h2 class="mt-lg">Framed prints</h2>
    <div class="cards mt-sm">${[4, 5, 6].map(card).join("\n")}</div>
  </div>
</section>`,
  });
  pages.push({
    path: "/ready-made/sample-design",
    file: "ready-made/sample-design/index.html",
    current: "/ready-made",
    noindex: true,
    title: "Design name (layout sample) | Drucka",
    description: "Layout sample of one ready-made design page: placeholder details only, no real design, price, picture or order button yet.",
    body: `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/ready-made">Ready-made</a> / <span>Design name</span></nav></div>
<section>
  <div class="wrap two">
    <div class="tile tall big" aria-hidden="true">${ICON}<span>Artwork photo</span></div>
    <div>
      <p class="eyebrow">Type · sample</p>
      <h1>Design name</h1>
      ${banner}
      <p class="muted">A short description of the design goes here.</p>
      <dl class="specs">
        <div><dt>Type</dt><dd>to be added</dd></div>
        <div><dt>Size options</dt><dd>to be added</dd></div>
        <div><dt>Finish</dt><dd>to be added</dd></div>
        <div><dt>Availability</dt><dd>to be added (ready stock or made to order)</dd></div>
        <div><dt>Delivery</dt><dd>to be added</dd></div>
      </dl>
      <p class="price-line">Price: to be added</p>
      <div class="notice">The WhatsApp order button for this design appears here once it is a real design.</div>
    </div>
  </div>
</section>
<section class="tint">
  <div class="wrap">
    <h2>How ordering works</h2>
    <ol class="steps">
      <li><h3>Choose a design</h3><p>Open the design you like.</p></li>
      <li><h3>Message us</h3><p>Tap the order button. The design name is already in the message.</p></li>
      <li><h3>We confirm</h3><p>We confirm availability, price and the delivery charge with you.</p></li>
      <li><h3>We pack and ship</h3><p>After you confirm, we pack the design and ship it to you.</p></li>
    </ol>
  </div>
</section>
<section>
  <div class="wrap prose">
    <h2>Returns for ready-made items</h2>
    <p class="muted">The return and exchange rule for ready-made items has not been decided yet.</p>
  </div>
</section>`,
  });
}

/* ORDER TRACKING — the old site had a tracking page; saved /track and /track-order links (307 redirects in
   vercel.json) land here instead of on a 404. Tracking now happens on WhatsApp. */
const TRACK_WA = wa(["Hi Drucka! I'd like to know the status of my order.", "Order number: "]);
pages.push({
  path: "/order-tracking",
  file: "order-tracking/index.html",
  noindex: true,
  waLink: TRACK_WA,
  title: "Order Tracking | Drucka",
  description: "Order tracking for Drucka orders is handled on WhatsApp. Send us your order number and we tell you the status of your order.",
  body: `${crumbs("Order tracking")}
<section>
  <div class="wrap prose">
    <div>
      <p class="eyebrow">Order tracking</p>
      <h1>Order tracking has moved</h1>
      <p class="lead">Order tracking is currently handled via WhatsApp. Please contact us with your order number.</p>
      <div class="row">
        ${waBtn(TRACK_WA, "Ask about my order on WhatsApp")}
        <a class="btn btn-outline" href="mailto:${CONTACT.email}">Email us instead</a>
      </div>
    </div>
  </div>
</section>`,
});

/* POLICIES */
for (const p of POLICIES) {
  pages.push({
    path: `/${p.slug}`,
    file: `${p.slug}/index.html`,
    title: p.title,
    description: p.description,
    body: `${crumbs(p.label)}
<section>
  <div class="wrap prose">
    <h1>${esc(p.label)}</h1>
    <p class="lead muted">${esc(p.intro)}</p>
    ${p.sections.map((s) => `<h2>${esc(s.h)}</h2><p>${esc(s.p)}</p>`).join("\n    ")}
  </div>
</section>`,
  });
}

/* ── write dist/ ── */
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, "static"), dist, { recursive: true });
/* a utility class used by the price tables */
const write = (rel, content) => {
  const out = join(dist, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
};
for (const p of pages) write(p.file, layout(p));
write(
  "404.html",
  layout({
    path: "/404",
    title: "Page not found | Drucka",
    description: "This page does not exist. Browse wallpapers, photo décor, photo prints and commercial printing from Drucka.",
    noindex: true,
    body: `<section><div class="wrap prose"><h1>Page not found</h1><p class="lead muted">That page does not exist. Try one of these:</p><div class="row"><a class="btn btn-primary" href="/">Home</a><a class="btn btn-outline" href="/wallpapers">Wallpapers</a><a class="btn btn-outline" href="/photo-decor">Your own photo</a><a class="btn btn-outline" href="/photo-prints">Photo Prints</a><a class="btn btn-outline" href="/commercial">Commercial</a></div></div></section>`,
  })
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter((p) => !p.sample && !p.noindex)
    .map((p) => `  <url><loc>${SITE.url}${p.path === "/" ? "/" : p.path}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
console.log(`built ${pages.length + 1} pages -> dist/`);
console.log("\nLaunch checklist (does not block the build):");
for (const b of LAUNCH_BLOCKERS) console.log(`  [ ] ${b}`);
