/* ── The derived product catalogue ──────────────────────────────────────────
   STEP 1 OF THE STRANGLER. This file is READ-ONLY over the existing sources:
   it imports the seven places a product is currently defined, joins them on
   the Drucka product id, and reports where they disagree. It changes no
   behaviour and nothing imports it into a render path yet — that is
   deliberate. The migration goes:

     1. derive + report        ← you are here
     2. resolve the conflicts one product at a time, in the legacy source
     3. move callers onto productById() behind a per-caller flag
     4. delete the legacy sources once nothing reads them

   Same shape as the editor rollout in src/utils/editorFlags.js, for the same
   reason: every step is reversible and no step needs a big-bang deploy.

   WHY THIS EXISTS — as of 2026-09-21 a t-shirt is defined in seven places and
   two of them already disagree about its name ("Premium T-Shirt" on the
   homepage card, "Regular T-Shirt" in the editor and the Qikink map). Adding a
   product means seven edits; forgetting one is how the canvas came to be
   advertised at ₹999 while its real cheapest was ₹500. */

/* explicit .js extensions: this module is imported by scripts/catalog-report.js
   under bare node, which does not resolve extensionless paths */
import { PRODUCTS as LANDING_PRODUCTS } from "./legacy/landingProducts.js";
import { EDITOR_PRODUCTS } from "./legacy/editorProducts.js";
import { QIKINK_PRODUCT_MAP } from "./legacy/qikinkMap.js";
import { CATALOG_CARDS } from "./legacy/catalogCards.js";
import { PRODUCTS as DESIGNER_PRODUCTS } from "../designer/data.js";
import { LANDINGS } from "../seo/landings.js";
import { PRINT_VARIANTS } from "../components/printSizes.js";

/* Which landing slug belongs to which product id. The landings are keyed by
   SEO slug, not by product id, and only this mapping knows the difference. */
const LANDING_SLUG = {
  tshirt: "custom-tshirts",
  mug: "custom-mugs",
  frame: "photo-frames",
  canvas: "canvas-prints",
  poster: "posters",
  "mini-print": "mini-prints",
  "photo-print": "photo-prints",
};

/* A field, the sources that claim to know it, and how to read it from each.
   `weight` decides which source wins when they disagree — highest first — and
   is an assertion about which file is actually maintained, not a preference. */
const FIELDS = {
  name: [
    { src: "designer/data.js", weight: 100, read: (s) => s.designer && s.designer.productName },
    { src: "legacy/qikinkMap", weight: 70, read: (s) => s.qikink && s.qikink.druckaName },
    { src: "legacy/editorProducts", weight: 50, read: (s) => s.editor && s.editor.name },
    { src: "legacy/landingProducts", weight: 40, read: (s) => s.landing && s.landing.name },
    { src: "legacy/catalogCards", weight: 30, read: (s) => s.card && s.card.title },
  ],
  price: [
    /* NOT basePrice — that is the blank before any printing, so comparing it
       against an advertised price reports a conflict that is not one: the tee
       is basePrice 519 + DTG 80 = the 599 every other source states. What the
       other catalogues quote is the CHEAPEST SELLABLE price, so quote that. */
    { src: "designer/data.js", weight: 100, read: (s) => s.designer && cheapestSellable(s.designer) },
    { src: "legacy/qikinkMap", weight: 70, read: (s) => s.qikink && s.qikink.sellingPrice },
    { src: "legacy/editorProducts", weight: 50, read: (s) => s.editor && s.editor.price },
    { src: "legacy/landingProducts", weight: 40, read: (s) => s.landing && s.landing.price },
    { src: "legacy/catalogCards", weight: 30, read: (s) => s.card && s.card.price },
    { src: "seo/landings.js", weight: 20, read: (s) => s.seo && s.seo.fromPrice },
  ],
  image: [
    { src: "legacy/landingProducts", weight: 60, read: (s) => s.landing && s.landing.img },
    { src: "designer/data.js", weight: 50, read: (s) => s.designer && s.designer.image },
    { src: "legacy/catalogCards", weight: 40, read: (s) => s.card && s.card.img },
  ],
};

/* The lowest price a customer can actually pay: the blank, plus the cheapest
   printing method, on the size that carries no surcharge. Mirrors
   designerPrice() in utils/pricing.js for a single printed placement. */
