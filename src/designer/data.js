/* ── Drucka product designer — catalog + pricing ──
   ONE data-driven catalog powers the single designer for every category
   (men / women / kids / children / gifts). Add a product here and the
   designer, product page, mockup view and submit page all pick it up.
   Cart items carry `qikinkId` so the existing checkout → Qikink product
   mapping keeps working unchanged. */

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
    basePrice: 349, taxRate: 5,
    availableColors: ["white", "black", "navy", "red", "royal-blue", "bottle-green", "maroon", "yellow", "lavender", "baby-pink"],
    availableSizes: ADULT_SIZES, sizeSurcharge: ADULT_SURCHARGE, sizeChart: SIZE_CHART,
    printingOptions: PRINT_METHODS,
    mockups: { base: "tshirt", ext: "jpg", colors: ["white", "black", "navy"] },
    gallery: [
      { src: "/mockups/tshirt-male-front-white.jpg", label: "Model front" },
      { src: "/mockups/tshirt-male-back-white.jpg", label: "Model back" },
      { src: "/mockups/tshirt-front-white.jpg", label: "Flat front" },
      { src: "/mockups/tshirt-back-white.jpg", label: "Flat back" },
    ],
    printAreas: TEE_PLACEMENTS,
    productHighlights: ["180 GSM", "100% Cotton", "Super Combed", "Pre Shrunk", "Bio Washed", "Lycra Ribbed Neck"],
    description: "Classic-fit crew neck tee in 180 GSM super-combed cotton. Bio-washed for softness, pre-shrunk so the fit survives the wash, with a Lycra-ribbed neck that keeps its shape. Printed on demand in India and delivered in 2–4 days.",
    rating: 4.6, reviews: 1238,
  },
  {
    productId: "tshirt-women", qikinkId: "tshirt", category: "women",
    productName: "Women Classic Crew T-Shirt",
    basePrice: 349, taxRate: 5,
    availableColors: ["white", "black", "lavender", "baby-pink", "maroon", "yellow", "bottle-green"],
    availableSizes: ADULT_SIZES, sizeSurcharge: ADULT_SURCHARGE, sizeChart: SIZE_CHART,
    printingOptions: PRINT_METHODS,
    mockups: { base: "tshirt-female", ext: "jpg", colors: ["white"] },
    gallery: [
      { src: "/images/categories/women-tshirt.jpg", label: "On model" },
      { src: "/mockups/tshirt-female-front-white.jpg", label: "Front" },
      { src: "/mockups/tshirt-female-back-white.jpg", label: "Back" },
      { src: "/images/categories/women-crop-top.jpg", label: "Crop top style" },
    ],
    printAreas: FRONT_BACK({ left: 39, top: 33, width: 22, height: 27 }, { left: 39, top: 32, width: 22, height: 28 }, { w: 11, h: 14 }),
    productHighlights: ["180 GSM", "100% Cotton", "Feminine Fit", "Pre Shrunk", "Bio Washed"],
    description: "Soft-touch women's crew tee with a relaxed feminine fit. 180 GSM combed cotton, bio-washed, printed on demand in India.",
    rating: 4.7, reviews: 642,
  },
  {
    productId: "kids-tshirt", qikinkId: "kids-tshirt", category: "kids",
    productName: "Kids Classic T-Shirt",
    basePrice: 299, taxRate: 5,
    availableColors: ["white", "yellow", "baby-pink", "royal-blue", "red"],
    availableSizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], sizeSurcharge: {}, sizeChart: KIDS_SIZE_CHART,
    printingOptions: PRINT_METHODS,
    mockups: { base: "kids-tshirt", ext: "png", colors: ["white"] },
    gallery: [
      { src: "/images/categories/kids-tshirt.jpg", label: "On model" },
      { src: "/mockups/kids-tshirt-front-white.png", label: "Front" },
      { src: "/mockups/kids-tshirt-back-white.png", label: "Back" },
      { src: "/images/categories/girls-tshirt.jpg", label: "Girls fit" },
      { src: "/images/categories/kids-tshirt-full.jpg", label: "Full look" },
    ],
    printAreas: FRONT_BACK({ left: 31, top: 26, width: 38, height: 42 }, { left: 31, top: 26, width: 38, height: 42 }, { w: 9, h: 11 }),
    productHighlights: ["160 GSM", "100% Cotton", "Skin Friendly", "Bio Washed", "Easy Wash"],
    description: "Soft, skin-friendly cotton tee for kids 2–14 years. Holds colour and shape through school-day adventures and endless washes.",
    rating: 4.8, reviews: 415,
  },
  {
    productId: "tshirt-children", qikinkId: "kids-tshirt", category: "children",
    productName: "Children Round Neck Tee (2–8Y)",
    basePrice: 279, taxRate: 5,
    availableColors: ["white", "yellow", "baby-pink", "red"],
    availableSizes: ["2Y", "4Y", "6Y", "8Y"], sizeSurcharge: {}, sizeChart: KIDS_SIZE_CHART.slice(0, 4),
    printingOptions: PRINT_METHODS,
    mockups: { base: "kids-tshirt", ext: "png", colors: ["white"] },
    gallery: [
      { src: "/mockups/kids-tshirt-front-white.png", label: "Front" },
      { src: "/mockups/kids-model-front-white.png", label: "On model" },
    ],
    printAreas: FRONT_BACK({ left: 31, top: 26, width: 38, height: 42 }, { left: 31, top: 26, width: 38, height: 42 }, { w: 8, h: 10 }),
    productHighlights: ["160 GSM", "100% Cotton", "Toddler Safe", "Tagless Comfort"],
    description: "Extra-soft round neck tee sized for the littlest ones (2–8 years). Tagless, breathable and made for daily play.",
    rating: 4.8, reviews: 188,
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
      { src: "/images/categories/hoodie-2.jpg", label: "Front" },
      { src: "/images/categories/hoodie-1.jpg", label: "Classic fit" },
      { src: "/images/categories/hoodie-oversized.jpg", label: "Oversized fit" },
    ],
    printAreas: FRONT_BACK({ left: 33, top: 30, width: 34, height: 27 }, { left: 33, top: 28, width: 34, height: 32 }, { w: 11, h: 12 }),
    productHighlights: ["320 GSM", "Cotton Fleece", "Kangaroo Pocket", "Drawstring Hood"],
    description: "Heavyweight 320 GSM fleece hoodie with kangaroo pocket. Printed front or back on demand.",
    rating: 4.5, reviews: 256,
  },
  {
    productId: "kids-hoodie", qikinkId: "kids-hoodie", category: "kids",
    productName: "Kids Hoodie",
    basePrice: 649, taxRate: 5,
    availableColors: ["white", "navy", "red", "yellow"],
    availableSizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], sizeSurcharge: {}, sizeChart: KIDS_SIZE_CHART,
    printingOptions: PRINT_METHODS,
    gallery: [{ src: "/images/categories/kids-jacket.jpg", label: "On model" }],
    printAreas: FRONT_BACK({ left: 33, top: 30, width: 34, height: 26 }, { left: 33, top: 28, width: 34, height: 30 }, { w: 8, h: 9 }),
    productHighlights: ["280 GSM", "Cozy Fleece", "Skin Friendly"],
    description: "Cozy fleece hoodie for kids — warm, soft and ready for their favourite design.",
    rating: 4.7, reviews: 97,
  },
  {
    productId: "mug", qikinkId: "mug", category: "gifts",
    productName: "Photo Mug",
    basePrice: 299, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["325 ml"], sizeSurcharge: {}, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "mug", ext: "png", colors: ["white"] },
    image: "/images/mug.jpg",
    gallery: [{ src: "/images/mug.jpg", label: "Mug" }],
    printAreas: SINGLE({ left: 26, top: 40, width: 32, height: 33 }, { w: 8, h: 3.5 }, "Wrap"),
    productHighlights: ["Ceramic", "Dishwasher Safe", "Vivid Print"],
    description: "Personalised ceramic mug with edge-to-edge photo print. Dishwasher and microwave safe.",
    rating: 4.6, reviews: 880,
  },
  {
    productId: "frame", qikinkId: "frame", category: "gifts",
    productName: "Framed Print",
    basePrice: 899, taxRate: 12,
    availableColors: ["black", "white"],
    availableSizes: ["A4", "A3"], sizeSurcharge: { A3: 200 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "frame", ext: "png", colors: ["white", "black"] },
    image: "/images/frame.jpg",
    gallery: [{ src: "/images/frame.jpg", label: "Frame" }],
    printAreas: SINGLE({ left: 31, top: 26, width: 31, height: 43 }, { w: 8.3, h: 11.7 }),
    productHighlights: ["Gallery Grade", "Matte Finish", "Ready to Hang"],
    description: "Gallery-grade framed photo print with a clean matte finish — ready to hang.",
    rating: 4.7, reviews: 364,
  },
  {
    productId: "cushion", qikinkId: "cushion", category: "gifts",
    productName: "Photo Cushion",
    basePrice: 649, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ['16"', '18"'], sizeSurcharge: { '18"': 100 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "cushion", ext: "png", colors: ["white"] },
    image: "/images/cushion.jpg",
    gallery: [{ src: "/images/cushion.jpg", label: "Cushion" }],
    printAreas: SINGLE({ left: 28, top: 31, width: 44, height: 42 }, { w: 14, h: 14 }),
    productHighlights: ["Soft Velvet Touch", "Hidden Zip", "Filler Included"],
    description: "Soft printed throw cushion with hidden zip — filler included.",
    rating: 4.5, reviews: 291,
  },
  {
    productId: "canvas", qikinkId: "canvas", category: "gifts",
    productName: "Stretched Canvas",
    basePrice: 999, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ['12×18"', '18×24"'], sizeSurcharge: { '18×24"': 300 }, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "canvas", ext: "png", colors: ["white"] },
    image: "/images/canvas.jpg",
    gallery: [{ src: "/images/canvas.jpg", label: "Canvas" }],
    printAreas: SINGLE({ left: 21, top: 18, width: 45, height: 62 }, { w: 12, h: 18 }),
    productHighlights: ["Premium Canvas", "Wooden Frame", "Fade Resistant"],
    description: "Premium stretched canvas on a wooden frame — museum-style photo finish.",
    rating: 4.8, reviews: 199,
  },
  {
    productId: "keychain", qikinkId: "keychain", category: "gifts",
    productName: "Acrylic Keychain",
    basePrice: 149, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["Standard"], sizeSurcharge: {}, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "keychain", ext: "png", colors: ["white"] },
    image: "/images/keychain.jpg",
    gallery: [{ src: "/images/keychain.jpg", label: "Keychain" }],
    printAreas: SINGLE({ left: 35, top: 36, width: 24, height: 38 }, { w: 1.2, h: 2 }),
    productHighlights: ["Crystal Acrylic", "Double Sided", "Pocket Size"],
    description: "Pocket-size acrylic photo keepsake — crystal clear, printed both sides.",
    rating: 4.4, reviews: 1023,
  },
  {
    productId: "kids-mug", qikinkId: "kids-mug", category: "kids",
    productName: "Kids Mug / School Gift",
    basePrice: 279, taxRate: 12,
    availableColors: ["white"],
    availableSizes: ["250 ml"], sizeSurcharge: {}, sizeChart: null,
    printingOptions: FULL_COLOUR,
    mockups: { base: "mug", ext: "png", colors: ["white"] },
    image: "/images/mug.jpg",
    gallery: [{ src: "/images/mug.jpg", label: "Kids mug" }],
    printAreas: SINGLE({ left: 26, top: 40, width: 32, height: 33 }, { w: 7, h: 3 }, "Wrap"),
    productHighlights: ["Break Resistant", "Kid Safe", "Bright Print"],
    description: "Break-resistant mug sized for small hands — a school gift that lasts.",
    rating: 4.6, reviews: 144,
  },
];

