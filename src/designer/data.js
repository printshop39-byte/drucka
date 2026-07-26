/* ── Drucka product designer — catalog + pricing ──
   ONE data-driven catalog powers the single designer for every category
   (men / women / kids / children / gifts). Add a product here and the
   designer, product page, mockup view and submit page all pick it up.
   Cart items carry `qikinkId` so the existing checkout → Qikink product
   mapping keeps working unchanged. */

import { prepareUpload, MAX_UPLOAD_BYTES } from "../utils/validateUpload";
import { calculate } from "../utils/pricing";

export const uid = () => Math.random().toString(36).slice(2, 9);

export const inr = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ── shared color palette (products list the ids they come in) ── */
export const COLOR_PALETTE = [
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "black", label: "Black", hex: "#1f1f1f" },
  { id: "navy", label: "Navy Blue", hex: "#22304f" },
  { id: "red", label: "Red", hex: "#c0272d" },
  { id: "royal-blue", label: "Royal Blue", hex: "#2b50c8" },
  { id: "bottle-green", label: "Bottle Green", hex: "#1d4a38" },
  { id: "maroon", label: "Maroon", hex: "#6e1423" },
  { id: "yellow", label: "Yellow", hex: "#f2c230" },
  { id: "lavender", label: "Lavender", hex: "#b9a7e0" },
  { id: "baby-pink", label: "Baby Pink", hex: "#f1b8c4" },
];
export const colorById = (id) => COLOR_PALETTE.find((c) => c.id === id);
export const LIGHT_COLORS = ["white", "yellow", "lavender", "baby-pink"];

/* ── printing options ── */
export const PRINT_METHODS = [
  { id: "dtg", label: "DTG", full: "Direct to Garment", price: 80, note: "Best for photos & full-colour art" },
  { id: "dtf", label: "DTF", full: "Direct to Film", price: 93.5, note: "Vivid colours, very durable" },
  { id: "embroidery", label: "Embroidery", full: "Embroidery", price: 150, note: "Premium stitched finish" },
];
const FULL_COLOUR = [{ id: "print", label: "Full Colour", full: "Sublimation print", price: 0, note: "Edge-to-edge photo print" }];

/* big-size surcharge (₹) — adult apparel, 3XL and above */
const ADULT_SURCHARGE = { "3XL": 50, "4XL": 75, "5XL": 100, "6XL": 125, "7XL": 150 };
const ADULT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL"];

export const SIZE_CHART = [
  { size: "S", chest: 38, length: 26 }, { size: "M", chest: 40, length: 27 },
  { size: "L", chest: 42, length: 28 }, { size: "XL", chest: 44, length: 29 },
  { size: "XXL", chest: 46, length: 30 }, { size: "3XL", chest: 48, length: 31 },
  { size: "4XL", chest: 50, length: 32 }, { size: "5XL", chest: 52, length: 33 },
  { size: "6XL", chest: 54, length: 34 }, { size: "7XL", chest: 56, length: 35 },
];
export const KIDS_SIZE_CHART = [
  { size: "2Y", chest: 22, length: 15 }, { size: "4Y", chest: 24, length: 17 },
  { size: "6Y", chest: 26, length: 19 }, { size: "8Y", chest: 28, length: 21 },
  { size: "10Y", chest: 30, length: 23 }, { size: "12Y", chest: 32, length: 24 },
  { size: "14Y", chest: 34, length: 25 },
];

/* ── print placement helpers ──
   Each placement: { id, label, photo (mockup key), area (% box on the
   42:50 mockup canvas), inches (max physical print size), small (cheaper
   add-on placement) }. */
const TEE_PLACEMENTS = [
  { id: "front", label: "Front", photo: "front", area: { left: 34, top: 31, width: 32, height: 36 }, inches: { w: 12, h: 16 } },
  { id: "back", label: "Back", photo: "back", area: { left: 34, top: 30, width: 32, height: 37 }, inches: { w: 12, h: 16 } },
  { id: "left-pocket", label: "Left Pocket", photo: "front", area: { left: 53, top: 33.5, width: 10, height: 10 }, inches: { w: 4, h: 4 }, small: true },
  { id: "right-pocket", label: "Right Pocket", photo: "front", area: { left: 37, top: 33.5, width: 10, height: 10 }, inches: { w: 4, h: 4 }, small: true },
];
const FRONT_BACK = (front, back, inches = { w: 10, h: 13 }) => [
  { id: "front", label: "Front", photo: "front", area: front, inches },
  { id: "back", label: "Back", photo: "back", area: back, inches },
];
const SINGLE = (area, inches, label = "Front") => [
  { id: "front", label, photo: "front", area, inches },
];

/* ── categories ── */
export const CATEGORIES = [
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "kids", label: "Kids" },
  { id: "children", label: "Children" },
  { id: "gifts", label: "Gifts & More" },
];

