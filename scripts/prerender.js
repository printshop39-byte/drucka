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
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'INR',
          price: d.fromPrice,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: 'Drucka' },
        },
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
}

run().catch((e) => {
  console.error('prerender failed:', e);
  process.exit(1);
});
