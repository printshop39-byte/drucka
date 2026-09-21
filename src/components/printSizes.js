/* ── Print-size catalogue — the one source of truth for both print families ──

   Drucka sells two DIFFERENT flat-print products out of the same editor, and
   conflating them is what produced the "From ₹190 vs ₹19 per print" mess the
   2026-09 audit flagged:

     MINI  — small novelty prints (wallet / Instagram / scrapbook). Cheap per
             piece, so they only make sense as a pack: MINIMUM 10 PER ORDER.
     PHOTO — regular photo prints, 4×6 upward. Sold singly, no minimum.

   Keeping the two catalogues apart here means the landing pages, the editor,
   the cart lines and the WhatsApp message can never disagree again. Collage
   pricing lives in src/collage/collageData.js and is deliberately NOT reused:
   a collage is a composed multi-photo print, priced for the layout work. */

/* ── MINI ──
   `aspect` is stated explicitly rather than derived from `inches`, because
   these three shipped with a fixed orientation (2×3 portrait, 4×3 landscape)
   and existing previews/print files must keep rendering identically. */
export const MINI_SIZES = [
  { id: "2x3", label: '2×3"', name: "Wallet & Gift Inserts",     price: 19, inches: [2, 3], aspect: 2 / 3 },
  { id: "3x3", label: '3×3"', name: "Instagram Square Prints",   price: 25, inches: [3, 3], aspect: 1 },
  { id: "4x3", label: '4×3"', name: "Memory & Scrapbook Prints", price: 29, inches: [3, 4], aspect: 4 / 3 },
];

/* ── PHOTO ──
   `inches` is [short edge, long edge]; `aspect` is the PORTRAIT aspect and the
   editor flips it per photo (see orientFor). Prices confirmed by Drucka,
   2026-09-21 — a ladder of its own, not the collage table. */
export const PHOTO_SIZES = [
  { id: "4x6",   label: '4×6"',   name: "Classic Photo Print",  price: 39,  inches: [4, 6] },
  { id: "5x7",   label: '5×7"',   name: "Desk & Gift Print",    price: 59,  inches: [5, 7] },
  { id: "6x8",   label: '6×8"',   name: "Large Memory Print",   price: 89,  inches: [6, 8] },
  { id: "8x10",  label: '8×10"',  name: "Portrait & Framing",   price: 129, inches: [8, 10] },
  { id: "a4",    label: "A4",     name: '8.3 × 11.7" Poster',   price: 149, inches: [8.27, 11.69] },
  { id: "a3",    label: "A3",     name: '11.7 × 16.5" Poster',  price: 299, inches: [11.69, 16.54] },
  { id: "12x18", label: '12×18"', name: "Panoramic Wall Print", price: 399, inches: [12, 18] },
].map((s) => ({ ...s, aspect: s.inches[0] / s.inches[1] }));

export const ALL_PRINT_SIZES = [...MINI_SIZES, ...PHOTO_SIZES];

/* width / height per size id — consumed by miniCard's renderer */
export const PRINT_SIZE_ASPECT = Object.fromEntries(
  ALL_PRINT_SIZES.map((s) => [s.id, s.aspect]),
);

/* ── the two editor variants ──
   MiniPrints.jsx is one component driven by this record, so "Photo Prints
   opens the Mini Prints editor" (audit P0) cannot recur: the route picks the
   variant and the variant picks everything else. */
export const PRINT_VARIANTS = {
  mini: {
    id: "mini",
    sizes: MINI_SIZES,
    /* 2×3 is the ₹19 the whole site advertises; opening on 3×3 meant the
       first number a visitor saw (₹25 · ₹250) never matched the ad */
    defaultSizeId: "2x3",
    /* Confirmed by Drucka, 2026-09-21: minimum is 10 prints PER ORDER, across
       whatever mix of mini sizes the customer chooses — not 10 per size. */
    minPrints: 10,
    quickPacks: [10, 20, 30, 50],
    autoOrient: false,
    showTemplates: true,
    productId: "mini-print",
    cartPrefix: "Mini Print",
    route: "/mini-prints",        // the indexable landing page
    studioRoute: "/mini-prints/studio", // the editor itself
    docTitle: "Mini Photo Prints Online — 2×3, 3×3, 4×3 inch | Drucka",
    ariaLabel: "Mini photo prints",
    eyebrow: "Mini Photo Prints",
    waHeading: "*DRUCKA Mini Prints Order*",
    unitNoun: "mini prints",
    minNoticeEn: "Mini Prints need a minimum of 10 prints per order. Regular Photo Prints are available from a single piece.",
    minNoticeMr: "Mini Prints साठी किमान 10 prints आवश्यक आहेत. Regular Photo Prints मात्र single piece पासून उपलब्ध आहेत.",
  },
  photo: {
    id: "photo",
    sizes: PHOTO_SIZES,
    defaultSizeId: "4x6",
    minPrints: 1,
    quickPacks: null,
    /* a 4×6 is portrait on paper; forcing a landscape holiday photo into it
       crops half the frame away, so the card flips to 6×4 automatically */
    autoOrient: true,
    showTemplates: false,
    productId: "photo-print",
    cartPrefix: "Photo Print",
    route: "/photo-prints",
    studioRoute: "/photo-prints/studio",
    docTitle: "Photo Prints Online — 4×6, 5×7, 8×10, A4, A3 | Drucka",
    ariaLabel: "Photo prints",
    eyebrow: "Photo Prints",
    waHeading: "*DRUCKA Photo Prints Order*",
    unitNoun: "photo prints",
    minNoticeEn: "",
    minNoticeMr: "",
  },
};

export const variantOf = (id) => PRINT_VARIANTS[id] ?? PRINT_VARIANTS.mini;
export const sizeIn = (variant, id) =>
  variant.sizes.find((s) => s.id === id) ?? variant.sizes.find((s) => s.id === variant.defaultSizeId) ?? variant.sizes[0];

/* ── orientation ──
   "auto" reads the uploaded photo's own shape; the customer can still force
   one. Returns the aspect (width / height) the card should actually print at. */
export const aspectFor = (size, orient = "auto", photoAspect = null) => {
  const portrait = size.aspect;
  if (portrait === 1) return 1;                       // square size, nothing to flip
  const landscape = 1 / portrait;
  if (orient === "p") return portrait;
  if (orient === "l") return landscape;
  if (!photoAspect) return portrait;
  return photoAspect >= 1 ? landscape : portrait;
};

/* ── print-quality guard ──
   Effective DPI once the upload is stretched to the chosen paper size. Below
   MIN_DPI the print visibly softens, so the editor warns before the customer
   pays for it. `px` is the ORIGINAL pixel size captured at upload. */
export const MIN_DPI = 150;
export const GOOD_DPI = 250;

export const dpiFor = (px, size, aspect) => {
  if (!px?.w || !px?.h || !size?.inches) return null;
  const [shortIn, longIn] = size.inches;
  /* aspect > 1 means the card prints landscape, so the long edge is the width */
  const [printW, printH] = aspect >= 1 ? [longIn, shortIn] : [shortIn, longIn];
  /* the photo is cover-cropped into the card, so the binding constraint is
     whichever axis has to stretch furthest */
  return Math.floor(Math.min(px.w / printW, px.h / printH));
};

export const qualityOf = (dpi) => {
  if (dpi == null) return null;
  if (dpi >= GOOD_DPI) return { level: "good", label: "Print quality: excellent" };
  if (dpi >= MIN_DPI) return { level: "ok", label: "Print quality: good" };
  return { level: "low", label: "Low resolution for this size" };
};