/* ── PRODUCT CATALOG ──
   mockups: { base, ext, colors } → /mockups/{base}-{photo}-{color}.{ext}
   (color falls back to white when no photo exists for it).
   image: single static photo for one-view products.
   Neither → the canvas shows a neutral placeholder, designer still works. */
export const PRODUCTS = [
  {
    productId: "tshirt", qikinkId: "tshirt", category: "men",
    productName: "Male Classic Crew T-Shirt",
    catalog: { order: 1, title: "Premium T-Shirt", price: 599, img: "/designs/catalog-1-800.webp" },
    editor: { shell: true, family: "designer" },
    basePrice: 349, taxRate: 5,
    availableColors: ["white", "black", "navy", "red", "royal-blue", "bottle-green", "maroon", "yellow", "lavender", "baby-pink"],
    availableSizes: ADULT_SIZES, sizeSurcharge: ADULT_SURCHARGE, sizeChart: SIZE_CHART,
    /* Qikink stocks Yellow, Lavender and Baby Pink only to 4XL — the other
       seven colours run to 7XL. Offering the nine missing combinations meant
       a customer could pay for a tee that cannot be made. */
    sizesByColor: {
      yellow: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
      lavender: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
      "baby-pink": ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
    },
    printingOptions: PRINT_METHODS,
    mockups: { base: "tshirt", ext: "webp", colors: ["white", "black", "navy"] },
    gallery: [
      { src: "/mockups/tshirt-male-front-white.jpg", label: "Model front" },
      { src: "/mockups/tshirt-male-back-white.jpg", label: "Model back" },
      { src: "/mockups/tshirt-front-white.jpg", label: "Flat front" },
      { src: "/mockups/tshirt-back-white.jpg", label: "Flat back" },
    ],
    printAreas: TEE_PLACEMENTS,
    productHighlights: ["180 GSM", "100% Cotton", "Super Combed", "Pre Shrunk", "Bio Washed", "Lycra Ribbed Neck"],
    description: "Classic-fit crew neck tee in 180 GSM super-combed cotton. Bio-washed for softness, pre-shrunk so the fit survives the wash, with a Lycra-ribbed neck that keeps its shape. Printed on demand in India and delivered in 2–4 days.",
  },
  {
    productId: "tshirt-women", qikinkId: "tshirt", category: "women",
    productName: "Women Classic Crew T-Shirt",
    basePrice: 349, taxRate: 5,
    availableColors: ["white", "black", "lavender", "baby-pink", "maroon", "yellow", "bottle-green"],
    availableSizes: ADULT_SIZES, sizeSurcharge: ADULT_SURCHARGE, sizeChart: SIZE_CHART,
    printingOptions: PRINT_METHODS,
    mockups: { base: "tshirt-female", ext: "webp", colors: ["white"] },
    gallery: [
      { src: "/images/categories/women-tshirt.webp", label: "On model" },
      { src: "/mockups/tshirt-female-front-white.jpg", label: "Front" },
      { src: "/mockups/tshirt-female-back-white.jpg", label: "Back" },
      { src: "/images/categories/women-crop-top.webp", label: "Crop top style" },
    ],
    printAreas: FRONT_BACK({ left: 39, top: 33, width: 22, height: 27 }, { left: 39, top: 32, width: 22, height: 28 }, { w: 11, h: 14 }),
    productHighlights: ["180 GSM", "100% Cotton", "Feminine Fit", "Pre Shrunk", "Bio Washed"],
    description: "Soft-touch women's crew tee with a relaxed feminine fit. 180 GSM combed cotton, bio-washed, printed on demand in India.",
  },
  {
    productId: "kids-tshirt", qikinkId: "kids-tshirt", category: "kids",
    productName: "Kids Classic T-Shirt",
    basePrice: 299, taxRate: 5,
    availableColors: ["white", "yellow", "baby-pink", "royal-blue", "red"],
    availableSizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], sizeSurcharge: {}, sizeChart: KIDS_SIZE_CHART,
    printingOptions: PRINT_METHODS,
    mockups: { base: "kids-tshirt", ext: "webp", colors: ["white"] },
    gallery: [
      { src: "/images/categories/kids-tshirt.webp", label: "On model" },
      { src: "/mockups/kids-tshirt-front-white.png", label: "Front" },
      { src: "/mockups/kids-tshirt-back-white.png", label: "Back" },
      { src: "/images/categories/girls-tshirt.webp", label: "Girls fit" },
      { src: "/images/categories/kids-tshirt-full.webp", label: "Full look" },
    ],
    printAreas: FRONT_BACK({ left: 31, top: 26, width: 38, height: 42 }, { left: 31, top: 26, width: 38, height: 42 }, { w: 9, h: 11 }),
    productHighlights: ["160 GSM", "100% Cotton", "Skin Friendly", "Bio Washed", "Easy Wash"],
    description: "Soft, skin-friendly cotton tee for kids 2–14 years. Holds colour and shape through school-day adventures and endless washes.",
  },
  {
    productId: "tshirt-children", qikinkId: "kids-tshirt", category: "children",
    productName: "Children Round Neck Tee (2–8Y)",
    basePrice: 279, taxRate: 5,
    availableColors: ["white", "yellow", "baby-pink", "red"],
    availableSizes: ["2Y", "4Y", "6Y", "8Y"], sizeSurcharge: {}, sizeChart: KIDS_SIZE_CHART.slice(0, 4),
    printingOptions: PRINT_METHODS,
    mockups: { base: "kids-tshirt", ext: "webp", colors: ["white"] },
    gallery: [
      { src: "/mockups/kids-tshirt-front-white.png", label: "Front" },
      { src: "/mockups/kids-model-front-white.png", label: "On model" },
    ],
    printAreas: FRONT_BACK({ left: 31, top: 26, width: 38, height: 42 }, { left: 31, top: 26, width: 38, height: 42 }, { w: 8, h: 10 }),
    productHighlights: ["160 GSM", "100% Cotton", "Toddler Safe", "Tagless Comfort"],
    description: "Extra-soft round neck tee sized for the littlest ones (2–8 years). Tagless, breathable and made for daily play.",
  },
  {
    productId: "hoodie", qikinkId: "hoodie", category: "men",
    productName: "Classic Hoodie",
    basePrice: 749, taxRate: 5,
    availableColors: ["black", "navy", "maroon", "bottle-green", "white"],
    availableSizes: ["S", "M", "L", "XL", "XXL", "3XL"], sizeSurcharge: { "3XL": 50 }, sizeChart: SIZE_CHART.slice(0, 6),
    printingOptions: PRINT_METHODS,
    /* photo gallery from the mix-11 shoot; canvas mockups still pending */
    gallery: [
      { src: "/images/categories/hoodie-2.webp", label: "Front" },
      { src: "/images/categories/hoodie-1.webp", label: "Classic fit" },
      { src: "/images/categories/hoodie-oversized.webp", label: "Oversized fit" },
    ],
    printAreas: FRONT_BACK({ left: 33, top: 30, width: 34, height: 27 }, { left: 33, top: 28, width: 34, height: 32 }, { w: 11, h: 12 }),
    productHighlights: ["320 GSM", "Cotton Fleece", "Kangaroo Pocket", "Drawstring Hood"],
    description: "Heavyweight 320 GSM fleece hoodie with kangaroo pocket. Printed front or back on demand.",
  },
  {
    productId: "kids-hoodie", qikinkId: "kids-hoodie", category: "kids",
    productName: "Kids Hoodie",
    basePrice: 649, taxRate: 5,
    availableColors: ["white", "navy", "red", "yellow"],
    availableSizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], sizeSurcharge: {}, sizeChart: KIDS_SIZE_CHART,
    printingOptions: PRINT_METHODS,
    gallery: [{ src: "/images/categories/kids-jacket.webp", label: "On model" }],
    printAreas: FRONT_BACK({ left: 33, top: 30, width: 34, height: 26 }, { left: 33, top: 28, width: 34, height: 30 }, { w: 8, h: 9 }),
    productHighlights: ["280 GSM", "Cozy Fleece", "Skin Friendly"],
    description: "Cozy fleece hoodie for kids — warm, soft and ready for their favourite design.",
  },
  {
    productId: "mug", qikinkId: "mug", category: "gifts",
    productName: "Photo Mug",
    caps: { printAreaShape: "curved", maxUploadBytes: 10 * 1024 * 1024 }, // 10 MB
    catalog: { order: 2, title: "Photo Mug", price: 299, img: "/designs/catalog-2-800.webp" },
    editor: { shell: true, family: "designer" },
    basePrice: 299, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["325 ml"], sizeSurcharge: {}, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "mug", ext: "webp", colors: ["white"] },
    image: "/images/mug.webp",
    gallery: [{ src: "/images/mug.webp", label: "Mug" }],
    /* 8.5″ × 3.5″ is the standard 11oz wrap — was 8″ */
    printAreas: SINGLE({ left: 26, top: 40, width: 32, height: 33 }, { w: 8.5, h: 3.5 }, "Wrap"),
    productHighlights: ["Ceramic", "Dishwasher Safe", "Vivid Print"],
    description: "Personalised ceramic mug with edge-to-edge photo print. Dishwasher and microwave safe.",
  },
  {
    productId: "frame", qikinkId: "frame", category: "gifts",
    productName: "Framed Print",
    catalog: { order: 3, title: "Framed Print", price: 899, img: "/designs/catalog-3-800.webp" },
    editor: { shell: true, family: "designer" },
    basePrice: 899, taxRate: 12,
    availableColors: ["black", "white"],
    availableSizes: ["A4", "A3"], sizeSurcharge: { A3: 200 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "frame", ext: "webp", colors: ["white", "black"] },
    image: "/images/frame.webp",
    gallery: [{ src: "/images/frame.webp", label: "Frame" }],
    /* Boxes measured off the mockup photos themselves (luminance step at the
       mat's inner bevel), converted from the photos' native 928×1152 into the
       42:50 canvas allowing for the object-cover crop. The old single box was
       31% wide where the black frame's opening is 44% — the design sat small
       and up-left inside the mat instead of filling the frame.

       The two photos are not shot alike: the black frame's opening is 44% of
       the canvas wide, the white frame's 34.4%, and they start at different
       heights. One box cannot serve both, hence areaByColor. */
    printAreas: [{
      id: "front", label: "Front", photo: "front",
      /* A4 and A3 are the same 1:√2 shape, so the box does not move — but the
         inches differ, and those drive the size readout and the DPI check */
      inches: { w: 8.3, h: 11.7 },
      inchesBySize: { A4: { w: 8.3, h: 11.7 }, A3: { w: 11.7, h: 16.5 } },
      area: { left: 28.6, top: 24.97, width: 44.0, height: 51.72 },
      areaByColor: {
        black: { left: 28.6, top: 24.97, width: 44.0, height: 51.72 },
        white: { left: 33.0, top: 28.52, width: 34.4, height: 43.17 },
      },
    }],
    productHighlights: ["Gallery Grade", "Matte Finish", "Ready to Hang"],
    description: "Gallery-grade framed photo print with a clean matte finish — ready to hang.",
  },
  {
    productId: "cushion", qikinkId: "cushion", category: "gifts",
    productName: "Photo Cushion",
    catalog: { order: 4, title: "Cushion", price: 649, img: "/designs/catalog-4-800.webp" },
    basePrice: 649, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ['16"', '18"'], sizeSurcharge: { '18"': 100 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "cushion", ext: "webp", colors: ["white"] },
    image: "/images/cushion.webp",
    gallery: [{ src: "/images/cushion.webp", label: "Cushion" }],
    printAreas: SINGLE({ left: 28, top: 31, width: 44, height: 42 }, { w: 14, h: 14 }),
    productHighlights: ["Soft Velvet Touch", "Hidden Zip", "Filler Included"],
    description: "Soft printed throw cushion with hidden zip — filler included.",
  },
  {
    productId: "canvas", qikinkId: "canvas", category: "gifts",
    productName: "Stretched Canvas",
    catalog: { order: 5, title: "Canvas", price: 500, img: "/designs/catalog-5-800.webp" },
    editor: { shell: true, family: "designer" },
    /* Sizes are Qikink's, per Drucka — the old 12×18″ and 18×24″ were not made
       by anyone in the supply chain. Retail is Qikink's item cost doubled,
       delivery charged separately as usual:
         8×8″  250→500   8×12″ 300→600   16×20″ 550→1100   20×30″ 800→1600 */
    basePrice: 500, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ['8×8"', '8×12"', '16×20"', '20×30"'],
    sizeSurcharge: { '8×12"': 100, '16×20"': 600, '20×30"': 1100 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "canvas", ext: "webp", colors: ["white"] },
    image: "/images/canvas.webp",
    gallery: [{ src: "/images/canvas.webp", label: "Canvas" }],
    /* Box measured off canvas-front-white.webp (the canvas face reads 19.0–79.3%
       across and 19.8–84.2% down in the photo's own 928×1152, converted here
       into the 42:50 canvas allowing for the object-cover crop). The authored
       box was 45% wide against a face that is 60.3% — three quarters of it,
       so the print never reached the edges of the canvas in the preview.

       The photographed canvas is 0.754 w:h. None of Qikink's four sizes is
       exactly that, so each is inscribed in the face at its own shape — a
       square 8×8″ sits inside the same photo as a tall 20×30″. */
    printAreas: [{
      id: "front", label: "Front", photo: "front",
      area: { left: 19.0, top: 18.51, width: 60.3, height: 67.15 },
      /* `inches` is the default size (8×12″, the second in the list) */
      inches: { w: 8, h: 12 },
      inchesBySize: {
        '8×8"': { w: 8, h: 8 },
        '8×12"': { w: 8, h: 12 },
        '16×20"': { w: 16, h: 20 },
        '20×30"': { w: 20, h: 30 },
      },
    }],
    productHighlights: ["Premium Canvas", "Wooden Frame", "Fade Resistant"],
    description: "Premium stretched canvas on a wooden frame — museum-style photo finish.",
  },
  {
    productId: "poster", qikinkId: "poster", category: "gifts",
    productName: "Poster Print",
    catalog: { order: 7, title: "Poster Print", price: 199, img: "/images/prints/print-1.webp" },
    editor: { shell: true, family: "designer" },
    basePrice: 199, taxRate: 12,
    availableColors: ["white"],
    /* A2 withdrawn: Qikink's poster comes in A5, A4, A3 and a range of inch
       sizes, but not A2 — and A2 was the size this product opened on, so the
       default was one that could not be fulfilled. */
    availableSizes: ["A3", '12×18"', '24×36"'], sizeSurcharge: { '24×36"': 250 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    /* poster-front-white.png is DRAWN, not photographed — there is no poster
       shot from Qikink and the editor was falling back to an unrelated
       lifestyle image with a print box over it. Generated at exactly 924×1100
       (42:50), so no object-cover crop moves the print area, with the poster
       face at a known 21.97 / 15 / 55.95 / 66.45. Replace it with a real photo
       when one arrives and re-measure the face. */
    mockups: { base: "poster", ext: "png", colors: ["white"] },
    image: "/images/prints/print-1.webp",
    gallery: [{ src: "/images/prints/print-1.webp", label: "Poster (placeholder image)" }],
    printAreas: [{
      id: "front", label: "Front", photo: "front",
      /* exactly the poster face drawn in the mockup */
      area: { left: 21.97, top: 15, width: 55.95, height: 66.45 },
      /* three sizes, two different shapes. 12×18″ is the default now that A2
         is gone; the drawn poster face is A2-shaped, so a 12×18″ print is
         inscribed very slightly narrower than the paper — which is honest. */
      inches: { w: 12, h: 18 },
      inchesBySize: {
        A3: { w: 11.7, h: 16.5 },
        '12×18"': { w: 12, h: 18 },
        '24×36"': { w: 24, h: 36 },
      },
    }],
    productHighlights: ["Large Format", "Premium Matte Paper", "Fade Resistant"],
    description: "Large-format matte poster print — vivid, fade-resistant and ready to frame.",
  },
  {
    productId: "keychain", qikinkId: "keychain", category: "gifts",
    productName: "Acrylic Keychain",
    catalog: { order: 6, title: "Keychain", price: 149, img: "/designs/catalog-6-800.webp" },
    basePrice: 149, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["Standard"], sizeSurcharge: {}, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "keychain", ext: "webp", colors: ["white"] },
    image: "/images/keychain.webp",
    gallery: [{ src: "/images/keychain.webp", label: "Keychain" }],
    printAreas: SINGLE({ left: 35, top: 36, width: 24, height: 38 }, { w: 1.2, h: 2 }),
    productHighlights: ["Crystal Acrylic", "Double Sided", "Pocket Size"],
    description: "Pocket-size acrylic photo keepsake — crystal clear, printed both sides.",
  },
  {
    productId: "stickers", qikinkId: "stickers", category: "gifts",
    hidden: true, // hidden from catalog grid until real product photos arrive; /stickers landing stays live
    productName: "Custom Stickers & Labels",
    basePrice: 99, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["A5 Sheet", "A4 Sheet"], sizeSurcharge: { "A4 Sheet": 60 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    /* TODO(Sagar): add /mockups/stickers-blank.png from Qikink, then switch to
       mockups: { base: "stickers", ext: "png", colors: ["white"] } (file must be
       named stickers-front-white.png per the mockupSrc convention) */
    image: "/images/keychain.webp",
    gallery: [{ src: "/images/keychain.webp", label: "Stickers (placeholder image)" }],
    printAreas: SINGLE({ left: 25, top: 22, width: 50, height: 56 }, { w: 5.8, h: 8.3 }, "Sheet"),
    productHighlights: ["Waterproof Vinyl", "Matte / Glossy", "Any Quantity"],
    description: "Custom stickers & labels for branding, packaging, weddings and events — die-cut or sheet format.",
  },
  {
    productId: "invitation-cards", qikinkId: "invitation-cards", category: "gifts",
    hidden: true, // hidden from catalog grid until real product photos arrive; /invitation-cards landing stays live
    productName: "Invitation Cards",
    basePrice: 149, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["Digital", '5×7" Print'], sizeSurcharge: { '5×7" Print': 100 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    /* TODO(Sagar): add /mockups/invitation-cards-blank.png from Qikink, then switch to
       mockups: { base: "invitation-cards", ext: "png", colors: ["white"] } (file must be
       named invitation-cards-front-white.png per the mockupSrc convention) */
    image: "/images/frame.webp",
    gallery: [{ src: "/images/frame.webp", label: "Invitation card (placeholder image)" }],
    printAreas: SINGLE({ left: 30, top: 14, width: 40, height: 68 }, { w: 5, h: 7 }),
    productHighlights: ["Marathi / Hindi / English", "Digital + Print", "Premium Cardstock"],
    description: "Personalised wedding, birthday & event invitations — digital invites for WhatsApp plus premium printed cards.",
  },
  {
    productId: "kids-mug", qikinkId: "kids-mug", category: "kids",
    productName: "Kids Mug / School Gift",
    basePrice: 279, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["250 ml"], sizeSurcharge: {}, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "mug", ext: "webp", colors: ["white"] },
    image: "/images/mug.webp",
    gallery: [{ src: "/images/mug.webp", label: "Kids mug" }],
    printAreas: SINGLE({ left: 26, top: 40, width: 32, height: 33 }, { w: 7, h: 3 }, "Wrap"),
    productHighlights: ["Break Resistant", "Kid Safe", "Bright Print"],
    description: "Break-resistant mug sized for small hands — a school gift that lasts.",
  },
];