export const productById = (id) => PRODUCTS.find((p) => p.productId === id);
export const productsInCategory = (cat) => PRODUCTS.filter((p) => p.category === cat);
export const defaultProductFor = (cat) => productsInCategory(cat)[0] ?? PRODUCTS[0];
export const placementOf = (product, id) => product.printAreas.find((p) => p.id === id) ?? product.printAreas[0];

/* mockup photo for a product/color/photo-key; colors without a photo fall
   back to white; products without mockups fall back to `image` or null */
export const mockupSrc = (product, colorId, photo) => {
  if (product.mockups) {
    const c = product.mockups.colors.includes(colorId) ? colorId : "white";
    return `/mockups/${product.mockups.base}-${photo}-${c}.${product.mockups.ext}`;
  }
  return product.image ?? null;
};

/* ── pricing ──
   unit = base + size surcharge + per-printed-placement print cost.
   Full placements cost the method price; small add-ons cost 60% of it. */
export const placementPrintCost = (method, placement) =>
  placement.small ? Math.round(method.price * 0.6) : method.price;

export function calcPrice({ product, layersByPlacement, selectedPrintMethod, selectedSize, qty = 1, profitMargin = 0 }) {
  const method = product.printingOptions.find((m) => m.id === selectedPrintMethod) ?? product.printingOptions[0];
  const printed = product.printAreas.filter((p) => (layersByPlacement[p.id] ?? []).some((l) => l.visible !== false));
  const printCost = printed.reduce((s, p) => s + placementPrintCost(method, p), 0);
  const unit = product.basePrice + (product.sizeSurcharge?.[selectedSize] ?? 0) + printCost;
  const selling = unit + (Number(profitMargin) || 0);
  return { unit, selling, total: selling * qty, printed, method, printCost };
}