function cheapestSellable(d) {
  if (typeof d.basePrice !== "number") return null;
  const methods = (d.printingOptions || []).map((m) => m.price).filter((n) => typeof n === "number");
  const surcharges = Object.values(d.sizeSurcharge || {}).filter((n) => typeof n === "number");
  const cheapestMethod = methods.length ? Math.min(...methods) : 0;
  /* the base size has no surcharge; only count one if every size carries one */
  const cheapestSize = surcharges.length && surcharges.length === (d.availableSizes || []).length
    ? Math.min(...surcharges) : 0;
  return d.basePrice + cheapestMethod + cheapestSize;
}

/* Every product id any source knows about. */
function allIds() {
  const ids = new Set();
  DESIGNER_PRODUCTS.forEach((p) => ids.add(p.productId));
  LANDING_PRODUCTS.forEach((p) => ids.add(p.id));
  EDITOR_PRODUCTS.forEach((p) => ids.add(p.id));
  QIKINK_PRODUCT_MAP.forEach((p) => ids.add(p.druckaId));
  CATALOG_CARDS.forEach((p) => ids.add(p.productId));
  Object.values(PRINT_VARIANTS).forEach((v) => ids.add(v.productId));
  return [...ids].sort();
}

function sourcesFor(id) {
  return {
    designer: DESIGNER_PRODUCTS.find((p) => p.productId === id) || null,
    landing: LANDING_PRODUCTS.find((p) => p.id === id) || null,
    editor: EDITOR_PRODUCTS.find((p) => p.id === id) || null,
    qikink: QIKINK_PRODUCT_MAP.find((p) => p.druckaId === id) || null,
    card: CATALOG_CARDS.find((p) => p.productId === id) || null,
    seo: LANDINGS[LANDING_SLUG[id]] || null,
    print: Object.values(PRINT_VARIANTS).find((v) => v.productId === id) || null,
  };
}

/* Resolve one field: the highest-weighted source that actually has a value
   wins, and every other answer is recorded so the disagreement is visible
   rather than silently overwritten. */
function resolve(field, sources) {
  const claims = [];
  FIELDS[field].forEach((c) => {
    const v = c.read(sources);
    if (v !== undefined && v !== null && v !== "") claims.push({ src: c.src, value: v, weight: c.weight });
  });
  if (!claims.length) return { value: null, from: null, claims: [], agreed: true };
  claims.sort((a, b) => b.weight - a.weight);
  const winner = claims[0];
  const agreed = claims.every((c) => String(c.value) === String(winner.value));
  return { value: winner.value, from: winner.src, claims: claims, agreed: agreed };
}

/* One product, joined across every source. */
export function productById(id) {
  const s = sourcesFor(id);
  if (!Object.values(s).some(Boolean)) return null;

  const fields = {};
  Object.keys(FIELDS).forEach((f) => { fields[f] = resolve(f, s); });

  return {
    id: id,
    name: fields.name.value,
    price: fields.price.value,
    image: fields.image.value,
    landingSlug: LANDING_SLUG[id] || null,
    /* a flat print is made in Kolhapur; everything else is a Qikink SKU */
    fulfilment: s.print ? "in-house" : (s.qikink ? "qikink" : "unknown"),
    qikink: s.qikink
      ? {
        productId: s.qikink.qikinkProductId,
        skuPattern: s.qikink.skuPattern,
        printMethod: s.qikink.printMethod,
        baseCost: s.qikink.baseCost,
        active: s.qikink.active,
      }
      : null,
    definedIn: Object.keys(s).filter((k) => s[k]),
    fields: fields,
  };
}

export function allProducts() {
  return allIds().map(productById).filter(Boolean);
}

/* ── The point of step 1 ──
   Every field where the sources disagree, worst first. Feed this to a script
   or a dev-only panel; resolve them in the LEGACY sources, not here. */
export function conflicts() {
  const out = [];
  allProducts().forEach((p) => {
    Object.keys(p.fields).forEach((f) => {
      const r = p.fields[f];
      if (r.agreed || r.claims.length < 2) return;
      out.push({
        id: p.id,
        field: f,
        winner: { value: r.value, from: r.from },
        others: r.claims.slice(1).filter((c) => String(c.value) !== String(r.value)),
      });
    });
  });
  /* the more sources disagree, the more likely a customer sees two numbers */
  return out.sort((a, b) => b.others.length - a.others.length);
}

/* Products a source knows about that the others do not — the other way a
   catalogue drifts: something added in one place and nowhere else. */
export function orphans() {
  return allProducts()
    .filter((p) => p.definedIn.length === 1)
    .map((p) => ({ id: p.id, only: p.definedIn[0] }));
}