export const productById = (id) => PRODUCTS.find((p) => p.productId === id);

/* ── per-product editor capabilities — PURE CONFIG, no product-id branching.
   A product carries an optional `caps` object; the editor reads these instead
   of hardcoding `if (product === "mug")`. Add a product to the catalog with
   its caps and the shell honours them — no editor code change. */
export const DEFAULT_CAPS = {
  allowText: true,        // Text tool available
  allowImage: true,       // Image/upload + graphics tools available
  maxUploadBytes: MAX_UPLOAD_BYTES,
  printAreaShape: "rect", // "rect" | "curved" (mug wrap) — rendering hint
};
export const capsOf = (product) => ({ ...DEFAULT_CAPS, ...(product?.caps ?? {}) });
// TODO(Sagar): Unhide stickers + invitation-cards in catalog once
// real Qikink product photos replace keychain.jpg/frame.jpg placeholders
export const productsInCategory = (cat) => PRODUCTS.filter((p) => p.category === cat && !p.hidden);
export const defaultProductFor = (cat) => productsInCategory(cat)[0] ?? PRODUCTS[0];
export const placementOf = (product, id) => product.printAreas.find((p) => p.id === id) ?? product.printAreas[0];

/* every Drucka mockup crop is 42:50 (w:h) — `area` percentages are read
   against those two different axes, so a box that is 10% × 10% is NOT square
   on screen. */