/* ── layer factories ──
   % of the active print area: x/y = layer CENTER, w/h = % of area size. */
export const newImageLayer = (src, name, aspect = 1, areaInches = { w: 12, h: 16 }) => {
  const wIn = Math.min(areaInches.w * 0.62, areaInches.w);
  const hIn = Math.min(wIn * aspect, areaInches.h);
  return {
    id: uid(), type: "image", name: name || "Design", src,
    x: 50, y: 42,
    w: (wIn / areaInches.w) * 100, h: (hIn / areaInches.h) * 100,
    rot: 0, opacity: 1, flipH: false, flipV: false,
    visible: true, locked: false, aspectLock: true,
  };
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

/* hard client-side cap so a huge file can't freeze the browser or get
   uploaded; the raw image is downscaled below before anything leaves the device */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/* downscale an uploaded image for smooth editing (print file is re-uploaded
   full-res by the backend later; 1400px keeps quality good for DTG too) */
export const fileToDataUrl = (file, max = 1400) =>
  new Promise((resolve, reject) => {
    if (file && file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Image is over 20 MB — please use a smaller file"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      if (file.type === "image/svg+xml") {
        resolve({ src: reader.result, aspect: 1 });
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Not a valid image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        if (scale === 1) {
          resolve({ src: reader.result, aspect: img.height / img.width });
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ src: canvas.toDataURL("image/png"), aspect: img.height / img.width });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
