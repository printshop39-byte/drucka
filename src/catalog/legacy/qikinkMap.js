/* ── QIKINK_PRODUCT_MAP ── (moved verbatim out of App.jsx, 2026-09-21)
   Drucka product id -> Qikink SKU, colours, sizes, base cost, selling price.

   Extracted UNCHANGED so the derived catalogue in ../productCatalog.js can
   read it. Nothing here is the source of truth yet — see that file for which
   fields currently disagree between the legacy catalogues. */

/* Drucka product → Qikink product/SKU mapping.
   Colours and sizes below are the ones the sku_descriptions export actually
   carries for that stem, intersected with what Drucka sells — validateQikink-
   Order rejects anything outside them, so an order can no longer be sent with
   a SKU Qikink has never heard of.
   Confirm product IDs + SKU patterns in your Qikink dashboard:
https://creator.qikink.com/dashboard → Products */

/* KIDS_SIZES came from App.jsx's own import when this array lived there;
   the move left the reference behind. Vite bundled it happily because it
   never evaluates a module body at build time — it would have thrown on
   first render in the browser. */
import { KIDS_SIZES } from "../../../api/_lib/qikinkCatalog.js";

export const QIKINK_PRODUCT_MAP = [
  /* MRnHs — export calls it "Classic Crew T-Shirt" and carries 34 colours and
     XS–7XL. Listed here: every colour Drucka sells (all ten exist on this
     stem) and every size Drucka sells.
     sizesByColor: Qikink stops Yellow, Lavender and Baby Pink at 4XL while the
     other seven run to 7XL. Two independent lists cannot say that, and the
     nine missing combinations are real — MRnHs-Yl-7XL does not exist. */
  { druckaId: "tshirt",      druckaName: "Regular T-Shirt",   qikinkProduct: "Classic Crew T-Shirt", qikinkProductId: "MRNHS-180", skuPattern: "MRnHs-{color}-{size}", printMethod: "DTG",         colors: ["white", "black", "navy", "red", "royal-blue", "bottle-green", "maroon", "yellow", "lavender", "baby-pink"], sizes: ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL"], baseCostBySize: { S: 359, M: 359, L: 359, XL: 359, XXL: 359, "3XL": 379, "4XL": 399, "5XL": 419, "6XL": 439, "7XL": 459 }, sizesByColor: { yellow: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"], lavender: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"], "baby-pink": ["S", "M", "L", "XL", "XXL", "3XL", "4XL"] }, baseCost: 359, sellingPrice: 599, printAreas: ["Front", "Back", "Left chest"], active: true },
  { druckaId: "oversized",   druckaName: "Oversized T-Shirt", qikinkProduct: "Oversized Classic T-Shirt | UC22", qikinkProductId: "UC22",  skuPattern: "UOsMRnHs-{color}-{size}", printMethod: "DTF",     colors: ["white", "black", "navy"],                  sizes: ["S", "M", "L", "XL", "XXL"],              baseCost: 419, sellingPrice: 699, printAreas: ["Front", "Back"],                        active: true },
  { druckaId: "polo",        druckaName: "Polo T-Shirt",      qikinkProduct: "Polo | MP25",                qikinkProductId: "MP25",      skuPattern: "MPHs-{color}-{size}",  printMethod: "Embroidery",  colors: ["white", "black", "navy"],                  sizes: ["S", "M", "L", "XL", "XXL"],              baseCost: 449, sellingPrice: 799, printAreas: ["Left chest"],                           active: false /* add to Drucka catalogue first */ },
  /* BRnHs — Boy Classic Crew, 25 colours, infants in months and children in
     years to 13. The catalogue used to sell 2Y–14Y, not one of which Qikink
     issues, so every kids order was unfulfillable and this sat inactive.
     Sizes now come from KIDS_SIZE_TOKEN, which also holds the label ⇆ token
     mapping ("5Y" → "5Yrs", "0–12M" → "0_12").
     Colour note: this stem has NO plain Yellow — only New / Golden / Mustard.
     STEM_COLOR_CODE maps yellow → NYl for it.

     baseCost = the export's garment price PLUS the print charge, which is how
     every other apparel row here is built: the export lists the blank only,
     and the adult rows came from a quote that already included printing
     (MRnHs-Wh-S is ₹190 in the export against ₹359 here — ₹169 of DTG). The
     same ₹169 DTG / ₹155 DTF is carried below.
     Confirmed with Qikink 2026-07-26: a kids blank is ₹105–120 and the print
     ₹50–80, i.e. ₹155–170 landed before GST and shipping, which is where
     these figures sit. */
  { druckaId: "kids-tshirt", druckaName: "Kids T-Shirt",      qikinkProduct: "Classic Crew (Boy) | RnHs",  qikinkProductId: "US21",      skuPattern: "BRnHs-{color}-{size}", printMethod: "DTG",         colors: ["white", "yellow", "baby-pink", "royal-blue", "red"], sizes: KIDS_SIZES, baseCostBySize: { "0–12M": 299, "12–23M": 299, "24–35M": 299, "36–47M": 299, "5Y": 329, "7Y": 329, "9Y": 329, "11Y": 329, "13Y": 329 }, baseCost: 329, sellingPrice: 459, printAreas: ["Front", "Back"], active: true },

  /* KHd — kids hoodie, same size list as the tee. Made in Black, Grey
     Melange, Red, Yellow and Baby Pink ONLY; White and Navy were on sale in
     the catalogue and have been withdrawn. Baby pink is BPk here and LBp on
     the tee stem, which is why colour codes are resolved per stem.
     baseCost = export garment (₹290 / ₹340) + ₹155 DTF, as above. */
  { druckaId: "kids-hoodie", druckaName: "Kids Hoodie",       qikinkProduct: "Hoodie (Kids)",              qikinkProductId: "KHd",       skuPattern: "KHd-{color}-{size}",   printMethod: "DTF",         colors: ["black", "red", "yellow", "baby-pink"], sizes: KIDS_SIZES, baseCostBySize: { "0–12M": 445, "12–23M": 445, "24–35M": 445, "36–47M": 445, "5Y": 495, "7Y": 495, "9Y": 495, "11Y": 495, "13Y": 495 }, baseCost: 495, sellingPrice: 699, printAreas: ["Front", "Back"], active: true },
  /* UHd — 15 colours, XS–3XL in the export. Drucka's five all exist on it.
     Note: this stem has no plain Yellow (only Mustard), so do not add yellow
     to the hoodie without checking the export again. */
  { druckaId: "hoodie",      druckaName: "Hoodie",            qikinkProduct: "Hoodie",                     qikinkProductId: "UH24",      skuPattern: "UHd-{color}-{size}",   printMethod: "DTF",         colors: ["white", "black", "navy", "maroon", "bottle-green"], sizes: ["S", "M", "L", "XL", "XXL", "3XL"], baseCostBySize: { S: 649, M: 649, L: 649, XL: 649, XXL: 649, "3XL": 689 }, baseCost: 649, sellingPrice: 999, printAreas: ["Front", "Back"],                        active: true },
  { druckaId: "mug",         druckaName: "Photo Mug",         qikinkProduct: "White Coffee Mug",           qikinkProductId: "UWCM",      skuPattern: "UWCM-{color}-11 OZ",   printMethod: "Sublimation", colors: ["white"],                                   sizes: ["325 ml"],                                 baseCost: 179, sellingPrice: 299, printAreas: ["Wrap"],                                 active: true },

  /* ── Gift products ──
     These were unmapped, so a frame or poster order built a line item reading
     "UNMAPPED-frame". All five stems exist in the sku_descriptions export.

     Qikink's size tokens are not a pattern — "A4 Frame poster", "12x18Fpos",
     "24x36 pos" and "8X12" all appear, and "A3" means a different token on a
     framed poster than on a plain one. They live in qikinkCatalog's
     SKU_SIZE_TOKEN, keyed by SKU stem, so both order paths spell them alike.

     baseCost excludes shipping everywhere — the Admin margin subtracts
     shippingCost separately and says "after ship". For these three it is
     Qikink's listed item price ONLY: the print charge is not in the
     sku_descriptions export, so they are a floor, whereas the apparel figures
     above came from a quote that already included printing. */

  /* UFPos in Wh/Bk/Yl/Gn/Rb/OG; Drucka's black and white both exist. */
  { druckaId: "frame",       druckaName: "Framed Print",      qikinkProduct: "Framed Poster",              qikinkProductId: "UFPos",     skuPattern: "UFPos-{color}-{size}", printMethod: "Sublimation", colors: ["black", "white"], sizes: ["A4", "A3"], baseCostBySize: { A4: 250, A3: 350 }, baseCost: 350, sellingPrice: 899, printAreas: ["Front"], active: true },

  /* UPoster is white only. A2 is not made by Qikink at all — see the poster's
     availableSizes in data.js, where it has been withdrawn. */
  { druckaId: "poster",      druckaName: "Poster Print",      qikinkProduct: "Poster",                     qikinkProductId: "UPoster",   skuPattern: "UPoster-{color}-{size}", printMethod: "Sublimation", colors: ["white"], sizes: ["A3", '12×18"', '24×36"'], baseCostBySize: { A3: 50, '12×18"': 80, '24×36"': 250 }, baseCost: 80, sellingPrice: 199, printAreas: ["Front"], active: true },

  /* Catalogue now carries Qikink's four canvas sizes (see data.js). Note the
     tokens: 8x8 is lower-case, the other three are 8X12 / 16X20 / 20X30. */
  { druckaId: "canvas",      druckaName: "Stretched Canvas",  qikinkProduct: "Canvas",                     qikinkProductId: "UCanvas",   skuPattern: "UCanvas-{color}-{size}", printMethod: "Sublimation", colors: ["white"], sizes: ['8×8"', '8×12"', '16×20"', '20×30"'], baseCostBySize: { '8×8"': 250, '8×12"': 300, '16×20"': 550, '20×30"': 800 }, baseCost: 300, sellingPrice: 600, printAreas: ["Front"], active: true },

  /* Qikink die-cuts stickers by the inch and makes no A5/A4 sheets. The
     catalogue sold sheets, which is why this was off; it now sells the five
     die-cut sizes below and the mapping is live. Tax is 18% here, not the
     12% the catalogue used to apply. */
  { druckaId: "stickers",    druckaName: "Custom Stickers",   qikinkProduct: "Stickers",                   qikinkProductId: "UStickers", skuPattern: "UStickers-{color}-{size}", printMethod: "Sublimation", colors: ["white"], sizes: ['2×2"', '3×3"', '4×4"', '6×6"', '8×8"'], baseCostBySize: { '2×2"': 25, '3×3"': 30, '4×4"': 40, '6×6"': 55, '8×8"': 85 }, baseCost: 25, sellingPrice: 149, printAreas: ["Front"], active: true },

  /* UAopCuCvr — the only cushion Qikink prints, White only, 16x16 and 24x24.
     Drucka sold 16″ and 18″; 18″ does not exist and has been withdrawn.
     All-over print, so print_type_id is 2 rather than DTG's 1. */
  { druckaId: "cushion",     druckaName: "Photo Cushion",     qikinkProduct: "AOP Cushion Cover",          qikinkProductId: "UAopCuCvr", skuPattern: "UAopCuCvr-{color}-{size}", printMethod: "All over", colors: ["white"], sizes: ['16"'], baseCostBySize: { '16"': 140 }, baseCost: 140, sellingPrice: 649, printAreas: ["Front"], active: true },

  /* UGrtCr — Qikink's Greeting Card, A5, the only card it makes. The printed
     invitation maps to it; the digital invitation does not map to anything,
     because it is a file Drucka sends on WhatsApp. inHouseSizes keeps it out
     of the Qikink path with an honest reason instead of a missing-SKU error.
     Tax is 18% on this stem, not the 12% the catalogue used to apply. */
  { druckaId: "invitation-cards", druckaName: "Invitation Cards", qikinkProduct: "Greeting Cards",        qikinkProductId: "UGrtCr",    skuPattern: "UGrtCr-{color}-{size}", printMethod: "Sublimation", colors: ["white"], sizes: ["A5 Print"], inHouseSizes: ["Digital"], baseCostBySize: { "A5 Print": 30 }, baseCost: 30, sellingPrice: 249, printAreas: ["Front"], active: true },

  /* "Standard" is the square shape, per Drucka. Qikink also makes Rect and
     Slim at the same ₹60 if another shape is ever added to the catalogue. */
  { druckaId: "keychain",    druckaName: "Acrylic Keychain",  qikinkProduct: "Keychain",                   qikinkProductId: "UAcryKyChnUV", skuPattern: "UAcryKyChnUV-{color}-{size}", printMethod: "Sublimation", colors: ["white"], sizes: ["Standard"], baseCost: 60, baseCostBySize: { Standard: 60 }, sellingPrice: 149, printAreas: ["Front"], active: true },
];