export const MOCKUP_ASPECT = { w: 42, h: 50 };

/* ── renderArea — the print box actually drawn on the mockup ──
   A placement carries two facts that have to agree: `area`, the box on the
   mockup photo, and `inches`, the real print size. They did not. Left Pocket,
   for instance, declared 4″ × 4″ but its box drew at 0.84:1 on screen, so a
   square design previewed as a portrait rectangle — and the mug's 8″ × 3.5″
   wrap previewed almost square, off by nearly 3×. Every design was shown at
   the wrong proportions, which is the one thing a print preview must not do.

   Rather than re-authoring fifteen hand-tuned boxes (and re-checking each
   against its photo), treat `area` as the bounding box the print must stay
   inside and inscribe the true-to-inches rectangle in it, centred. The print
   can then never land outside the region the box was authored for, and
   width% and height% finally mean the same number of pixels per inch — so
   "7.4 × 7.1 inch" in the panel is 7.4 × 7.1 on the garment.

   `colorId` picks the per-colour box when a placement has one. Mockup photos
   for different colours are not always shot at the same distance — the Framed
   Print's black and white photos put the frame's opening in visibly different
   places — so one box per placement cannot fit both. Falls back to `area`,
   and mirrors MockupImage's rule that a colour without its own photo is shown
   on the white one. */
