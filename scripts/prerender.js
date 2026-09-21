/* Post-build prerender for SEO landing routes.
   The app is a client-rendered SPA, so crawlers/social bots that don't run JS
   would otherwise see the homepage <head> for every URL. This bakes a correct
   <title>, meta description, canonical, Open Graph/Twitter tags and Product +
   FAQ JSON-LD into a static dist/<slug>/index.html per landing route. React
   still hydrates the visible content client-side. No headless browser needed. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANDINGS } from '../src/seo/landings.js';
import { POLICIES } from '../src/seo/policies.js';
import { PRINT_VARIANTS } from '../src/components/printSizes.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const ABS = 'https://www.drucka.in';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// escape "<" inside JSON-LD so a value can never break out of the <script> tag
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

function headFor(d) {
  const url = `${ABS}/${d.slug}`;
  const img = ABS + d.image;
  const jsonld = safeJson({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: d.schemaName,
        image: img,
        description: d.description,
        brand: { '@type': 'Brand', name: 'Drucka' },
        ...(d.fromPrice != null && {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'INR',
            price: d.fromPrice,
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: 'Drucka' },
          },
        }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: d.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  });
  return { url, img, jsonld };
}

// Replace a whole tag (single- or multi-line) matched by an anchor attribute.
const replaceTag = (html, anchor, newTag) => {
  const re = new RegExp(`<(meta|link)\\b[^>]*?${anchor}[\\s\\S]*?\\/?>`, 'i');
  return re.test(html) ? html.replace(re, newTag) : html;
};

async function run() {
  const shell = await readFile(resolve(DIST, 'index.html'), 'utf8');

  for (const d of Object.values(LANDINGS)) {
    const { url, img, jsonld } = headFor(d);
    let html = shell;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(d.title)}</title>`);
    html = replaceTag(html, 'name="description"', `<meta name="description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'rel="canonical"', `<link rel="canonical" href="${url}" />`);
    html = replaceTag(html, 'property="og:title"', `<meta property="og:title" content="${esc(d.title)}" />`);
    html = replaceTag(html, 'property="og:description"', `<meta property="og:description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'property="og:url"', `<meta property="og:url" content="${url}" />`);
    html = replaceTag(html, 'property="og:image"', `<meta property="og:image" content="${esc(img)}" />`);
    html = replaceTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${esc(d.title)}" />`);
    html = replaceTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'name="twitter:image"', `<meta name="twitter:image" content="${esc(img)}" />`);

    html = html.replace('</head>', `    <script type="application/ld+json">${jsonld}</script>\n  </head>`);

    await mkdir(resolve(DIST, d.slug), { recursive: true });
    await writeFile(resolve(DIST, d.slug, 'index.html'), html, 'utf8');
    console.log(`prerendered /${d.slug}`);
  }

  /* ── Editor routes (/photo-prints/studio, /mini-prints/studio) ──
     These are app UI, not content: the editor renders its product's landing
     page underneath it, so without a prerender a crawler hitting the studio
     URL is served the HOMEPAGE shell — homepage title, homepage canonical —
     and the landing's own ranking signals get muddied.

     So: real HTML, `noindex, follow` (the page is a tool, not a document),
     and a canonical pointing at the landing that IS the indexable version.
     Deliberately no Product/FAQ JSON-LD — the landing owns that schema and
     duplicating it on a noindex page helps nothing. They stay out of
     sitemap.xml for the same reason. */
  for (const v of Object.values(PRINT_VARIANTS)) {
    const d = LANDINGS[v.route.replace(/^\//, '')];
    if (!d) continue;
    const canonical = `${ABS}${v.route}`;
    const studioUrl = `${ABS}${v.studioRoute}`;
    let html = shell;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(d.title)}</title>`);
    html = replaceTag(html, 'name="description"', `<meta name="description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'name="robots"', '<meta name="robots" content="noindex, follow" />');
    html = replaceTag(html, 'rel="canonical"', `<link rel="canonical" href="${canonical}" />`);
    html = replaceTag(html, 'property="og:title"', `<meta property="og:title" content="${esc(d.title)}" />`);
    html = replaceTag(html, 'property="og:description"', `<meta property="og:description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'property="og:url"', `<meta property="og:url" content="${studioUrl}" />`);
    html = replaceTag(html, 'property="og:image"', `<meta property="og:image" content="${esc(ABS + d.image)}" />`);
    html = replaceTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${esc(d.title)}" />`);
    html = replaceTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'name="twitter:image"', `<meta name="twitter:image" content="${esc(ABS + d.image)}" />`);

    const dir = resolve(DIST, v.studioRoute.replace(/^\//, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'index.html'), html, 'utf8');
    console.log(`prerendered ${v.studioRoute} (noindex → ${v.route})`);
  }

  /* Policy pages. Payment-gateway reviewers and crawlers frequently fetch
     these without running JS, so the copy is baked into the static HTML as
     real <h1>/<h2>/<p> rather than left to client-side hydration. */
  for (const d of Object.values(POLICIES)) {
    const url = `${ABS}/${d.slug}`;
    let html = shell;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(d.title)}</title>`);
    html = replaceTag(html, 'name="description"', `<meta name="description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'rel="canonical"', `<link rel="canonical" href="${url}" />`);
    html = replaceTag(html, 'property="og:title"', `<meta property="og:title" content="${esc(d.title)}" />`);
    html = replaceTag(html, 'property="og:description"', `<meta property="og:description" content="${esc(d.description)}" />`);
    html = replaceTag(html, 'property="og:url"', `<meta property="og:url" content="${url}" />`);
    html = replaceTag(html, 'name="twitter:title"', `<meta name="twitter:title" content="${esc(d.title)}" />`);
    html = replaceTag(html, 'name="twitter:description"', `<meta name="twitter:description" content="${esc(d.description)}" />`);

    const body =
      `<h1>${esc(d.label)}</h1><p>${esc(d.intro)}</p>` +
      d.sections.map((s) => `<h2>${esc(s.h)}</h2><p>${esc(s.p)}</p>`).join('');
    // React replaces #root on hydration, so this is crawler-visible only.
    html = html.replace('<div id="root"></div>', `<div id="root"><article>${body}</article></div>`);

    await mkdir(resolve(DIST, d.slug), { recursive: true });
    await writeFile(resolve(DIST, d.slug, 'index.html'), html, 'utf8');
    console.log(`prerendered /${d.slug} (policy)`);
  }
}

run().catch((e) => {
  console.error('prerender failed:', e);
  process.exit(1);
});