export const areaFor = (product, p, colorId) => {
  if (!p.areaByColor) return p.area;
  const shown = product?.mockups?.colors?.includes(colorId) ? colorId : "white";
  return p.areaByColor[shown] ?? p.area;
};

/* ── inchesFor — the print size for the size the customer picked ──
   A Canvas is sold as 12×18″ AND 18×24″, a Poster as A3, A2, 12×18″ and
   24×36″ — different shapes, not just different scales. The placement used to
   declare one fixed `inches`, so picking anything but the default previewed
   the wrong shape and quoted the wrong inches. Placements that genuinely have
   one print size (a mug wrap, a tee front) just omit inchesBySize. */
export const inchesFor = (p, size) => p.inchesBySize?.[size] ?? p.inches;

/* Sizes a product is actually made in for a given colour. Most products stock
   every size in every colour and simply omit sizesByColor. */
export const sizesFor = (product, colorId) =>
  product?.sizesByColor?.[colorId] ?? product?.availableSizes ?? [];

export const renderArea = (p, product = null, colorId = null, size = null) => {
  const a = product ? areaFor(product, p, colorId) : p.area;
  const inches = inchesFor(p, size);
  const boxW = a.width * MOCKUP_ASPECT.w;
  const boxH = a.height * MOCKUP_ASPECT.h;
  const target = inches.w / inches.h; // desired on-screen w:h
  let w = boxW;
  let h = boxW / target;
  if (h > boxH) { h = boxH; w = boxH * target; }
  const width = w / MOCKUP_ASPECT.w;
  const height = h / MOCKUP_ASPECT.h;
  return {
    left: a.left + (a.width - width) / 2,
    top: a.top + (a.height - height) / 2,
    width,
    height,
  };
};

/* mockup photo for a product/color/photo-key; colors without a photo fall
   back to white; products without mockups fall back to `image` or null */
export const mockupSrc = (product, colorId, photo) => {
  if (product.mockups) {
    const c = product.mockups.colors.includes(colorId) ? colorId : "white";
    return `/mockups/${product.mockups.base}-${photo}-${c}.${product.mockups.ext}`;
  }
  return product.image ?? null;
};

/* ── pricing ── everything prices through the single engine entry point.
   calcPrice keeps its signature; internally it's pricingEngine.calculate. */
export { placementPrintCost } from "../utils/pricing";
export const calcPrice = (args) => calculate({ family: "designer", ...args });

/* ── layer factories ──
   % of the active print area: x/y = layer CENTER, w/h = % of area size. */
export const newImageLayer = (src, name, aspect = 1, areaInches = { w: 12, h: 16 }, px = null) => {
  /* Start at 62% of the print width, then scale BOTH sides down if that makes
     the art taller than the area. Clamping the height alone (the old
     behaviour) silently squashed every portrait image on the way in: a 1:3
     photo came out at 1:2.15. */
  let wIn = Math.min(areaInches.w * 0.62, areaInches.w);
  let hIn = wIn * aspect;
  if (hIn > areaInches.h) {
    const k = areaInches.h / hIn;
    wIn *= k;
    hIn *= k;
  }
  return {
    id: uid(), type: "image", name: name || "Design", src,
    x: 50, y: 42,
    w: (wIn / areaInches.w) * 100, h: (hIn / areaInches.h) * 100,
    rot: 0, opacity: 1, flipH: false, flipV: false,
    visible: true, locked: false, aspectLock: true,
    /* source pixels, so the editor can work out the effective print DPI */
    px: px && px.w && px.h ? { w: px.w, h: px.h } : null,
  };
};

/* Effective print resolution — source pixels ÷ printed inches. 300 is the
   press standard, 150 the floor below which a garment print looks soft. */
export const MIN_PRINT_DPI = 150;
export const GOOD_PRINT_DPI = 300;
export const layerDpi = (layer, areaInches) => {
  if (!layer?.px || layer.type === "text") return null;
  const wIn = ((layer.w ?? 30) / 100) * areaInches.w;
  const hIn = ((layer.h ?? 30) / 100) * areaInches.h;
  if (wIn <= 0 || hIn <= 0) return null;
  return Math.round(Math.min(layer.px.w / wIn, layer.px.h / hIn));
};

export const newTextLayer = (text) => ({
  id: uid(), type: "text", name: text.slice(0, 18) || "Text", text,
  font: "Inter", fontSize: 11, bold: true, italic: false, underline: false,
  letterSpacing: 0, lineHeight: 1.15, color: "#1b1430",
  x: 50, y: 42, rot: 0, opacity: 1, flipH: false, flipV: false,
  visible: true, locked: false,
});

export const duplicateOf = (layer) => ({
  ...layer, id: uid(),
  name: `${layer.name} copy`.slice(0, 24),
  x: Math.min(96, layer.x + 4), y: Math.min(96, layer.y + 4),
});

export const FONTS = [
  { id: "Inter", stack: "Inter, sans-serif" },
  { id: "Playfair Display", stack: "'Playfair Display', serif" },
  { id: "Georgia", stack: "Georgia, serif" },
  { id: "Arial Black", stack: "'Arial Black', sans-serif" },
  { id: "Impact", stack: "Impact, sans-serif" },
  { id: "Courier New", stack: "'Courier New', monospace" },
  { id: "Trebuchet MS", stack: "'Trebuchet MS', sans-serif" },
  { id: "Brush Script MT", stack: "'Brush Script MT', cursive" },
];
export const fontStack = (id) => FONTS.find((f) => f.id === id)?.stack ?? "Inter, sans-serif";

export const TEXT_COLORS = ["#1b1430", "#ffffff", "#5b21b6", "#f97316", "#c0272d", "#1d4a38", "#2b50c8", "#f2c230"];

/* ── built-in graphics (inline SVG → data URL, no external assets) ── */
const svg = (body, fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}">${body}</svg>`;

export const GRAPHIC_CATEGORIES = ["all", "fun", "nature", "symbols"];
export const GRAPHICS = [
  { id: "heart", label: "Heart", cat: "symbols", svg: svg('<path d="M12 21s-7.5-4.9-10-9.6C.4 8 2 4.5 5.5 4.1 7.7 3.8 9.6 5 12 7.4 14.4 5 16.3 3.8 18.5 4.1 22 4.5 23.6 8 22 11.4 19.5 16.1 12 21 12 21z"/>', "#e0245e") },
  { id: "star", label: "Star", cat: "symbols", svg: svg('<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/>', "#f2c230") },
  { id: "smiley", label: "Smiley", cat: "fun", svg: svg('<circle cx="12" cy="12" r="10" fill="#f2c230"/><circle cx="8.5" cy="10" r="1.4" fill="#1b1430"/><circle cx="15.5" cy="10" r="1.4" fill="#1b1430"/><path d="M7.5 14.5c1.2 1.8 2.7 2.7 4.5 2.7s3.3-.9 4.5-2.7" stroke="#1b1430" stroke-width="1.6" fill="none" stroke-linecap="round"/>', "none") },
  { id: "bolt", label: "Bolt", cat: "symbols", svg: svg('<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>', "#f97316") },
  { id: "crown", label: "Crown", cat: "fun", svg: svg('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.6 10H4.6z"/>', "#d4a017") },
  { id: "flower", label: "Flower", cat: "nature", svg: svg('<circle cx="12" cy="6" r="3.4"/><circle cx="6" cy="11" r="3.4"/><circle cx="18" cy="11" r="3.4"/><circle cx="8.5" cy="17" r="3.4"/><circle cx="15.5" cy="17" r="3.4"/><circle cx="12" cy="12" r="3" fill="#f2c230"/>', "#b9a7e0") },
  { id: "peace", label: "Peace", cat: "symbols", svg: svg('<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 017.9 7H13V4.3A8 8 0 0112 4zm-1 .3V11H4.1A8 8 0 0111 4.3zM4.3 13H11v6.7A8 8 0 014.3 13zm8.7 6.7V13h6.7a8 8 0 01-6.7 6.7z"/>', "#2b50c8") },
  { id: "paw", label: "Paw", cat: "nature", svg: svg('<ellipse cx="7" cy="8" rx="2.2" ry="2.8"/><ellipse cx="17" cy="8" rx="2.2" ry="2.8"/><ellipse cx="3.8" cy="13" rx="2" ry="2.5"/><ellipse cx="20.2" cy="13" rx="2" ry="2.5"/><path d="M12 11c3.5 0 6.5 3 6.5 6 0 2-1.5 3.5-3.5 3.5-1.2 0-2-.5-3-.5s-1.8.5-3 .5c-2 0-3.5-1.5-3.5-3.5 0-3 3-6 6.5-6z"/>', "#6e4a2f") },
  { id: "sun", label: "Sun", cat: "nature", svg: svg('<circle cx="12" cy="12" r="5"/><g stroke="#f2a230" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1"/></g>', "#f2a230") },
  { id: "music", label: "Music", cat: "fun", svg: svg('<path d="M9 18.5a3 3 0 11-2-2.8V5l13-2.5v12a3 3 0 11-2-2.8V6.9L9 8.8z"/>', "#5b21b6") },
  { id: "mountain", label: "Mountain", cat: "nature", svg: svg('<path d="M2 20L9 6l4 8 2.5-4L22 20z"/><circle cx="18" cy="6" r="2.4" fill="#f2c230"/>', "#1d4a38") },
  { id: "skull", label: "Skull", cat: "fun", svg: svg('<path d="M12 2a9 9 0 00-9 9c0 3.6 2 6.3 4.5 7.6V21a1 1 0 001 1h7a1 1 0 001-1v-2.4C19 17.3 21 14.6 21 11a9 9 0 00-9-9zm-3.5 11a2 2 0 110-4 2 2 0 010 4zm7 0a2 2 0 110-4 2 2 0 010 4zM12 17l-1.5-2.5h3z"/>', "#1b1430") },
];

export const graphicDataUrl = (g) => `data:image/svg+xml;utf8,${encodeURIComponent(g.svg)}`;

/* thin adapter over the single upload service (src/utils/validateUpload.js) —
   runs the full validate → magic-byte → size → sanitize → compress pipeline.
   maxBytes lets a caller apply a per-product upload cap (see capsOf). */
export const fileToDataUrl = async (file, max = 1400, maxBytes) => {
  const { src, aspect, origWidth, origHeight } = await prepareUpload(file, { maxDim: max, maxBytes });
  /* original pixel dimensions travel with the asset so the editor can warn
     when a design is being printed larger than its resolution supports */
  return { src, aspect, px: { w: origWidth, h: origHeight } };
};
