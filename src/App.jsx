import { useEffect, useMemo, useRef, useState } from "react";
import { qikinkApi, setAdminKey, getAdminKey } from "./lib/qikinkClient";
import { syncOrderCreate, syncOrderPatch, fulfillOrder } from "./lib/orderStore";
import { payWithRazorpay } from "./lib/paymentClient";
import DesignerProductPage from "./designer/ProductPage";
import ProductDesigner from "./designer/Designer";
import { productById as designerProductById } from "./designer/data";
import CollageMaker from "./collage/CollageMaker";
/* premium frame-shop homepage components (src/components) */
import AnnouncementBar from "./components/AnnouncementBar";
import FrameNavbar from "./components/Navbar";
import FrameHero from "./components/Hero";
import TrustBar from "./components/TrustBar";
import BestsellingFrames from "./components/BestsellingFrames";
import FeaturedProduct from "./components/FeaturedProduct";
import GalleryWalls from "./components/GalleryWalls";
import StatementCollection from "./components/StatementCollection";
import MagneticWalls from "./components/MagneticWalls";
import QualityBanner from "./components/QualityBanner";
import SignatureGift from "./components/SignatureGift";
import FrameFeatures from "./components/Features";
import FrameTestimonials from "./components/Testimonials";
import StoreLocations from "./components/StoreLocations";
import FrameFooter from "./components/Footer";
import BackToTop from "./components/BackToTop";

/* ═══════════════════════════════════════════════════════════════
   CONFIG — EDIT THESE VALUES FOR YOUR BUSINESS
   ═══════════════════════════════════════════════════════════════ */
const CONFIG = {
  whatsappNumber: "917083811355", // country code + number, no "+" or spaces
  instagramUrl: "https://instagram.com/druc.ka",
  email: "hello@drucka.in",
  upiId: "drucka@upi", // ← replace with your real UPI ID (quoted in WhatsApp orders)
  printPartner: "Drucka Print Studio · Kolhapur, MH",
};

/* ── Feature flags — flip these for launch phases ──
   Razorpay code stays fully wired; it's just hidden while testing. */
const FEATURES = {
  ENABLE_RAZORPAY: false,   // true → "Pay via Razorpay" returns as primary payment
  ENABLE_COD_TESTING: true, // true → "Place COD Test Order" is the main checkout flow
};

/* Staging banner — build with VITE_STAGING=true on Vercel preview /
   staging deployments so testers can't mistake it for the live site. */
const IS_STAGING = import.meta.env.VITE_STAGING === "true";

/* Landing-page catalogue (images live in /public/images/) */
const PRODUCTS = [
  { id: "tshirt",   name: "Premium T-Shirt",  category: "tshirts",   price: 599, delivery: "2–4 days", img: "/images/tshirt.jpg",   tag: "Bestseller", blurb: "Soft cotton, full-colour print" },
  { id: "mug",      name: "Photo Mug",        category: "mugs",      price: 299, delivery: "2–4 days", img: "/images/mug.jpg",      tag: "Popular",    blurb: "Personalised ceramic mug" },
  { id: "frame",    name: "Framed Print",     category: "frames",    price: 899, delivery: "2–4 days", img: "/images/frame.jpg",    tag: "Premium",    blurb: "Gallery-grade photo frame" },
  { id: "cushion",  name: "Cushion",          category: "cushions",  price: 649, delivery: "2–4 days", img: "/images/cushion.jpg",  tag: "Cozy Pick",  blurb: "Soft printed throw cushion" },
  { id: "canvas",   name: "Canvas",           category: "frames",    price: 999, delivery: "2–4 days", img: "/images/canvas.jpg",   tag: "Premium",    blurb: "Stretched premium canvas" },
  { id: "keychain", name: "Acrylic Keychain", category: "keychains", price: 149, delivery: "2–4 days", img: "/images/keychain.jpg", tag: "Under ₹200", blurb: "Pocket-size photo keepsake" },
  { id: "kids-tshirt", name: "Kids T-Shirt",          category: "kids", price: 449, delivery: "2–4 days", img: "/mockups/kids-tshirt-front-white.png", fallbackImg: "/images/tshirt.jpg", tag: "Kids 2–12Y", blurb: "Soft cotton tee for little ones" },
  { id: "kids-hoodie", name: "Kids Hoodie",           category: "kids", price: 799, delivery: "2–4 days", img: "/images/categories/kids-jacket.jpg", fallbackImg: "/images/tshirt.jpg", tag: "Kids 2–12Y", blurb: "Cozy printed hoodie for kids" },
  { id: "kids-mug",    name: "Kids Mug / School Gift", category: "kids", price: 279, delivery: "2–4 days", img: "/images/mug.jpg", tag: "School Gift", blurb: "Break-resistant mug for school" },
];

const CATEGORIES = [
  { id: "all",       label: "All" },
  { id: "tshirts",   label: "T-Shirts" },
  { id: "mugs",      label: "Mugs" },
  { id: "frames",    label: "Frames & Canvas" },
  { id: "cushions",  label: "Cushions" },
  { id: "keychains", label: "Keychains" },
  { id: "kids",      label: "Kids" },
];

/* ═══ EDITOR CATALOGUE — blank mockups, prices, print areas ═══
   area = printable area in % of the 420×500 canvas
   printArea = real-world size shown in the variants panel      */
const EDITOR_PRODUCTS = [
  { id: "tshirt",    name: "Regular T-Shirt",   price: 599, cost: 359, sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], apparel: true,  printArea: "30 × 40 cm", area: { left: 29.5, top: 23, width: 41, height: 46 } },
  { id: "oversized", name: "Oversized T-Shirt", price: 699, cost: 419, sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], apparel: true,  printArea: "35 × 45 cm", area: { left: 28.5, top: 24, width: 43, height: 47 } },
  { id: "hoodie",    name: "Hoodie",            price: 999, cost: 649, sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], apparel: true,  printArea: "28 × 30 cm", area: { left: 33, top: 27, width: 34, height: 27 } },
  { id: "mug",       name: "Photo Mug",         price: 299, cost: 179, sizes: ["325 ml"],                   apparel: false, printArea: "20 × 9 cm",  area: { left: 33, top: 35, width: 34, height: 33 } },
  { id: "frame",     name: "Framed Print",      price: 899, cost: 539, sizes: ["A4", "A3"],                 apparel: false, printArea: "21 × 30 cm", area: { left: 35, top: 24, width: 30, height: 42 } },
  { id: "cushion",   name: "Cushion",           price: 649, cost: 389, sizes: ['16"', '18"'],               apparel: false, printArea: "40 × 40 cm", area: { left: 31, top: 27, width: 38, height: 38 } },
  { id: "canvas",    name: "Canvas",            price: 999, cost: 599, sizes: ['12×18"', '18×24"'],         apparel: false, printArea: "30 × 45 cm", area: { left: 31.5, top: 21, width: 39, height: 54 } },
  { id: "keychain",  name: "Acrylic Keychain",  price: 149, cost: 79,  sizes: ["Standard"],                 apparel: false, printArea: "3 × 5 cm",   area: { left: 39.5, top: 35.5, width: 21, height: 28 } },
  { id: "kids-tshirt", name: "Kids T-Shirt",           price: 449, cost: 269, sizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], apparel: true,  kids: true, printArea: "25 × 32 cm", area: { left: 31, top: 26, width: 38, height: 42 } },
  { id: "kids-hoodie", name: "Kids Hoodie",            price: 799, cost: 499, sizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], apparel: true,  kids: true, printArea: "22 × 26 cm", area: { left: 33, top: 28, width: 34, height: 26 } },
  { id: "kids-mug",    name: "Kids Mug / School Gift", price: 279, cost: 159, sizes: ["250 ml"],                                  apparel: false, kids: true, printArea: "18 × 8 cm",  area: { left: 33, top: 35, width: 34, height: 33 } },
];

/* Neck-label print area for apparel */
const LABEL_AREA = { left: 43, top: 11, width: 14, height: 7.5 };

/* ── Photo mockup views (real product photo / on human model) ──
   Naming scheme served from /public/mockups/ (PNG preferred, JPG also tried):
     adult flat:   tshirt-front-white.png / tshirt-back-white.png
     adult male:   tshirt-male-front-white.png / tshirt-male-back-white.png
     adult female: tshirt-female-front-white.png / tshirt-female-back-white.png
     kids flat:    kids-tshirt-front-white.png / kids-tshirt-back-white.png
     kids model:   kids-model-front-white.png / kids-model-back-white.png
   Replace "white" with black/navy/red/yellow for other colours.
   Crop photos to 42:50 portrait so the print area aligns 1:1. */
const MOCKUP_VIEWS = [
  { id: "flat", label: "👕 Flat" },
  { id: "real", label: "📷 Real" },
  { id: "model", label: "🧍 Model" },
  { id: "model2", label: "🧍‍♀️ Model" },
];

/* Returns an ORDERED list of candidate URLs for a mockup photo:
   selected colour (.png then .jpg) → white fallback (.png then .jpg).
   The first file that loads wins; if all fail, the editor shows a
   "Mockup image missing" placeholder with the expected filename. */
function getMockupAsset(productId, colorId, view, side = "front") {
  const s = side === "back" ? "back" : "front";
  let stem;
  if (productId.startsWith("kids")) {
    stem =
      view === "model" || view === "model2"
        ? productId === "kids-tshirt" ? `kids-model-${s}` : `${productId}-model-${s}`
        : `${productId}-${s}`;
  } else {
    const v = view === "model" ? "male" : view === "model2" ? "female" : null;
    stem = v ? `${productId}-${v}-${s}` : `${productId}-${s}`;
  }
  const urls = [];
  for (const c of colorId === "white" ? ["white"] : [colorId, "white"]) {
    urls.push(`/mockups/${stem}-${c}.png`, `/mockups/${stem}-${c}.jpg`);
  }
  return urls;
}

/* Where the printable area sits on YOUR photos (percent of the photo box),
   per view and side. Print areas start BELOW the collar, centered on the
   chest — never covering face, neck or collar. Tune after adding photos. */
const PHOTO_AREAS = {
  tshirt: {
    real:   { front: { left: 34, top: 31, width: 32, height: 36 }, back: { left: 34, top: 30, width: 32, height: 37 } },
    model:  { front: { left: 39, top: 34, width: 22, height: 27 }, back: { left: 39, top: 32, width: 22, height: 29 } },
    model2: { front: { left: 40, top: 35, width: 20, height: 26 }, back: { left: 40, top: 33, width: 20, height: 28 } },
  },
  oversized: {
    real:   { front: { left: 33, top: 31, width: 34, height: 37 }, back: { left: 33, top: 30, width: 34, height: 38 } },
    model:  { front: { left: 38, top: 34, width: 24, height: 28 }, back: { left: 38, top: 32, width: 24, height: 30 } },
    model2: { front: { left: 39, top: 35, width: 22, height: 27 }, back: { left: 39, top: 33, width: 22, height: 29 } },
  },
  hoodie: {
    real:   { front: { left: 35, top: 32, width: 30, height: 24 }, back: { left: 33, top: 29, width: 34, height: 34 } },
    model:  { front: { left: 37, top: 33, width: 26, height: 20 }, back: { left: 36, top: 30, width: 28, height: 26 } },
    model2: { front: { left: 38, top: 34, width: 24, height: 19 }, back: { left: 37, top: 31, width: 26, height: 25 } },
  },
  "kids-tshirt": {
    real:   { front: { left: 35, top: 32, width: 30, height: 32 }, back: { left: 35, top: 31, width: 30, height: 33 } },
    model:  { front: { left: 39, top: 36, width: 22, height: 24 }, back: { left: 39, top: 34, width: 22, height: 26 } },
    model2: { front: { left: 39, top: 36, width: 22, height: 24 }, back: { left: 39, top: 34, width: 22, height: 26 } },
  },
};

/* ── Print placement presets (fix #4/#7) — derived from the chest area ── */
const PLACEMENTS = [
  { id: "center",       label: "Center chest", side: "front" },
  { id: "left-chest",   label: "Left chest",   side: "front" },
  { id: "right-chest",  label: "Right chest",  side: "front" },
  { id: "full-front",   label: "Full front",   side: "front" },
  { id: "upper-back",   label: "Upper back",   side: "back" },
  { id: "full-back",    label: "Full back",    side: "back" },
  { id: "sleeve-left",  label: "Left sleeve",  side: "front" },
  { id: "sleeve-right", label: "Right sleeve", side: "front" },
];

const clampArea = (a) => {
  const left = clamp(a.left, 0, 96);
  const top = clamp(a.top, 0, 96);
  return { left, top, width: clamp(a.width, 2, 100 - left), height: clamp(a.height, 2, 100 - top) };
};

/* Transforms the base chest area `b` into the chosen placement box.
   "Left chest" = wearer's left (viewer's right). Sleeves get a small box. */
function placementArea(placement, b) {
  switch (placement) {
    case "left-chest":
      return clampArea({ left: b.left + b.width * 0.6, top: b.top + b.height * 0.04, width: b.width * 0.32, height: b.height * 0.24 });
    case "right-chest":
      return clampArea({ left: b.left + b.width * 0.08, top: b.top + b.height * 0.04, width: b.width * 0.32, height: b.height * 0.24 });
    case "full-front":
    case "full-back":
      return clampArea({ left: b.left - b.width * 0.1, top: b.top - b.height * 0.05, width: b.width * 1.2, height: b.height * 1.15 });
    case "upper-back":
      return clampArea({ left: b.left + b.width * 0.15, top: b.top - b.height * 0.02, width: b.width * 0.7, height: b.height * 0.32 });
    case "sleeve-left":
      return clampArea({ left: b.left - b.width * 0.52, top: b.top + b.height * 0.02, width: b.width * 0.3, height: b.width * 0.3 });
    case "sleeve-right":
      return clampArea({ left: b.left + b.width * 1.22, top: b.top + b.height * 0.02, width: b.width * 0.3, height: b.width * 0.3 });
    default:
      return b;
  }
}

const PRODUCT_COLORS = [
  { id: "white",  label: "White",  hex: "#f8f7f4", dark: false },
  { id: "black",  label: "Black",  hex: "#26262e", dark: true },
  { id: "navy",   label: "Navy",   hex: "#1e3a5f", dark: true },
  { id: "red",    label: "Red",    hex: "#b03a3a", dark: true },
  { id: "yellow", label: "Yellow", hex: "#eebd4a", dark: false },
];

const FONTS = [
  { label: "Modern",      value: "'Inter', sans-serif" },
  { label: "Elegant",     value: "'Playfair Display', serif" },
  { label: "Handwritten", value: "'Caveat', cursive" },
  { label: "Bold",        value: "'Archivo Black', sans-serif" },
];

/* Free built-in graphics (inline SVG data URIs — no external requests) */
const svgUri = (s) => `data:image/svg+xml;utf8,${encodeURIComponent(s.replace(/\s+/g, " "))}`;
const GRAPHICS = [
  { id: "heart",    label: "Heart",    src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 88 C10 60 2 34 18 20 C30 10 44 14 50 26 C56 14 70 10 82 20 C98 34 90 60 50 88Z' fill='#e5484d'/></svg>`) },
  { id: "star",     label: "Star",     src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z' fill='#f3b13f'/></svg>`) },
  { id: "sun",      label: "Sunset",   src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='30' fill='#f3a13f'/><g stroke='#f3a13f' stroke-width='5' stroke-linecap='round'><path d='M50 6v10M50 84v10M6 50h10M84 50h10M19 19l7 7M74 74l7 7M81 19l-7 7M26 74l-7 7'/></g></svg>`) },
  { id: "mountain", label: "Mountain", src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='44' r='34' fill='#f6c66b'/><path d='M14 78 L42 34 L56 56 L66 42 L88 78 Z' fill='#2c4a63'/><path d='M42 34 L49 45 L42 52 L36 44 Z' fill='#e9eef2'/></svg>`) },
  { id: "smiley",   label: "Smiley",   src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='44' fill='#fbd34d'/><circle cx='35' cy='42' r='6' fill='#1b1430'/><circle cx='65' cy='42' r='6' fill='#1b1430'/><path d='M30 62 Q50 80 70 62' stroke='#1b1430' stroke-width='6' fill='none' stroke-linecap='round'/></svg>`) },
  { id: "bolt",     label: "Bolt",     src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M58 4 L20 56 H44 L38 96 L80 40 H54 Z' fill='#7c3aed'/></svg>`) },
  { id: "paw",      label: "Paw",      src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><ellipse cx='30' cy='32' rx='10' ry='13' fill='#5d4037'/><ellipse cx='70' cy='32' rx='10' ry='13' fill='#5d4037'/><ellipse cx='12' cy='52' rx='9' ry='11' fill='#5d4037'/><ellipse cx='88' cy='52' rx='9' ry='11' fill='#5d4037'/><path d='M50 48 C66 48 78 62 74 76 C71 88 60 92 50 92 C40 92 29 88 26 76 C22 62 34 48 50 48Z' fill='#5d4037'/></svg>`) },
  { id: "crown",    label: "Crown",    src: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M14 74 L8 30 L32 48 L50 18 L68 48 L92 30 L86 74 Z' fill='#f3b13f'/><rect x='14' y='78' width='72' height='10' rx='4' fill='#f3b13f'/></svg>`) },
];

/* Quick-start templates — each adds ready-made layers */
const TEMPLATES = [
  { id: "birthday",  name: "Birthday Bash",   layers: [
    { type: "text", text: "HAPPY BIRTHDAY", font: FONTS[3].value, fontSize: 22, bold: true, italic: false, color: "#f97316", x: 50, y: 32, scale: 1, rotation: 0, visible: true },
    { type: "text", text: "Aarav!", font: FONTS[2].value, fontSize: 40, bold: false, italic: false, color: "#5b21b6", x: 50, y: 52, scale: 1, rotation: -4, visible: true },
  ]},
  { id: "dad",       name: "Best Dad Ever",   layers: [
    { type: "text", text: "BEST", font: FONTS[3].value, fontSize: 26, bold: true, italic: false, color: "#1b1430", x: 50, y: 28, scale: 1, rotation: 0, visible: true },
    { type: "text", text: "DAD", font: FONTS[3].value, fontSize: 44, bold: true, italic: false, color: "#b03a3a", x: 50, y: 50, scale: 1, rotation: 0, visible: true },
    { type: "text", text: "EVER", font: FONTS[3].value, fontSize: 26, bold: true, italic: false, color: "#1b1430", x: 50, y: 70, scale: 1, rotation: 0, visible: true },
  ]},
  { id: "adventure", name: "Adventure Awaits", layers: [
    { type: "image", src: GRAPHICS[3].src, x: 50, y: 40, scale: 1.1, rotation: 0, visible: true },
    { type: "text", text: "ADVENTURE AWAITS", font: FONTS[0].value, fontSize: 15, bold: true, italic: false, color: "#2c4a63", x: 50, y: 76, scale: 1, rotation: 0, visible: true },
  ]},
  { id: "couple",    name: "Made With Love",  layers: [
    { type: "image", src: GRAPHICS[0].src, x: 50, y: 36, scale: 0.9, rotation: 0, visible: true },
    { type: "text", text: "Together forever", font: FONTS[2].value, fontSize: 30, bold: false, italic: false, color: "#e5484d", x: 50, y: 68, scale: 1, rotation: -3, visible: true },
  ]},
];

const wa = (message) =>
  `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

const inr = (n) => `₹${n.toLocaleString("en-IN")}`;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
};

/* ═══════════════════════════════════════════════════════════════
   QIKINK PRINT-ON-DEMAND FULFILLMENT (frontend layer)
   ────────────────────────────────────────────────────────────────
   ⚠ SECURITY: API keys must be stored on the BACKEND, never in the
   browser or localStorage. This frontend only:
     • stores NON-SENSITIVE settings (store name, addresses, toggles)
     • builds the order payload for YOUR backend
     • tracks order status locally
   All real Qikink API calls happen server-side — see
   server/qikink-api.example.js for /api/qikink/token,
   /api/qikink/create-order and /api/qikink/order-status.
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_QIKINK_SETTINGS = {
  status: "not_connected", // not_connected | sandbox | live
  sandbox: true,
  clientId: "", // demo placeholder — real auth lives in backend env vars
  storeName: "Drucka",
  pickupAddress: "Drucka Print Studio, Kolhapur, Maharashtra 416001",
  supportWhatsapp: CONFIG.whatsappNumber,
  supportEmail: CONFIG.email,
  paymentMode: "prepaid", // prepaid | cod | both
  autoSend: false, // auto-send PAID orders to Qikink (backend feature)
  packingSlipBrand: "Drucka", // white-label: customer sees Drucka, not Qikink
};

const ORDER_STATUSES = ["Draft", "Payment Pending", "COD Pending Approval", "Paid", "COD Approved", "Sent to Qikink", "In Production", "Shipped", "Delivered", "Failed"];
const QIKINK_STATUSES = ["Draft", "Sent to Qikink", "In Production", "Shipped", "Delivered", "Failed"];

/* Drucka product → Qikink product/SKU mapping.
   Confirm product IDs + SKU patterns in your Qikink dashboard:
   https://creator.qikink.com/dashboard → Products */
const QIKINK_PRODUCT_MAP = [
  { druckaId: "tshirt",      druckaName: "Regular T-Shirt",   qikinkProduct: "Male Standard Crew T-Shirt", qikinkProductId: "MRNHS-180", skuPattern: "MRnHs-{color}-{size}", printMethod: "DTG",         colors: ["white", "black", "navy", "red", "yellow"], sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], baseCost: 359, sellingPrice: 599, printAreas: ["Front", "Back", "Left chest"], active: true },
  { druckaId: "oversized",   druckaName: "Oversized T-Shirt", qikinkProduct: "Unisex Oversized Tee",       qikinkProductId: "MOSTS-240", skuPattern: "MOsTs-{color}-{size}", printMethod: "DTF",         colors: ["white", "black", "navy"],                  sizes: ["S", "M", "L", "XL", "XXL"],              baseCost: 419, sellingPrice: 699, printAreas: ["Front", "Back"],                        active: true },
  { druckaId: "polo",        druckaName: "Polo T-Shirt",      qikinkProduct: "Male Polo MP25",             qikinkProductId: "MP25",      skuPattern: "MP25-{color}-{size}",  printMethod: "Embroidery",  colors: ["white", "black", "navy"],                  sizes: ["S", "M", "L", "XL", "XXL"],              baseCost: 449, sellingPrice: 799, printAreas: ["Left chest"],                           active: false /* add to Drucka catalogue first */ },
  { druckaId: "kids-tshirt", druckaName: "Kids T-Shirt",      qikinkProduct: "Kids Round Neck T-Shirt",    qikinkProductId: "KRNHS-160", skuPattern: "KRnHs-{color}-{size}", printMethod: "DTG",         colors: ["white", "black"],                          sizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], baseCost: 269, sellingPrice: 449, printAreas: ["Front", "Back"],                    active: true },
  { druckaId: "hoodie",      druckaName: "Hoodie",            qikinkProduct: "Unisex Hooded Sweatshirt",   qikinkProductId: "MHOOD-320", skuPattern: "MHood-{color}-{size}", printMethod: "DTF",         colors: ["white", "black", "navy"],                  sizes: ["S", "M", "L", "XL", "XXL"],              baseCost: 649, sellingPrice: 999, printAreas: ["Front", "Back"],                        active: true },
  { druckaId: "mug",         druckaName: "Photo Mug",         qikinkProduct: "White Ceramic Mug 11oz",     qikinkProductId: "MUG11-W",   skuPattern: "Mug11-{color}",        printMethod: "Sublimation", colors: ["white"],                                   sizes: ["325 ml"],                                 baseCost: 179, sellingPrice: 299, printAreas: ["Wrap"],                                 active: true },
];
/* default shipping cost per mapping (editable in Admin → Product Mapping) */
QIKINK_PRODUCT_MAP.forEach((m) => { if (m.shippingCost == null) m.shippingCost = m.druckaId === "hoodie" ? 69 : 49; });

/* product_map DB rows (snake_case, /api/admin/product-map) ⇆ frontend entries */
const mapRowToEntry = (r) => ({
  druckaId: r.drucka_id,
  druckaName: r.product_name,
  qikinkProduct: r.product_name,
  qikinkProductId: r.qikink_product_id,
  skuPattern: r.sku_pattern,
  printMethod: r.print_method,
  colors: r.colors ?? [],
  sizes: r.sizes ?? [],
  baseCost: r.base_cost ?? 0,
  shippingCost: r.shipping_cost ?? 0,
  sellingPrice: EDITOR_PRODUCTS.find((p) => p.id === r.drucka_id)?.price ?? 0,
  printAreas: r.print_areas ?? [],
  active: !!r.active,
});
const mapEntryToRow = (m) => ({
  drucka_id: m.druckaId,
  product_name: m.druckaName,
  qikink_product_id: m.qikinkProductId,
  sku_pattern: m.skuPattern,
  print_method: m.printMethod,
  colors: m.colors,
  sizes: m.sizes,
  base_cost: m.baseCost,
  shipping_cost: m.shippingCost ?? 0,
  print_areas: m.printAreas,
  active: m.active,
});

/* Builds the clean JSON your backend forwards to Qikink's order-create
   API. NEVER call Qikink directly from the browser — POST this to
   /api/qikink/create-order instead. Field names follow Qikink's docs;
   confirm the exact schema in your dashboard before going live. */
function buildQikinkOrderPayload(order, settings, map = QIKINK_PRODUCT_MAP) {
  const colorName = (id) => PRODUCT_COLORS.find((c) => c.id === id)?.label ?? id;
  return {
    order_number: order.id,
    brand_name: settings.packingSlipBrand || "Drucka", // white-label packing slip
    gateway: order.paymentMode === "cod" ? "COD" : "Prepaid",
    payment_status: order.paymentStatus,
    total_order_value: order.total,
    qikink_shipping: "1", // Qikink ships directly to the customer
    line_items: order.items.map((i) => {
      const m = map.find((x) => x.druckaId === i.productId);
      return {
        search_from_my_products: 0,
        qikink_product_id: m?.qikinkProductId ?? "UNMAPPED",
        sku: m
          ? m.skuPattern.replace("{color}", colorName(i.color)).replace("{size}", i.size ?? "")
          : `UNMAPPED-${i.productId}`,
        print_type: m?.printMethod ?? "DTG",
        quantity: i.qty,
        price: i.price,
        custom_size: i.customSize ?? null,
        designs: Object.entries(i.design ?? {})
          .filter(([, ls]) => ls.length)
          .map(([side, ls]) => ({
            placement: i.placement && i.placement !== "center" ? i.placement : side,
            layer_count: ls.length,
            // TODO BACKEND: customer artwork lives as data-URLs in this order.
            // Upload each image layer to your CDN (S3/Cloudinary) server-side
            // and put the public URLs here before calling Qikink:
            design_link: "BACKEND_UPLOAD_REQUIRED",
            mockup_link: "BACKEND_RENDER_OPTIONAL",
          })),
      };
    }),
    shipping_address: {
      first_name: order.customer.name,
      address1: order.customer.address1,
      address2: order.customer.address2 || "",
      city: order.customer.city,
      province: order.customer.state,
      zip: order.customer.pincode,
      country_code: "IN",
      phone: order.customer.phone,
      email: order.customer.email || "",
    },
    courier_partner: "auto",
    support_contact: { whatsapp: settings.supportWhatsapp, email: settings.supportEmail },
    notes: order.customer.notes || "",
  };
}

/* API safety: validate before any send. Returns a list of problems. */
function validateQikinkOrder(order, map = QIKINK_PRODUCT_MAP) {
  const problems = [];
  const c = order.customer ?? {};
  if (!c.name?.trim()) problems.push("Customer name is required");
  if (!/^\d{10}$/.test((c.phone ?? "").replace(/\D/g, "").slice(-10))) problems.push("Valid 10-digit phone required");
  if (!c.address1?.trim()) problems.push("Address line 1 is required");
  if (!c.city?.trim()) problems.push("City is required");
  if (!c.state?.trim()) problems.push("State is required");
  if (!/^\d{6}$/.test(c.pincode ?? "")) problems.push("Valid 6-digit pincode required");
  if (!["Paid", "COD Approved"].includes(order.paymentStatus))
    problems.push("Payment must be completed (or COD approved) before sending to Qikink");
  order.items.forEach((i) => {
    if (!map.find((m) => m.druckaId === i.productId && m.active))
      problems.push(`No active Qikink mapping for "${i.name}"`);
    if (!i.design || !Object.values(i.design).some((ls) => ls.length))
      problems.push(`No artwork on "${i.name}" — design required before fulfillment`);
  });
  return problems;
}

/* ═══════════════════════════════════════════════════════════════
   ICONS — lightweight inline SVGs
   ═══════════════════════════════════════════════════════════════ */
const Icon = ({ d, className = "h-5 w-5", filled = false }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth={filled ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);

const icons = {
  cart: "M6 6h15l-1.5 9h-12L5 3H2 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  heart: "M19 14c1.5-1.5 2-3.2 2-4.5A4.5 4.5 0 0 0 16.5 5c-1.8 0-3.4 1-4.5 2.6A5.4 5.4 0 0 0 7.5 5 4.5 4.5 0 0 0 3 9.5c0 1.3.5 3 2 4.5l7 7z",
  whatsapp: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm4.5 13.7c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a14 14 0 0 1-1.5-.5c-2.6-1.1-4.3-3.8-4.4-4-.1-.1-1-1.4-1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.1.1.7-.2 1.6z",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6L6 18",
  star: "M12 2.5l2.9 5.9 6.6 1-4.7 4.6 1.1 6.5L12 17.4l-5.9 3.1 1.1-6.5L2.5 9.4l6.6-1z",
  truck: "M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  shield: "M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z M9 12l2 2 4-4",
  upload: "M12 16V4m0 0L7 9m5-5l5 5M4 20h16",
  chevron: "M6 9l6 6 6-6",
  spark: "M12 2l1.8 5.7L19 9l-5.2 1.7L12 16l-1.8-5.3L5 9l5.2-1.3z M19 15l.9 2.6L22 18l-2.1.7L19 21l-.9-2.3L16 18l2.1-.4z",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7s-2-5-5-5a2.5 2.5 0 0 0 0 5h5zm0 0s2-5 5-5a2.5 2.5 0 0 1 0 5h-5z",
  instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.2-1.7a.9.9 0 1 0 0 .01z",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  check: "M5 13l4 4L19 7",
  trash: "M4 7h16M9 7V4h6v3m-8 0l1 13h8l1-13",
  package: "M12 2L3 7v10l9 5 9-5V7zM3 7l9 5m0 0l9-5m-9 5v10",
  back: "M19 12H5m0 0l7 7m-7-7l7-7",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A16.5 16.5 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  text: "M4 6V4h16v2M12 4v16m-3 0h6",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  image: "M3 5h18v14H3zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01",
  hand: "M18 11V6.5a1.5 1.5 0 0 0-3 0V11m0-5.5v-2a1.5 1.5 0 0 0-3 0V11m0-6.5a1.5 1.5 0 0 0-3 0V12m9-1v-2a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1c-2.5 0-4-1-5.5-3L5 15.5a1.6 1.6 0 0 1 2.5-2L9 15",
  layers: "M12 2L2 8l10 6 10-6zM2 14l10 6 10-6",
  plus: "M12 5v14M5 12h14",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  arrowUp: "M12 19V5m0 0l-6 6m6-6l6 6",
  arrowDown: "M12 5v14m0 0l-6-6m6 6l6-6",
  pen: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z",
  rotate: "M21 2v6h-6M21 8a9 9 0 1 0 2.5 6",
};

const Stars = () => (
  <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
    {[...Array(5)].map((_, i) => <Icon key={i} d={icons.star} filled className="h-4 w-4" />)}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   BLANK PRODUCT MOCKUPS — pure SVG, colour-aware (no images)
   ═══════════════════════════════════════════════════════════════ */
function MockupSVG({ productId: rawProductId, hex, dark, side }) {
  const productId = rawProductId.replace(/^kids-/, ""); // kids fall back to the same blank shapes
  const line = dark ? "rgba(255,255,255,0.22)" : "#d8d4cc";
  const shade = dark ? "rgba(255,255,255,0.08)" : "rgba(27,20,48,0.05)";
  const crease = dark ? "rgba(255,255,255,0.10)" : "rgba(27,20,48,0.07)";
  const common = { fill: hex, stroke: line, strokeWidth: 2.5, strokeLinejoin: "round" };

  const Shadow = ({ cy = 478, rx = 150 }) => (
    <ellipse cx="210" cy={cy} rx={rx} ry="11" fill="#1b1430" opacity="0.07" />
  );

  if (productId === "tshirt" || productId === "oversized") {
    const over = productId === "oversized";
    const gid = over ? "teeShadeOver" : "teeShade";
    /* big Printify-style blank — body + sleeves fill almost the whole viewBox */
    const body = over
      ? "M92 62 C128 48 150 42 160 34 Q210 76 260 34 C270 42 292 48 328 62 L318 200 L316 478 Q210 498 104 478 L102 200 Z"
      : "M100 54 C134 42 154 36 164 28 Q210 70 256 28 C266 36 286 42 320 54 L312 192 L310 478 Q210 498 110 478 L108 192 Z";
    return (
      <svg viewBox="0 0 420 500" className="h-full w-full">
        <defs>
          {/* soft side-seam shading makes the fabric look rounded */}
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity={dark ? 0.28 : 0.09} />
            <stop offset="0.16" stopColor="#000" stopOpacity="0" />
            <stop offset="0.5" stopColor={dark ? "#fff" : "#000"} stopOpacity={dark ? 0.05 : 0} />
            <stop offset="0.84" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.28 : 0.09} />
          </linearGradient>
        </defs>
        <Shadow cy={490} rx={172} />
        {/* wide set-in sleeves with curved cuffs */}
        <path d={over
          ? "M92 62 C58 82 28 110 6 144 L48 258 C74 238 92 226 112 216 Z"
          : "M100 54 C68 70 38 94 12 124 L52 232 C76 214 94 202 112 192 Z"} {...common} />
        <path d={over
          ? "M328 62 C362 82 392 110 414 144 L372 258 C346 238 328 226 308 216 Z"
          : "M320 54 C352 70 382 94 408 124 L368 232 C344 214 326 202 308 192 Z"} {...common} />
        {/* body */}
        <path d={body} {...common} />
        <path d={body} fill={`url(#${gid})`} stroke="none" />
        {/* inner back of collar (visible through the neck opening) */}
        {side !== "back" && (
          <path d={over ? "M168 35 Q210 54 252 35" : "M172 29 Q210 48 248 29"}
            fill="none" stroke={line} strokeWidth="2" />
        )}
        {/* ribbed collar band */}
        {side === "back"
          ? <path d={over ? "M160 34 Q210 54 260 34 Q258 45 254 48 Q210 66 166 48 Q162 45 160 34" : "M164 28 Q210 48 256 28 Q254 39 250 42 Q210 60 170 42 Q166 39 164 28"}
              fill={shade} stroke={line} strokeWidth="2" />
          : <path d={over ? "M160 34 Q210 76 260 34 Q264 41 262 48 Q210 92 158 48 Q156 41 160 34" : "M164 28 Q210 70 256 28 Q260 35 258 42 Q210 86 162 42 Q160 35 164 28"}
              fill={shade} stroke={line} strokeWidth="2" />}
        {/* hem + cuff stitching */}
        <path d={over ? "M106 471 Q210 490 314 471" : "M112 471 Q210 490 308 471"}
          stroke={crease} strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d={over ? "M54 250 C78 231 96 219 112 210" : "M58 224 C80 207 96 196 110 188"}
          stroke={crease} strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d={over ? "M366 250 C342 231 324 219 308 210" : "M362 224 C340 207 324 196 310 188"}
          stroke={crease} strokeWidth="2" strokeDasharray="4 4" fill="none" />
        {/* fabric wrinkles */}
        <path d={over ? "M106 222 q18 11 38 9 M314 222 q-18 11 -38 9" : "M112 198 q18 11 38 9 M308 198 q-18 11 -38 9"}
          stroke={crease} strokeWidth="2" fill="none" />
        <path d={over ? "M128 312 q24 7 48 2 M146 452 q60 12 120 0" : "M132 304 q24 7 48 2 M150 452 q55 11 110 0"}
          stroke={crease} strokeWidth="1.5" fill="none" opacity="0.7" />
      </svg>
    );
  }

  if (productId === "hoodie") {
    return (
      <svg viewBox="0 0 420 500" className="h-full w-full">
        <Shadow />
        {/* hood back */}
        <path d="M152 80 Q160 30 210 26 Q260 30 268 80 Q240 100 210 100 Q180 100 152 80" {...common} />
        {/* sleeves */}
        <path d="M126 92 L42 144 L80 240 L140 208 Z" {...common} />
        <path d="M294 92 L378 144 L340 240 L280 208 Z" {...common} />
        {/* body */}
        <path d="M126 92 Q160 76 170 70 Q210 96 250 70 Q260 76 294 92 L288 210 L288 446 Q210 462 132 446 L132 210 Z" {...common} />
        {/* hood opening */}
        <path d="M170 70 Q176 44 210 42 Q244 44 250 70 Q244 96 210 98 Q176 96 170 70" fill={shade} stroke={line} strokeWidth="2" />
        {/* drawstrings */}
        <path d="M196 96 q-3 22 0 34 M224 96 q3 22 0 34" stroke={dark ? "rgba(255,255,255,0.5)" : "#b9b3a8"} strokeWidth="3" fill="none" />
        {/* kangaroo pocket */}
        <path d="M158 332 L262 332 L252 402 Q210 412 168 402 Z" fill="none" stroke={line} strokeWidth="2.5" />
      </svg>
    );
  }

  if (productId === "mug") {
    return (
      <svg viewBox="0 0 420 500" className="h-full w-full">
        <Shadow cy={452} rx={120} />
        {/* handle */}
        <path d="M290 220 Q358 222 354 282 Q350 338 288 336" fill="none" stroke={hex} strokeWidth="22" strokeLinecap="round" />
        <path d="M290 220 Q358 222 354 282 Q350 338 288 336" fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" />
        {/* body */}
        <path d="M128 152 L128 396 Q128 432 170 432 L250 432 Q292 432 292 396 L292 152 Z" {...common} />
        {/* rim */}
        <ellipse cx="210" cy="152" rx="82" ry="17" fill={hex} stroke={line} strokeWidth="2.5" />
        <ellipse cx="210" cy="152" rx="68" ry="11" fill={dark ? "rgba(0,0,0,0.35)" : "#eceae6"} />
      </svg>
    );
  }

  if (productId === "frame") {
    return (
      <svg viewBox="0 0 420 500" className="h-full w-full">
        <Shadow cy={462} rx={130} />
        <rect x="116" y="84" width="188" height="296" rx="6" fill={hex === "#f8f7f4" ? "#2b2620" : hex} stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
        <rect x="138" y="106" width="144" height="252" fill="#fbfaf7" stroke="#e2ded6" strokeWidth="2" />
      </svg>
    );
  }

  if (productId === "cushion") {
    return (
      <svg viewBox="0 0 420 500" className="h-full w-full">
        <Shadow cy={448} rx={140} />
        <path d="M120 120 Q210 92 300 120 Q330 215 300 310 Q210 338 120 310 Q90 215 120 120 Z" {...common} />
        <path d="M132 132 Q210 110 288 132" stroke={crease} strokeWidth="2.5" fill="none" />
        <path d="M132 298 Q210 320 288 298" stroke={crease} strokeWidth="2.5" fill="none" />
      </svg>
    );
  }

  if (productId === "canvas") {
    return (
      <svg viewBox="0 0 420 500" className="h-full w-full">
        <Shadow cy={460} rx={130} />
        <path d="M298 92 L318 106 L318 396 L298 382 Z" fill={dark ? "rgba(0,0,0,0.45)" : "#d6d2c9"} />
        <path d="M122 92 L298 92 L298 382 L122 382 Z" {...common} />
      </svg>
    );
  }

  /* keychain */
  return (
    <svg viewBox="0 0 420 500" className="h-full w-full">
      <Shadow cy={442} rx={90} />
      <circle cx="210" cy="116" r="30" fill="none" stroke="#b9bdc6" strokeWidth="8" />
      <rect x="200" y="142" width="20" height="22" rx="5" fill="#cdd1d8" stroke="#b3b7c0" strokeWidth="2" />
      <rect x="146" y="160" width="128" height="184" rx="18" fill={dark ? hex : "rgba(255,255,255,0.9)"} stroke={hex === "#f8f7f4" ? "#c6cad2" : hex} strokeWidth="5" />
      <rect x="160" y="174" width="100" height="156" rx="10" fill="#fdfdfc" stroke="#e4e2dd" strokeWidth="2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CANVAS MOCKUP — blank product + dashed print area + drag layers
   ═══════════════════════════════════════════════════════════════ */
function CanvasMockup({
  product, colorHex, colorId = "white", dark, side, layers, bgVisible,
  view = "flat", failedMockups = null, onPhotoError,
  areaOverride = null, placementLabel = null,
  editing = false, mini = false, selectedId = null,
  onSelectLayer, onMoveLayer, onGestureStart, onGestureEnd,
}) {
  const areaRef = useRef(null);
  const dragRef = useRef(null);
  /* photo views cover front + back; each tab tries colour → white, png → jpg */
  const candidates =
    view !== "flat" && side !== "label" ? getMockupAsset(product.id, colorId, view, side) : null;
  const src = candidates?.find((c) => !failedMockups?.has(c)) ?? null;
  const allPhotosFailed = !!candidates && !src;
  const usePhoto = !!src;
  const area = areaOverride ?? (side === "label"
    ? LABEL_AREA
    : candidates
      ? PHOTO_AREAS[product.id]?.[view]?.[side] ?? product.area
      : product.area);

  /* ── layer drag: pointer events with DOUBLE delivery ──
     1. setPointerCapture pins touch pointers to the layer (best effort);
     2. window-level pointermove/up listeners keep fast mouse drags alive
        even when capture is unavailable or lost.
     x/y are stored as PERCENTAGES of the print area and clamped 0–100,
     so the design can never leave the dashed box. */
  const onLayerPointerDown = (e, layer) => {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectLayer?.(layer.id); // clicking a layer selects it
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    dragRef.current = { id: layer.id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: layer.x, oy: layer.y, rect };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture not available for this pointer — window listeners cover it */
    }
    onGestureStart?.();

    const move = (ev) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pid) return;
      ev.preventDefault(); // stop touch scroll while dragging
      onMoveLayer?.(
        d.id,
        clamp(d.ox + ((ev.clientX - d.sx) / d.rect.width) * 100, 0, 100),
        clamp(d.oy + ((ev.clientY - d.sy) / d.rect.height) * 100, 0, 100)
      );
    };
    const end = (ev) => {
      if (dragRef.current && ev.pointerId !== dragRef.current.pid) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (dragRef.current) {
        dragRef.current = null;
        onGestureEnd?.();
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <div
      className="relative h-full w-full select-none"
      onPointerDown={() => editing && onSelectLayer?.(null)}
    >
      {usePhoto ? (
        <img
          src={src}
          alt={`${product.name} ${view === "model" || view === "model2" ? "on model" : "photo"} mockup`}
          className="h-full w-full object-contain"
          draggable={false}
          onError={() => onPhotoError?.(src)}
        />
      ) : allPhotosFailed && product.apparel ? (
        /* No cartoon fallback on photo tabs — show a clean missing-file card */
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-white/80 p-6 text-center">
          <Icon d={icons.image} className="h-9 w-9 text-ink/25" />
          <p className="text-sm font-bold text-ink/60">Mockup image missing</p>
          <p className="text-xs text-ink/45">Add file to /public/mockups/</p>
          {!mini && (
            <code className="rounded-lg bg-ink/5 px-2.5 py-1 text-[10px] font-bold text-plum">
              {candidates[0].replace("/mockups/", "")}
            </code>
          )}
        </div>
      ) : (
        <MockupSVG productId={product.id} hex={colorHex} dark={dark} side={side} />
      )}

      {/* printable area */}
      <div
        ref={areaRef}
        className={editing ? "absolute border-2 border-dashed border-sky-500/80" : "absolute"}
        style={{ left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%` }}
      >
        {editing && !mini && (
          <>
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {placementLabel ? `${placementLabel} · ` : "Print area · "}{side === "label" ? "8 × 5 cm" : product.printArea} · 300 DPI
            </span>
            {/* safe area */}
            <div className="pointer-events-none absolute inset-[7%] border border-dashed border-sky-400/50">
              <span className="absolute bottom-0.5 right-1 text-[8px] font-medium text-sky-500/80">safe area</span>
            </div>
          </>
        )}

        {/* white print backing (background layer) */}
        {bgVisible && <div className="absolute inset-0 rounded-sm bg-white/92" />}

        {/* design layers */}
        <div className="absolute inset-0 overflow-hidden">
          {layers.map((l) =>
            !l.visible ? null : (
              <div
                key={l.id}
                onPointerDown={(e) => onLayerPointerDown(e, l)}
                className={`absolute ${editing ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none"} ${
                  editing && selectedId === l.id ? "z-10 outline-2 outline-dashed outline-plum-soft" : ""
                }`}
                style={{
                  left: `${l.x}%`,
                  top: `${l.y}%`,
                  transform: `translate(-50%,-50%) rotate(${l.rotation}deg)`,
                  width: l.type === "image" ? `${66 * l.scale}%` : "auto",
                  maxWidth: l.type === "image" ? "none" : undefined,
                  touchAction: editing ? "none" : undefined, // hard guarantee, independent of CSS build
                }}
              >
                {l.type === "image" ? (
                  <img src={l.src} alt="Design layer" draggable={false} className="w-full" />
                ) : (
                  <span
                    className="block whitespace-nowrap leading-tight"
                    style={{
                      fontFamily: l.font,
                      fontSize: `${l.fontSize * l.scale * (mini ? 0.18 : 1)}px`,
                      fontWeight: l.bold ? 700 : 400,
                      fontStyle: l.italic ? "italic" : "normal",
                      color: l.color,
                    }}
                  >
                    {l.text || "Your text"}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* Mini read-only preview used in the cart drawer */
function MiniMockup({ item }) {
  const product = EDITOR_PRODUCTS.find((p) => p.id === item.productId);
  const color = PRODUCT_COLORS.find((c) => c.id === item.color) ?? PRODUCT_COLORS[0];
  if (!product) return null;
  return (
    <div className="relative h-20 w-[68px] shrink-0 overflow-hidden rounded-xl bg-cream">
      <CanvasMockup
        product={product} colorHex={color.hex} dark={color.dark} side="front"
        layers={item.design?.front ?? []} bgVisible={item.bgVisible} mini
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR — LEFT TOOLBAR
   ═══════════════════════════════════════════════════════════════ */
const TOOLS = [
  { id: "upload",    label: "Upload",    icon: icons.upload },
  { id: "ai",        label: "AI Design", icon: icons.spark },
  { id: "text",      label: "Add Text",  icon: icons.text },
  { id: "library",   label: "My Library", icon: icons.folder },
  { id: "graphics",  label: "Graphics",  icon: icons.image },
  { id: "templates", label: "Templates", icon: icons.grid },
  { id: "help",      label: "Help",      icon: icons.help },
];

function Toolbar({ tool, setTool }) {
  return (
    <nav aria-label="Editor tools" className="z-20 flex shrink-0 flex-row justify-around border-t border-ink/10 bg-white px-1 py-1 lg:w-[72px] lg:flex-col lg:justify-start lg:gap-1 lg:border-r lg:border-t-0 lg:py-3">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(tool === t.id ? null : t.id)}
          aria-pressed={tool === t.id}
          className={`flex flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold transition ${
            tool === t.id ? "bg-plum/10 text-plum" : "text-ink/55 hover:bg-ink/5 hover:text-ink"
          }`}
        >
          <Icon d={t.icon} className="h-5 w-5" />
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR — TOOL PANELS
   ═══════════════════════════════════════════════════════════════ */
function PanelShell({ title, onClose, children }) {
  return (
    <div className="animate-sheet fixed inset-x-0 bottom-[58px] z-30 max-h-[55vh] overflow-y-auto rounded-t-2xl border border-ink/10 bg-white p-4 shadow-2xl scroll-thin lg:static lg:bottom-auto lg:max-h-none lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:shadow-none">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <button onClick={onClose} aria-label="Close panel" className="grid h-7 w-7 place-items-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10">
          <Icon d={icons.x} className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

function UploadPanel({ onClose, onAddImage, showToast }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);
  const [warn, setWarn] = useState(null); // original dimensions if too small to print sharply

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setWarn(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target.result;
      if (file.type === "image/svg+xml") {
        finish(raw); // vectors scale infinitely — never blurry
        return;
      }
      const img = new Image();
      img.onload = () => {
        // print-quality check runs on the ORIGINAL size, before downscaling
        if (Math.min(img.width, img.height) < 800) {
          setWarn(`${img.width} × ${img.height} px`);
          showToast("⚠ Low-resolution image — print may look blurry");
        }
        // Downscale rasters so localStorage + dragging stay fast
        const max = 700;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        finish(c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85), true);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);

    const finish = (src, skipToast) => {
      setBusy(false);
      setLast(src);
      onAddImage(src, true);
      if (!skipToast || !warn) showToast("Image added to your design ✓");
    };
  };

  return (
    <PanelShell title="Upload your design · डिझाईन अपलोड करा" onClose={onClose}>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleFile} className="sr-only" id="editor-upload" />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-plum/35 bg-plum/5 px-4 py-7 text-sm font-semibold text-plum transition hover:border-plum/60 hover:bg-plum/10"
      >
        <Icon d={icons.upload} className="h-6 w-6" />
        {busy ? "Processing…" : "Upload image · फोटो निवडा"}
        <span className="text-[11px] font-normal text-ink/45">PNG, JPG or SVG · best ≥ 1000px</span>
      </button>
      {warn && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11.5px] leading-relaxed text-amber-900" role="alert">
          <p className="font-bold">⚠ Print quality warning</p>
          Your image is only <strong>{warn}</strong>. For sharp 300 DPI printing we recommend at least
          1000 × 1000 px — the print may look slightly blurry. <span className="font-medium">कमी रिझोल्यूशन — प्रिंट थोडी अस्पष्ट येऊ शकते.</span>
        </div>
      )}
      {last && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-ink/60">Last upload</p>
          <div className="checker rounded-xl p-2">
            <img src={last} alt="Uploaded design preview" className="mx-auto max-h-32 object-contain" />
          </div>
          <button onClick={() => { setLast(null); setWarn(null); }} className="mt-2 text-xs font-medium text-rose-500 hover:underline">
            Remove preview
          </button>
        </div>
      )}
      <div className="mt-4 rounded-xl bg-ink/4 p-3 text-[11px] leading-relaxed text-ink/60">
        ✂️ <strong>Background removal available on request</strong> — फोटोचा background काढून हवा असेल
        तर WhatsApp वर सांगा. Just mention it when you order.
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink/45">
        Your file never leaves this device — it's previewed locally and only shared when you order on WhatsApp.
      </p>
    </PanelShell>
  );
}

/* Free rule-based "AI" design generator — no API */
function aiGenerate(prompt) {
  const p = prompt.toLowerCase();
  const text = (prompt.match(/"([^"]+)"/)?.[1] ?? prompt).slice(0, 24);
  const base = { x: 50, scale: 1, rotation: 0, visible: true, bold: false, italic: false };
  if (/love|heart|couple|valentine|wife|husband/.test(p))
    return [
      { ...base, type: "image", src: GRAPHICS[0].src, y: 36, scale: 0.85 },
      { ...base, type: "text", text, font: FONTS[2].value, fontSize: 28, color: "#e5484d", y: 68, rotation: -3 },
    ];
  if (/birthday|bday|party/.test(p))
    return [
      { ...base, type: "text", text: "HAPPY BIRTHDAY", font: FONTS[3].value, fontSize: 20, bold: true, color: "#f97316", y: 34 },
      { ...base, type: "text", text, font: FONTS[2].value, fontSize: 34, color: "#5b21b6", y: 56, rotation: -4 },
    ];
  if (/adventure|travel|mountain|trek|nature/.test(p))
    return [
      { ...base, type: "image", src: GRAPHICS[3].src, y: 40, scale: 1.1 },
      { ...base, type: "text", text: text.toUpperCase(), font: FONTS[0].value, fontSize: 15, bold: true, color: "#2c4a63", y: 76 },
    ];
  if (/dog|cat|pet|paw|puppy/.test(p))
    return [
      { ...base, type: "image", src: GRAPHICS[6].src, y: 38, scale: 0.9 },
      { ...base, type: "text", text, font: FONTS[3].value, fontSize: 18, bold: true, color: "#5d4037", y: 72 },
    ];
  if (/king|queen|boss|royal/.test(p))
    return [
      { ...base, type: "image", src: GRAPHICS[7].src, y: 34, scale: 0.8 },
      { ...base, type: "text", text: text.toUpperCase(), font: FONTS[3].value, fontSize: 22, bold: true, color: "#f3b13f", y: 64 },
    ];
  return [
    { ...base, type: "image", src: GRAPHICS[1].src, y: 34, scale: 0.7 },
    { ...base, type: "text", text: text.toUpperCase(), font: FONTS[3].value, fontSize: 20, bold: true, color: "#1b1430", y: 62 },
  ];
}

function AIDesignPanel({ onClose, onAddLayers, showToast }) {
  const [prompt, setPrompt] = useState("");
  return (
    <PanelShell title="AI Design (free, on-device)" onClose={onClose}>
      <label htmlFor="ai-prompt" className="mb-1.5 block text-xs font-semibold text-ink/60">
        Describe your idea
      </label>
      <textarea
        id="ai-prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
        placeholder={`e.g. birthday gift for "Aarav", adventure trek tee, "Best Mom" with a heart…`}
        className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-plum focus:ring-2 focus:ring-plum/20"
      />
      <button
        onClick={() => {
          if (!prompt.trim()) return;
          onAddLayers(aiGenerate(prompt));
          showToast("✨ Design generated — drag to adjust!");
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-plum to-tangerine px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
      >
        <Icon d={icons.spark} filled className="h-4 w-4" /> Generate design
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-ink/45">
        Rule-based magic that runs entirely in your browser — no AI credits, no waiting. It picks fonts,
        colours and graphics from your idea. Generated layers are fully editable.
      </p>
    </PanelShell>
  );
}

function TextPanel({ onClose, onAddText, selectedLayer, onUpdateLayer, onFieldFocus, onFieldBlur }) {
  const editing = selectedLayer?.type === "text";
  const [local, setLocal] = useState({ text: "", font: FONTS[0].value, fontSize: 22, bold: false, italic: false, color: "#1b1430" });
  const v = editing ? selectedLayer : local;
  const set = (patch) => (editing ? onUpdateLayer(selectedLayer.id, patch) : setLocal((s) => ({ ...s, ...patch })));

  return (
    <PanelShell title={editing ? "Edit selected text" : "Add text"} onClose={onClose}>
      {editing && (
        <p className="mb-2 rounded-lg bg-plum/8 px-2.5 py-1.5 text-[11px] font-medium text-plum">
          Editing the selected text layer — changes apply live.
        </p>
      )}
      <label htmlFor="text-input" className="mb-1 block text-xs font-semibold text-ink/60">Text</label>
      <input
        id="text-input" type="text" maxLength={40} value={v.text}
        onFocus={onFieldFocus} onBlur={onFieldBlur}
        onChange={(e) => set({ text: e.target.value })}
        placeholder="Happy Birthday Aai ❤️"
        className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-plum focus:ring-2 focus:ring-plum/20"
      />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="text-font" className="mb-1 block text-xs font-semibold text-ink/60">Font</label>
          <select id="text-font" value={v.font} onChange={(e) => set({ font: e.target.value })}
            className="w-full rounded-xl border border-ink/10 px-2.5 py-2.5 text-sm shadow-sm outline-none focus:border-plum">
            {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="text-color" className="mb-1 block text-xs font-semibold text-ink/60">Colour</label>
          <input id="text-color" type="color" value={v.color} onChange={(e) => set({ color: e.target.value })}
            className="h-[42px] w-full cursor-pointer rounded-xl border border-ink/10 bg-white p-1 shadow-sm" />
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor="text-size" className="mb-1 flex justify-between text-xs font-semibold text-ink/60">
          <span>Font size</span><span>{v.fontSize}px</span>
        </label>
        <input id="text-size" type="range" min="10" max="56" value={v.fontSize}
          onPointerDown={onFieldFocus} onPointerUp={onFieldBlur}
          onChange={(e) => set({ fontSize: +e.target.value })} className="w-full accent-plum" />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => set({ bold: !v.bold })} aria-pressed={v.bold}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${v.bold ? "border-plum bg-plum/10 text-plum" : "border-ink/10 text-ink/60"}`}>
          B
        </button>
        <button onClick={() => set({ italic: !v.italic })} aria-pressed={v.italic}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm italic transition ${v.italic ? "border-plum bg-plum/10 text-plum" : "border-ink/10 text-ink/60"}`}>
          I
        </button>
      </div>
      {!editing && (
        <button
          onClick={() => { if (local.text.trim()) onAddText(local); }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-plum"
        >
          <Icon d={icons.plus} className="h-4 w-4" /> Add text to design
        </button>
      )}
    </PanelShell>
  );
}

function LibraryPanel({ onClose, library, onAddImage, onDeleteFromLibrary }) {
  return (
    <PanelShell title="My Library" onClose={onClose}>
      {library.length === 0 ? (
        <p className="rounded-xl bg-ink/4 px-3 py-6 text-center text-xs text-ink/50">
          Images you upload are saved here for quick reuse.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {library.map((src, i) => (
            <div key={i} className="group relative">
              <button onClick={() => onAddImage(src, false)} className="checker block w-full overflow-hidden rounded-lg border border-ink/10 p-1 transition hover:border-plum">
                <img src={src} alt={`Library item ${i + 1}`} className="h-16 w-full object-contain" />
              </button>
              <button onClick={() => onDeleteFromLibrary(i)} aria-label="Delete from library"
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white opacity-0 shadow transition group-hover:opacity-100">
                <Icon d={icons.x} className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}

function GraphicsPanel({ onClose, onAddImage }) {
  return (
    <PanelShell title="Graphics" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        {GRAPHICS.map((g) => (
          <button key={g.id} onClick={() => onAddImage(g.src, false)}
            className="flex flex-col items-center gap-1 rounded-xl border border-ink/10 bg-white p-2.5 transition hover:border-plum hover:shadow-md">
            <img src={g.src} alt={g.label} className="h-12 w-12" />
            <span className="text-[10px] font-medium text-ink/55">{g.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink/45">All graphics are original & royalty-free — print as many as you like.</p>
    </PanelShell>
  );
}

function TemplatesPanel({ onClose, onApplyTemplate }) {
  return (
    <PanelShell title="Templates" onClose={onClose}>
      <div className="grid gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => onApplyTemplate(t)}
            className="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-left transition hover:border-plum hover:shadow-md">
            <span className="text-sm font-semibold text-ink">{t.name}</span>
            <span className="text-xs font-medium text-plum">Use →</span>
          </button>
        ))}
      </div>
    </PanelShell>
  );
}

function HelpPanel({ onClose }) {
  const tips = [
    "Pick a product & colour in the right panel (Variants).",
    "Upload a photo or add text from the left toolbar.",
    "Drag your design inside the dashed print area.",
    "Use the sliders below the canvas to resize & rotate.",
    "Switch Front / Back to design both sides.",
    "Hit Preview for a realistic final look, then Add to Cart.",
  ];
  return (
    <PanelShell title="How the editor works" onClose={onClose}>
      <ol className="grid gap-2.5">
        {tips.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-ink/65">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-plum/10 text-[10px] font-bold text-plum">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      <a href={wa("Hi Drucka! I need help using the design editor.")} target="_blank" rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white">
        <Icon d={icons.whatsapp} filled className="h-4 w-4" /> Ask us on WhatsApp
      </a>
    </PanelShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR — LAYERS PANEL
   ═══════════════════════════════════════════════════════════════ */
function LayersPanel({ layers, selectedId, onSelectLayer, onToggleVisible, onDeleteLayer, onMoveLayerOrder, bgVisible, onToggleBg, colorLabel }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45">Layers</h4>
      <ul className="grid gap-1.5">
        {[...layers].reverse().map((l) => {
          const idx = layers.indexOf(l);
          return (
            <li key={l.id}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                selectedId === l.id ? "border-plum bg-plum/5" : "border-ink/8 bg-white"
              }`}>
              <button onClick={() => onSelectLayer(l.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                {l.type === "image"
                  ? <img src={l.src} alt="" className="h-8 w-8 shrink-0 rounded-md border border-ink/10 object-contain" />
                  : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink/5 text-ink/60"><Icon d={icons.text} className="h-4 w-4" /></span>}
                <span className="truncate text-xs font-semibold text-ink">
                  {l.type === "image" ? "Image layer" : `"${(l.text || "Text").slice(0, 14)}"`}
                </span>
              </button>
              <button onClick={() => onMoveLayerOrder(idx, 1)} disabled={idx === layers.length - 1} aria-label="Move layer up"
                className="text-ink/35 hover:text-plum disabled:opacity-25"><Icon d={icons.arrowUp} className="h-3.5 w-3.5" /></button>
              <button onClick={() => onMoveLayerOrder(idx, -1)} disabled={idx === 0} aria-label="Move layer down"
                className="text-ink/35 hover:text-plum disabled:opacity-25"><Icon d={icons.arrowDown} className="h-3.5 w-3.5" /></button>
              <button onClick={() => onToggleVisible(l.id)} aria-label={l.visible ? "Hide layer" : "Show layer"}
                className="text-ink/40 hover:text-ink"><Icon d={l.visible ? icons.eye : icons.eyeOff} className="h-4 w-4" /></button>
              <button onClick={() => onDeleteLayer(l.id)} aria-label="Delete layer"
                className="text-ink/35 hover:text-rose-500"><Icon d={icons.trash} className="h-4 w-4" /></button>
            </li>
          );
        })}
        {/* background pseudo-layer */}
        <li className="flex items-center gap-2 rounded-xl border border-ink/8 bg-ink/3 px-2.5 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-ink/10 bg-white">
            <span className="h-4 w-4 rounded-sm border border-ink/10 bg-white" />
          </span>
          <span className="flex-1 truncate text-xs font-semibold text-ink/60">Background · {colorLabel}</span>
          <button onClick={onToggleBg} aria-label={bgVisible ? "Hide white print backing" : "Show white print backing"}
            className="text-ink/40 hover:text-ink"><Icon d={bgVisible ? icons.eye : icons.eyeOff} className="h-4 w-4" /></button>
        </li>
      </ul>
      {layers.length === 0 && (
        <p className="mt-2 text-[11px] text-ink/40">No design layers yet — upload an image or add text.</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR — SIZE CHART
   ═══════════════════════════════════════════════════════════════ */
const SIZE_CHART = [
  ["XS", 36, 25],
  ["S", 38, 26],
  ["M", 40, 27],
  ["L", 42, 28],
  ["XL", 44, 29],
  ["XXL", 46, 30],
  ["3XL", 48, 31],
];

const KIDS_SIZE_CHART = [
  ["2Y", 22, 15],
  ["4Y", 24, 16],
  ["6Y", 26, 18],
  ["8Y", 28, 20],
  ["10Y", 30, 22],
  ["12Y", 32, 24],
  ["14Y", 34, 25],
];

function SizeChartModal({ onClose, oversized, kids }) {
  const rows = kids ? KIDS_SIZE_CHART : SIZE_CHART;
  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-sheet w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true"
        aria-label="Size chart" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Size chart · साइज़ चार्ट</h3>
          <button onClick={onClose} aria-label="Close size chart" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10">
            <Icon d={icons.x} className="h-4 w-4" />
          </button>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-ink/45">
              <th className="pb-2">{kids ? "Age" : "Size"}</th>
              <th className="pb-2">Chest · छाती</th>
              <th className="pb-2">Length · लांबी</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([s, chest, len]) => (
              <tr key={s} className="border-t border-ink/8">
                <td className="py-2 font-bold text-plum">{s}</td>
                <td className="py-2 text-ink/70">{oversized ? chest + 4 : chest}&Prime; ({Math.round((oversized ? chest + 4 : chest) * 2.54)} cm)</td>
                <td className="py-2 text-ink/70">{oversized ? len + 2 : len}&Prime; ({Math.round((oversized ? len + 2 : len) * 2.54)} cm)</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-xl bg-ink/4 p-2.5 text-[11px] leading-relaxed text-ink/60">
          {kids
            ? "Kids regular fit — when in doubt, take the bigger size for growing room. मोठा साइज़ घ्या, मुलं पटकन वाढतात!"
            : oversized
              ? "Oversized fit — runs roomy with drop shoulders. मोकळी, loose फिटिंग."
              : "Regular fit, 100% bio-washed cotton. Between sizes? Go one up. दोन साइज़मध्ये असाल तर मोठा घ्या."}
        </p>
        <a href={wa("Hi Drucka! I need help choosing my T-shirt size.")} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
          <Icon d={icons.whatsapp} filled className="h-4 w-4" /> Still confused? Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}

/* Custom size popup — measurements saved onto the product (fix #8) */
function CustomSizeModal({ initial, onSave, onClose }) {
  const [v, setV] = useState(
    initial ?? { chest: "", length: "", shoulder: "", sleeve: "", unit: "inch", note: "" }
  );
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const Field = ({ k, label }) => (
    <div>
      <label htmlFor={`cs-${k}`} className="mb-0.5 block text-[11px] font-semibold text-ink/60">{label}</label>
      <input id={`cs-${k}`} type="number" min="1" step="0.5" value={v[k]} onChange={set(k)}
        className="w-full rounded-lg border border-ink/10 px-2.5 py-2 text-sm shadow-sm outline-none focus:border-plum" />
    </div>
  );
  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-sheet w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true"
        aria-label="Custom size" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Custom size · कस्टम साइज़</h3>
          <button onClick={onClose} aria-label="Close custom size" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10">
            <Icon d={icons.x} className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field k="chest" label="Chest width · छाती" />
          <Field k="length" label="Length · लांबी" />
          <Field k="shoulder" label="Shoulder · खांदा" />
          <Field k="sleeve" label="Sleeve · बाही" />
        </div>
        <p className="mb-1 mt-3 text-[11px] font-semibold text-ink/60">Unit</p>
        <div className="flex gap-2">
          {["inch", "cm"].map((u) => (
            <button key={u} onClick={() => setV((s) => ({ ...s, unit: u }))} aria-pressed={v.unit === u}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                v.unit === u ? "border-plum bg-plum text-white" : "border-ink/15 text-ink/60"
              }`}>
              {u}
            </button>
          ))}
        </div>
        <label htmlFor="cs-note" className="mb-0.5 mt-3 block text-[11px] font-semibold text-ink/60">Note (optional)</label>
        <input id="cs-note" type="text" maxLength={80} value={v.note} onChange={set("note")}
          placeholder="e.g. loose fit, round neck…"
          className="w-full rounded-lg border border-ink/10 px-2.5 py-2 text-sm shadow-sm outline-none focus:border-plum" />
        <button
          onClick={() => { if (v.chest && v.length) { onSave(v); onClose(); } }}
          disabled={!v.chest || !v.length}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-40">
          Save custom size
        </button>
        <p className="mt-2 text-center text-[10px] text-ink/45">Chest & length required. Our team confirms measurements on WhatsApp before printing.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR — VARIANTS PANEL (right side)
   ═══════════════════════════════════════════════════════════════ */
function VariantsPanel({
  product, onChangeProduct, color, setColor, size, setSize, qty, setQty,
  placement, onPlacement, customSize, onCustomSize,
  layersPanelProps, onAddToCart, onClose, mobile,
}) {
  const [showCombos, setShowCombos] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  const colorObj = PRODUCT_COLORS.find((c) => c.id === color);

  const body = (
    <>
      {/* product switcher */}
      <label htmlFor="variant-product" className="mb-1 block text-xs font-semibold text-ink/60">Product</label>
      <select id="variant-product" value={product.id} onChange={(e) => onChangeProduct(e.target.value)}
        className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm font-semibold shadow-sm outline-none focus:border-plum">
        {EDITOR_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl bg-ink/4 p-3 text-[11px]">
        <dt className="text-ink/45">Print partner</dt><dd className="text-right font-semibold text-ink/75">{CONFIG.printPartner.split("·")[0]}</dd>
        <dt className="text-ink/45">Production cost</dt><dd className="text-right font-semibold text-ink/75">{inr(product.cost)}</dd>
        <dt className="text-ink/45">Selling price</dt><dd className="text-right font-bold text-plum">{inr(product.price)}</dd>
        <dt className="text-ink/45">Print area</dt><dd className="text-right font-semibold text-ink/75">{product.printArea}</dd>
        <dt className="text-ink/45">Print quality</dt><dd className="text-right font-semibold text-ink/75">300 DPI</dd>
        <dt className="text-ink/45">Delivery · डिलिव्हरी</dt><dd className="text-right font-semibold text-emerald-600">2–4 days 🚚</dd>
      </dl>

      {/* size */}
      <div className="mb-1.5 mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink/60">Size · साइज़</p>
        {product.apparel && (
          <button onClick={() => setShowSizeChart(true)}
            className="text-[11px] font-bold text-plum underline-offset-2 hover:underline">
            📏 Size chart
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {product.sizes.map((s) => (
          <button key={s} onClick={() => { setSize(s); onCustomSize?.(null); }} aria-pressed={!customSize && size === s}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              !customSize && size === s ? "border-plum bg-plum text-white" : "border-ink/15 bg-white text-ink/60 hover:border-plum/50"
            }`}>
            {s}
          </button>
        ))}
        {product.apparel && (
          <button onClick={() => setShowCustomSize(true)} aria-pressed={!!customSize}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              customSize ? "border-tangerine bg-tangerine text-white" : "border-dashed border-ink/25 bg-white text-ink/60 hover:border-tangerine/60"
            }`}>
            {customSize ? "Custom ✓" : "+ Custom size"}
          </button>
        )}
      </div>
      {customSize && (
        <p className="mt-1.5 text-[10.5px] font-medium text-ink/55">
          📐 Chest {customSize.chest}{customSize.unit} · Length {customSize.length}{customSize.unit}
          {customSize.shoulder ? ` · Shoulder ${customSize.shoulder}${customSize.unit}` : ""}
          {customSize.sleeve ? ` · Sleeve ${customSize.sleeve}${customSize.unit}` : ""}
        </p>
      )}

      {/* colour */}
      <p className="mb-1.5 mt-4 text-xs font-semibold text-ink/60">Colour · {colorObj.label}</p>
      <div className="flex gap-2">
        {PRODUCT_COLORS.map((c) => (
          <button key={c.id} onClick={() => setColor(c.id)} aria-label={`Colour ${c.label}`} aria-pressed={color === c.id}
            className={`h-8 w-8 rounded-full border-2 transition ${color === c.id ? "border-plum ring-2 ring-plum/30" : "border-ink/15"}`}
            style={{ background: c.hex }} />
        ))}
      </div>

      {/* print placement */}
      {product.apparel && (
        <>
          <p className="mb-1.5 mt-4 text-xs font-semibold text-ink/60">Print placement · प्रिंट जागा</p>
          <div className="flex flex-wrap gap-1.5">
            {PLACEMENTS.map((p) => (
              <button key={p.id} onClick={() => onPlacement(p)} aria-pressed={placement === p.id}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  placement === p.id ? "border-plum bg-plum text-white" : "border-ink/15 bg-white text-ink/60 hover:border-plum/50"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-ink/4 px-2.5 py-2 text-[10.5px] leading-relaxed text-ink/55">
            Edge-to-edge / oversized print available on request. Final alignment confirmed on WhatsApp before printing.
          </p>
        </>
      )}

      {/* quantity */}
      <p className="mb-1.5 mt-4 text-xs font-semibold text-ink/60">Quantity · नग</p>
      <div className="inline-flex items-center rounded-xl border border-ink/10 bg-white shadow-sm">
        <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="px-3.5 py-2 text-lg font-bold text-ink/60 hover:text-plum">−</button>
        <span className="min-w-9 text-center text-sm font-bold" aria-live="polite">{qty}</span>
        <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity" className="px-3.5 py-2 text-lg font-bold text-ink/60 hover:text-plum">+</button>
      </div>

      {/* variants matrix */}
      <button onClick={() => setShowCombos(!showCombos)}
        className="mt-4 w-full rounded-xl border border-plum/30 bg-plum/5 px-3 py-2.5 text-xs font-bold text-plum transition hover:bg-plum/10">
        Select variants {showCombos ? "▲" : "▼"}
      </button>
      {showCombos && (
        <div className="mt-2 grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-ink/8 p-2 scroll-thin">
          {product.sizes.flatMap((s) =>
            PRODUCT_COLORS.map((c) => (
              <button key={`${s}-${c.id}`} onClick={() => { setSize(s); setColor(c.id); setShowCombos(false); }}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition ${
                  size === s && color === c.id ? "bg-plum/10 text-plum" : "text-ink/60 hover:bg-ink/5"
                }`}>
                <span className="h-3.5 w-3.5 rounded-full border border-ink/15" style={{ background: c.hex }} />
                {product.name} · {s} · {c.label}
              </button>
            ))
          )}
        </div>
      )}

      <div className="my-5 border-t border-ink/8" />
      <LayersPanel {...layersPanelProps} colorLabel={colorObj.label} />

      <button onClick={onAddToCart}
        className="mt-5 w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5">
        Add to Cart — {inr(product.price * qty)}
      </button>

      {/* Indian payment options */}
      <div className="mt-3 grid gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-relaxed text-ink/70">
        <p className="font-bold text-emerald-700">Payment options · पेमेंट</p>
        <p>✅ UPI — GPay / PhonePe / Paytm ({CONFIG.upiId})</p>
        <p>📦 Cash on Delivery — available on request</p>
        <p>💬 Every order is confirmed on WhatsApp before printing</p>
      </div>

      {showSizeChart && <SizeChartModal onClose={() => setShowSizeChart(false)} oversized={product.id === "oversized"} kids={!!product.kids} />}
      {showCustomSize && (
        <CustomSizeModal initial={customSize} onSave={(v) => onCustomSize?.(v)} onClose={() => setShowCustomSize(false)} />
      )}
    </>
  );

  if (mobile)
    return (
      <div className="animate-sheet fixed inset-x-0 bottom-0 z-40 max-h-[78vh] overflow-y-auto rounded-t-2xl border border-ink/10 bg-white p-4 pb-6 shadow-2xl scroll-thin lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Variants & Layers</h3>
          <button onClick={onClose} aria-label="Close variants" className="grid h-7 w-7 place-items-center rounded-full bg-ink/5 text-ink/60">
            <Icon d={icons.x} className="h-3.5 w-3.5" />
          </button>
        </div>
        {body}
      </div>
    );

  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-ink/10 bg-white p-4 scroll-thin lg:block" aria-label="Variants and layers">
      <h3 className="mb-3 font-display text-lg font-bold text-ink">Variants & Layers</h3>
      {body}
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDITOR — PREVIEW MODE (realistic, 3D tilt)
   ═══════════════════════════════════════════════════════════════ */
function PreviewMode({ product, colorHex, colorId, dark, side, layers, bgVisible, view, failedMockups, onPhotoError, areaOverride }) {
  const cardRef = useRef(null);
  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
  };
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = "rotateY(0) rotateX(0)"; };

  return (
    <div className="soft-gradient flex flex-1 items-center justify-center overflow-auto p-6">
      <div className="[perspective:1100px]" onMouseMove={onMove} onMouseLeave={onLeave}>
        <div ref={cardRef}
          className="glass relative rounded-3xl p-6 shadow-[0_36px_70px_-18px_rgba(27,20,48,0.35)] transition-transform duration-200 ease-out will-change-transform sm:p-10">
          <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            ✦ Final print preview
          </span>
          <div className="aspect-[42/50] h-[60vh] max-h-[560px]">
            <CanvasMockup product={product} colorHex={colorHex} colorId={colorId} dark={dark} side={side}
              view={view} failedMockups={failedMockups} onPhotoError={onPhotoError}
              areaOverride={areaOverride} layers={layers} bgVisible={bgVisible} />
          </div>
          <p className="mt-2 text-center text-xs font-medium text-ink/50">
            {product.name} · {side === "front" ? "Front" : side === "back" ? "Back" : "Neck label"} · move your mouse to tilt
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT EDITOR — full-screen Printify-style editor
   ═══════════════════════════════════════════════════════════════ */
const EMPTY_DESIGNS = { front: [], back: [], label: [] };

function ProductEditor({ initialProductId, onClose, onAddToCart, onOpenCart, cartCount, showToast }) {
  const [productId, setProductId] = useState(initialProductId);
  const product = EDITOR_PRODUCTS.find((p) => p.id === productId) ?? EDITOR_PRODUCTS[0];
  const [color, setColor] = useState("white");
  const [size, setSize] = useState(EDITOR_PRODUCTS.find((p) => p.id === initialProductId)?.sizes[1] ?? "M");
  const [qty, setQty] = useState(1);
  const [side, setSide] = useState("front");
  const [designs, setDesigns] = useState(EMPTY_DESIGNS);
  const [bgVisible, setBgVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState(null);
  const [mode, setMode] = useState("edit");
  const [zoom, setZoom] = useState(100);
  const [view, setView] = useState(() => {
    const p = EDITOR_PRODUCTS.find((x) => x.id === initialProductId);
    return p?.kids && p?.apparel ? "model" : p?.apparel ? "real" : "flat";
  });
  const [failedMockups, setFailedMockups] = useState(() => new Set());
  const onPhotoError = (s) => setFailedMockups((prev) => new Set(prev).add(s));
  const [placement, setPlacement] = useState("center");
  const [customSize, setCustomSize] = useState(null); // { chest, length, shoulder, sleeve, unit, note }
  const [tweaks, setTweaks] = useState({}); // per product|view|side|placement print-area adjustments
  const [showTweak, setShowTweak] = useState(false);
  const [showChartTab, setShowChartTab] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  /* Printify-style fit: the blank product fills ~82% of the canvas height,
     clamped to the available width on small screens */
  const canvasAreaRef = useRef(null);
  const [fit, setFit] = useState({ w: 462, h: 550 });
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const RATIO = 42 / 50; // mockup viewBox ratio
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      let h = r.height * 0.82;
      let w = h * RATIO;
      const maxW = r.width * 0.92;
      if (w > maxW) {
        w = maxW;
        h = w / RATIO;
      }
      setFit({ w: Math.round(w), h: Math.round(h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);
  const [showVariantsMobile, setShowVariantsMobile] = useState(false);
  const [history, setHistory] = useState({ past: [], future: [] });
  const gestureRef = useRef(null);
  const [library, setLibrary] = useState(() => load("drucka-library", []));

  useEffect(() => save("drucka-library", library), [library]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const colorObj = PRODUCT_COLORS.find((c) => c.id === color);
  const layers = designs[side];
  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  /* ── history helpers ── */
  const commit = (next) => {
    setHistory((h) => ({ past: [...h.past.slice(-49), designs], future: [] }));
    setDesigns(next);
  };
  const undo = () => {
    if (!history.past.length) return;
    const prev = history.past.at(-1);
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [designs, ...h.future] }));
    setDesigns(prev);
    setSelectedId(null);
  };
  const redo = () => {
    if (!history.future.length) return;
    const next = history.future[0];
    setHistory((h) => ({ past: [...h.past, designs], future: h.future.slice(1) }));
    setDesigns(next);
    setSelectedId(null);
  };
  /* live gestures (drag / slider) snapshot once, push on release */
  const beginGesture = () => { if (!gestureRef.current) gestureRef.current = designs; };
  const endGesture = () => {
    if (gestureRef.current) {
      const snap = gestureRef.current;
      gestureRef.current = null;
      setHistory((h) => ({ past: [...h.past.slice(-49), snap], future: [] }));
    }
  };

  /* ── layer ops ── */
  const setSideLayers = (fn, withHistory = true) => {
    const next = { ...designs, [side]: fn(designs[side]) };
    withHistory ? commit(next) : setDesigns(next);
  };
  const addImageLayer = (src, toLibrary) => {
    const layer = { id: uid(), type: "image", src, x: 50, y: 50, scale: 1, rotation: 0, visible: true };
    setSideLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    if (toLibrary && src.length < 400_000) setLibrary((lib) => [src, ...lib.filter((s) => s !== src)].slice(0, 12));
  };
  const addTextLayer = (props) => {
    const layer = { id: uid(), type: "text", x: 50, y: 45, scale: 1, rotation: 0, visible: true, ...props };
    setSideLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
  };
  const addLayers = (newLayers) =>
    setSideLayers((ls) => [...ls, ...newLayers.map((l) => ({ ...l, id: uid() }))]);
  const updateLayer = (id, patch, withHistory = false) =>
    setSideLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)), withHistory);
  const moveLayer = (id, x, y) => updateLayer(id, { x, y }, false);
  const deleteLayer = (id) => { setSideLayers((ls) => ls.filter((l) => l.id !== id)); if (selectedId === id) setSelectedId(null); };
  const toggleVisible = (id) => setSideLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  const moveLayerOrder = (idx, dir) =>
    setSideLayers((ls) => {
      const next = [...ls];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return ls;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  /* ── product / side switching ── */
  const changeProduct = (id) => {
    const p = EDITOR_PRODUCTS.find((x) => x.id === id);
    setProductId(id);
    if (!p.sizes.includes(size)) setSize(p.sizes[Math.min(1, p.sizes.length - 1)]);
    if (!p.apparel && side !== "front") setSide("front");
    setView(p.kids && p.apparel ? "model" : p.apparel ? "real" : "flat");
    setPlacement("center");
    setCustomSize(null);
    setSelectedId(null);
  };
  const sides = product.apparel
    ? [{ id: "front", label: "Front side" }, { id: "back", label: "Back side" }, { id: "label", label: "Neck label" }]
    : [{ id: "front", label: "Front side" }];

  /* ── effective print area: base (per view/side) → placement → manual tweak ── */
  const activePlacement =
    PLACEMENTS.find((p) => p.id === placement)?.side === side ? placement : "center";
  const baseArea = (() => {
    if (side === "label") return LABEL_AREA;
    if (view === "flat") return product.area;
    return PHOTO_AREAS[productId]?.[view]?.[side] ?? product.area;
  })();
  const placedArea = side === "label" ? baseArea : placementArea(activePlacement, baseArea);
  const tweakKey = `${productId}|${view}|${side}|${activePlacement}`;
  const tweak = tweaks[tweakKey];
  const finalArea = tweak
    ? clampArea({
        left: placedArea.left + tweak.dx,
        top: placedArea.top + tweak.dy,
        width: placedArea.width + tweak.dw,
        height: placedArea.height + tweak.dh,
      })
    : placedArea;
  const placementLabel = activePlacement !== "center" ? PLACEMENTS.find((p) => p.id === activePlacement)?.label : null;

  const pickPlacement = (p) => {
    if (p.side !== side) setSide(p.side);
    setPlacement(p.id);
    setSelectedId(null);
  };

  /* ── mockup view tabs (fix #6): view + side in one click ── */
  const viewTabs = product.apparel
    ? product.kids
      ? [
          { id: "kids-f", label: "Kids Front", view: "model", side: "front" },
          { id: "kids-b", label: "Kids Back", view: "model", side: "back" },
          { id: "flat-f", label: "Flat Front", view: "real", side: "front" },
          { id: "flat-b", label: "Flat Back", view: "real", side: "back" },
          { id: "chart", label: "📏 Kids Size Chart", chart: true },
        ]
      : [
          { id: "flat-f", label: "Flat Front", view: "real", side: "front" },
          { id: "flat-b", label: "Flat Back", view: "real", side: "back" },
          { id: "male-f", label: "Male Front", view: "model", side: "front" },
          { id: "male-b", label: "Male Back", view: "model", side: "back" },
          { id: "female-f", label: "Female Front", view: "model2", side: "front" },
          { id: "female-b", label: "Female Back", view: "model2", side: "back" },
          { id: "chart", label: "📏 Adult Size Chart", chart: true },
        ]
    : [
        { id: "flat-f", label: "👕 Flat", view: "flat", side: "front" },
        { id: "photo-f", label: "📷 Photo", view: "real", side: "front" },
      ];

  const pickTab = (t) => {
    if (t.chart) {
      setShowChartTab(true);
      return;
    }
    setView(t.view);
    setSide(t.side);
    setSelectedId(null);
    // switching tabs retries every photo a flaky load may have blacklisted
    setFailedMockups((prev) => (prev.size ? new Set() : prev));
  };

  /* ── pan ── */
  const onCanvasPointerDown = (e) => {
    if (!panMode) return;
    const start = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    const move = (ev) => setPanOffset({ x: start.ox + ev.clientX - start.x, y: start.oy + ev.clientY - start.y });
    const up = () => window.removeEventListener("pointermove", move);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  /* ── save / cart ── */
  const designedSides = Object.entries(designs).filter(([, ls]) => ls.length).map(([s]) => s);
  const saveProduct = () => {
    const saved = load("drucka-saved-products", []);
    save("drucka-saved-products", [
      { id: uid(), savedAt: Date.now(), productId, color, size, qty, designs, bgVisible, price: product.price },
      ...saved,
    ].slice(0, 10));
    showToast("Product saved successfully ✓");
  };
  const addToCart = () => {
    onAddToCart({
      key: uid(), productId, type: "custom",
      name: product.name, price: product.price, qty,
      size: customSize ? "Custom" : size, customSize, color, bgVisible,
      placement: activePlacement,
      design: designs,
      summary: designedSides.length ? `Design on: ${designedSides.join(", ")}` : "Blank product",
    });
    showToast(`${product.name} added to cart ✓`);
  };

  const toolPanelProps = {
    onClose: () => setTool(null),
    showToast,
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#f1f0f5]" role="dialog" aria-modal="true" aria-label="Product design editor">
      {/* ─── TOP BAR ─── */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-ink/10 bg-white px-3 sm:gap-3 sm:px-4">
        <button onClick={onClose} aria-label="Back to website" className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-ink/5 hover:text-ink">
          <Icon d={icons.back} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{product.name}</p>
          <p className="hidden text-[10px] text-ink/45 sm:block">{CONFIG.printPartner}</p>
        </div>

        <div className="mx-auto flex items-center gap-1">
          <button onClick={undo} disabled={!history.past.length} aria-label="Undo"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-ink/5 disabled:opacity-25">
            <Icon d={icons.undo} className="h-4.5 w-4.5" />
          </button>
          <button onClick={redo} disabled={!history.future.length} aria-label="Redo"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-ink/5 disabled:opacity-25">
            <Icon d={icons.redo} className="h-4.5 w-4.5" />
          </button>
          <div className="ml-1 flex rounded-full bg-ink/6 p-0.5" role="tablist" aria-label="Editor mode">
            {["edit", "preview"].map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setSelectedId(null); }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition sm:px-4 ${
                  mode === m ? "bg-white text-plum shadow" : "text-ink/55"
                }`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setShowVariantsMobile(true)} aria-label="Open variants panel"
          className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-ink/5 lg:hidden">
          <Icon d={icons.layers} className="h-4.5 w-4.5" />
        </button>
        <button onClick={saveProduct}
          className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-plum sm:flex">
          <Icon d={icons.save} className="h-3.5 w-3.5" /> Save product
        </button>
        <button onClick={saveProduct} aria-label="Save product" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white sm:hidden">
          <Icon d={icons.save} className="h-4 w-4" />
        </button>
        <button onClick={onOpenCart} aria-label={`Open cart, ${cartCount} items`}
          className="relative grid h-9 w-9 place-items-center rounded-full text-ink/60 transition hover:bg-ink/5">
          <Icon d={icons.cart} className="h-4.5 w-4.5" />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-tangerine px-1 text-[10px] font-bold text-white">{cartCount}</span>
          )}
        </button>
      </header>

      {/* ─── MAIN AREA ─── */}
      {mode === "preview" ? (
        <>
          <PreviewMode product={product} colorHex={colorObj.hex} colorId={color} dark={colorObj.dark} side={side}
            view={view} failedMockups={failedMockups} onPhotoError={onPhotoError}
            layers={layers} bgVisible={bgVisible} />
          {/* side switcher stays available in preview */}
          <div className="flex shrink-0 justify-center gap-2 border-t border-ink/10 bg-white px-3 py-2.5">
            {sides.map((s) => (
              <button key={s.id} onClick={() => setSide(s.id)} aria-pressed={side === s.id}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  side === s.id ? "bg-plum text-white shadow-md" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="relative flex flex-1 flex-col-reverse overflow-hidden lg:flex-row">
          <Toolbar tool={tool} setTool={setTool} />

          {tool === "upload" && <UploadPanel {...toolPanelProps} onAddImage={addImageLayer} />}
          {tool === "ai" && <AIDesignPanel {...toolPanelProps} onAddLayers={addLayers} />}
          {tool === "text" && (
            <TextPanel {...toolPanelProps} onAddText={addTextLayer} selectedLayer={selectedLayer}
              onUpdateLayer={updateLayer} onFieldFocus={beginGesture} onFieldBlur={endGesture} />
          )}
          {tool === "library" && (
            <LibraryPanel {...toolPanelProps} library={library} onAddImage={addImageLayer}
              onDeleteFromLibrary={(i) => setLibrary((lib) => lib.filter((_, j) => j !== i))} />
          )}
          {tool === "graphics" && <GraphicsPanel {...toolPanelProps} onAddImage={addImageLayer} />}
          {tool === "templates" && (
            <TemplatesPanel {...toolPanelProps} onApplyTemplate={(t) => { addLayers(t.layers); showToast(`Template "${t.name}" applied ✓`); }} />
          )}
          {tool === "help" && <HelpPanel {...toolPanelProps} />}

          {/* ─── CANVAS ─── */}
          <div
            ref={canvasAreaRef}
            className={`relative flex-1 overflow-hidden ${panMode ? "cursor-grab active:cursor-grabbing" : ""}`}
            onPointerDown={onCanvasPointerDown}
          >
            <div className="flex h-full items-center justify-center"
              style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
              <div style={{ width: fit.w, height: fit.h, transform: `scale(${zoom / 100})` }} className="shrink-0 transition-transform duration-200">
                <CanvasMockup
                  product={product} colorHex={colorObj.hex} colorId={color} dark={colorObj.dark} side={side}
                  view={view} failedMockups={failedMockups} onPhotoError={onPhotoError}
                  areaOverride={finalArea} placementLabel={placementLabel}
                  layers={layers} bgVisible={bgVisible} editing={!panMode}
                  selectedId={selectedId} onSelectLayer={setSelectedId} onMoveLayer={moveLayer}
                  onGestureStart={beginGesture} onGestureEnd={endGesture}
                />
              </div>
            </div>

            {/* selected layer controls */}
            {selectedLayer && (
              <div className="absolute bottom-[4.4rem] left-1/2 z-20 grid w-[min(92%,420px)] -translate-x-1/2 gap-2 rounded-2xl border border-ink/10 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur">
                <div className="flex items-center justify-center gap-1.5">
                  {[
                    ["←", -2, 0, "Move left"],
                    ["↑", 0, -2, "Move up"],
                    ["↓", 0, 2, "Move down"],
                    ["→", 2, 0, "Move right"],
                  ].map(([sym, dx, dy, lbl]) => (
                    <button key={lbl} aria-label={lbl} title={lbl}
                      onClick={() => updateLayer(selectedLayer.id, {
                        x: clamp(selectedLayer.x + dx, 0, 100),
                        y: clamp(selectedLayer.y + dy, 0, 100),
                      }, true)}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-ink/5 text-xs font-bold text-ink/65 transition hover:bg-plum hover:text-white">
                      {sym}
                    </button>
                  ))}
                  <span className="mx-1 h-5 w-px bg-ink/10" />
                  {[
                    ["Center", { x: 50, y: 50 }],
                    ["Fit", { x: 50, y: 50, scale: 1.5 }],
                    ["Fill", { x: 50, y: 50, scale: 2.4 }],
                    ["Reset", { x: 50, y: 50, scale: 1, rotation: 0 }],
                  ].map(([lbl, patch]) => (
                    <button key={lbl} title={`${lbl} in print area`}
                      onClick={() => updateLayer(selectedLayer.id, patch, true)}
                      className="rounded-lg bg-ink/5 px-2 py-1.5 text-[10px] font-bold text-ink/65 transition hover:bg-plum hover:text-white">
                      {lbl}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                <label className="flex flex-1 items-center gap-2 text-[10px] font-bold text-ink/50">
                  <Icon d={icons.image} className="h-3.5 w-3.5 shrink-0" />
                  <input type="range" min="0.2" max="2.5" step="0.01" value={selectedLayer.scale}
                    aria-label="Resize layer"
                    onPointerDown={beginGesture} onPointerUp={endGesture}
                    onChange={(e) => updateLayer(selectedLayer.id, { scale: +e.target.value })}
                    className="w-full accent-plum" />
                </label>
                <label className="flex flex-1 items-center gap-2 text-[10px] font-bold text-ink/50">
                  <Icon d={icons.rotate} className="h-3.5 w-3.5 shrink-0" />
                  <input type="range" min="-180" max="180" step="1" value={selectedLayer.rotation}
                    aria-label="Rotate layer"
                    onPointerDown={beginGesture} onPointerUp={endGesture}
                    onChange={(e) => updateLayer(selectedLayer.id, { rotation: +e.target.value })}
                    className="w-full accent-plum" />
                </label>
                <button onClick={() => deleteLayer(selectedLayer.id)} aria-label="Delete selected layer"
                  className="text-ink/40 transition hover:text-rose-500">
                  <Icon d={icons.trash} className="h-4 w-4" />
                </button>
                </div>
              </div>
            )}

            {/* mockup view tabs */}
            <div className="absolute left-3 right-14 top-3 z-20">
              <div className="flex max-w-fit gap-1 overflow-x-auto rounded-xl border border-ink/10 bg-white/95 p-1 shadow-lg backdrop-blur scroll-thin" role="tablist" aria-label="Mockup view">
                {viewTabs.map((t) => {
                  const active = !t.chart && t.view === view && t.side === side;
                  return (
                    <button key={t.id} role="tab" aria-selected={active} onClick={() => pickTab(t)}
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                        active ? "bg-plum text-white shadow" : "text-ink/55 hover:bg-ink/5"
                      }`}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              {view !== "flat" && side === "label" && (
                <p className="mt-1.5 max-w-[230px] rounded-lg bg-white/90 px-2 py-1.5 text-[10px] font-medium leading-snug text-ink/55 shadow backdrop-blur">
                  Flat view used for the neck label.
                </p>
              )}
              {view !== "flat" && side !== "label" && (() => {
                const cands = getMockupAsset(productId, color, view, side);
                if (!cands.every((c) => failedMockups.has(c))) return null;
                return (
                  <p className="mt-1.5 max-w-[260px] rounded-lg bg-amber-50/95 px-2 py-1.5 text-[10px] font-medium leading-snug text-amber-800 shadow backdrop-blur">
                    Photo not found — add <code className="font-bold">public/mockups/{cands[0].split("/").pop()}</code> to enable this view.
                  </p>
                );
              })()}
            </div>

            {/* hint when layers exist but none is selected */}
            {!selectedLayer && layers.length > 0 && (
              <div className="pointer-events-none absolute bottom-[4.4rem] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/75 px-4 py-2 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
                Select a design layer to move or resize · डिझाईन layer निवडा
              </div>
            )}

            {/* zoom + pan controls */}
            <div className="absolute right-3 top-3 z-20 flex flex-col gap-1 rounded-xl border border-ink/10 bg-white/95 p-1 shadow-lg backdrop-blur">
              {[25, 50, 75, 100].map((z) => (
                <button key={z} onClick={() => { setZoom(z); setPanOffset({ x: 0, y: 0 }); }} aria-pressed={zoom === z}
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                    zoom === z ? "bg-plum text-white" : "text-ink/55 hover:bg-ink/5"
                  }`}>
                  {z}%
                </button>
              ))}
              <button onClick={() => setPanMode(!panMode)} aria-pressed={panMode} aria-label="Pan tool"
                className={`grid place-items-center rounded-lg px-2 py-1.5 transition ${
                  panMode ? "bg-plum text-white" : "text-ink/55 hover:bg-ink/5"
                }`}>
                <Icon d={icons.hand} className="h-4 w-4" />
              </button>
              <button onClick={() => setShowTweak(!showTweak)} aria-pressed={showTweak} aria-label="Adjust print area"
                className={`grid place-items-center rounded-lg px-2 py-1.5 text-xs transition ${
                  showTweak ? "bg-plum text-white" : "text-ink/55 hover:bg-ink/5"
                }`}>
                ⚙
              </button>
            </div>

            {/* manual print-area adjustment (admin / per-mockup fine-tuning) */}
            {showTweak && side !== "label" && (
              <div className="absolute right-14 top-3 z-20 w-60 rounded-2xl border border-ink/10 bg-white/95 p-3 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-ink">Adjust print area</p>
                  <button
                    onClick={() => setTweaks((t) => { const n = { ...t }; delete n[tweakKey]; return n; })}
                    className="rounded-full bg-ink/5 px-2.5 py-1 text-[10px] font-bold text-ink/60 transition hover:bg-ink/10">
                    Reset
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[9px] text-ink/40">{tweakKey}</p>
                {[
                  ["dx", "Move X"],
                  ["dy", "Move Y"],
                  ["dw", "Width"],
                  ["dh", "Height"],
                ].map(([k, lbl]) => (
                  <label key={k} className="mt-2 block text-[10px] font-semibold text-ink/55">
                    <span className="flex justify-between">
                      <span>{lbl}</span>
                      <span>{(tweak?.[k] ?? 0) > 0 ? "+" : ""}{(tweak?.[k] ?? 0).toFixed(1)}%</span>
                    </span>
                    <input type="range" min="-20" max="20" step="0.5" value={tweak?.[k] ?? 0}
                      onChange={(e) =>
                        setTweaks((t) => ({
                          ...t,
                          [tweakKey]: { dx: 0, dy: 0, dw: 0, dh: 0, ...t[tweakKey], [k]: +e.target.value },
                        }))
                      }
                      className="w-full accent-plum" />
                  </label>
                ))}
                <p className="mt-2 text-[9.5px] leading-snug text-ink/40">
                  Saved per mockup view — use this to fine-tune the dashed area for each body shape.
                </p>
              </div>
            )}

            {/* side switcher */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full border border-ink/10 bg-white/95 p-1 shadow-lg backdrop-blur">
              {sides.map((s) => (
                <button key={s.id} onClick={() => { setSide(s.id); setSelectedId(null); }} aria-pressed={side === s.id}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-bold transition sm:px-4 sm:text-xs ${
                    side === s.id ? "bg-plum text-white shadow" : "text-ink/55 hover:bg-ink/5"
                  }`}>
                  {s.label}
                  {designs[s.id]?.length > 0 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-tangerine align-middle" />}
                </button>
              ))}
            </div>
          </div>

          <VariantsPanel
            product={product} onChangeProduct={changeProduct}
            color={color} setColor={setColor} size={size} setSize={setSize} qty={qty} setQty={setQty}
            placement={placement} onPlacement={pickPlacement}
            customSize={customSize} onCustomSize={setCustomSize}
            onAddToCart={addToCart}
            layersPanelProps={{
              layers, selectedId, onSelectLayer: setSelectedId, onToggleVisible: toggleVisible,
              onDeleteLayer: deleteLayer, onMoveLayerOrder: moveLayerOrder,
              bgVisible, onToggleBg: () => setBgVisible(!bgVisible),
            }}
          />
          {showVariantsMobile && (
            <>
              <div className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setShowVariantsMobile(false)} aria-hidden="true" />
              <VariantsPanel
                mobile onClose={() => setShowVariantsMobile(false)}
                product={product} onChangeProduct={changeProduct}
                color={color} setColor={setColor} size={size} setSize={setSize} qty={qty} setQty={setQty}
                placement={placement} onPlacement={pickPlacement}
                customSize={customSize} onCustomSize={setCustomSize}
                onAddToCart={() => { addToCart(); setShowVariantsMobile(false); }}
                layersPanelProps={{
                  layers, selectedId, onSelectLayer: setSelectedId, onToggleVisible: toggleVisible,
                  onDeleteLayer: deleteLayer, onMoveLayerOrder: moveLayerOrder,
                  bgVisible, onToggleBg: () => setBgVisible(!bgVisible),
                }}
              />
            </>
          )}
        </div>
      )}
      {showChartTab && (
        <SizeChartModal
          onClose={() => setShowChartTab(false)}
          oversized={productId === "oversized"}
          kids={!!product.kids}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP CHATBOT — popup with instant rule-based replies
   ═══════════════════════════════════════════════════════════════ */
const QUICK_REPLIES = [
  { id: "customize", label: "Customize T-shirt", reply: "Great! Upload your design, choose size and color, then click Order on WhatsApp. Our team will confirm print quality before printing." },
  { id: "bulk", label: "Bulk order", form: true, reply: "For bulk orders above 10 pieces, we offer special pricing. Share quantity, product type and design on WhatsApp." },
  { id: "track", label: "Track order", reply: "Please share your order name or WhatsApp number. Our team will check and update you." },
  { id: "price", label: "Price list", reply: "T-shirt from ₹599, Mug from ₹299, Frame from ₹899, Cushion from ₹649, Canvas from ₹999, Keychain from ₹149." },
  { id: "human", label: "Talk to human", human: true },
];

function WhatsAppChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 Welcome to Drucka! How can we help you?" },
  ]);
  const [typing, setTyping] = useState(false);
  const [bulkForm, setBulkForm] = useState(false);
  const [bulk, setBulk] = useState({ product: EDITOR_PRODUCTS[0].name, qty: 20, note: "" });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open, bulkForm]);

  const pick = (qr) => {
    setMessages((m) => [...m, { from: "user", text: qr.label }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (qr.human) {
        setMessages((m) => [...m, { from: "bot", text: "Connecting you to our team on WhatsApp… 💬" }]);
        window.open(wa("Hi Drucka, I need help with custom printing"), "_blank", "noopener");
      } else {
        setMessages((m) => [...m, { from: "bot", text: qr.reply }]);
        if (qr.form) setBulkForm(true);
      }
    }, 750);
  };

  const sendBulkEnquiry = () => {
    window.open(
      wa(`Bulk order enquiry 📦\nProduct: ${bulk.product}\nQuantity: ${bulk.qty} pieces\nDetails: ${bulk.note || "—"}\nPlease share bulk pricing.`),
      "_blank", "noopener"
    );
    setBulkForm(false);
    setMessages((m) => [...m, { from: "bot", text: "Enquiry sent! Our team will reply with bulk pricing shortly. ✓" }]);
  };

  return (
    <>
      {/* floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Chat with Drucka"}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[80] grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_12px_32px_rgba(16,185,129,0.45)] transition hover:scale-110"
      >
        <Icon d={open ? icons.x : icons.whatsapp} filled={!open} className="h-7 w-7" />
        {!open && <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-tangerine" />}
      </button>

      {/* popup */}
      {open && (
        <div className="animate-sheet fixed bottom-22 right-4 z-[80] flex max-h-[70vh] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-2xl"
          role="dialog" aria-label="Drucka chat assistant">
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 font-display text-lg font-bold">D</span>
            <div>
              <p className="text-sm font-bold">Drucka Assistant</p>
              <p className="text-[11px] text-emerald-100">● Online · replies instantly</p>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#f4f1ec] px-3 py-3.5 scroll-thin" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                  m.from === "user" ? "rounded-br-md bg-plum text-white" : "rounded-bl-md bg-white text-ink/80"
                }`}>
                  {m.text}
                </p>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" />
                </span>
              </div>
            )}
            {bulkForm && !typing && (
              <div className="rounded-2xl rounded-bl-md bg-white p-3 shadow-sm">
                <p className="text-xs font-bold text-ink">Bulk enquiry · बल्क ऑर्डर</p>
                <label htmlFor="bulk-product" className="mt-2 block text-[10px] font-semibold text-ink/50">Product</label>
                <select id="bulk-product" value={bulk.product} onChange={(e) => setBulk((b) => ({ ...b, product: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-ink/10 px-2 py-1.5 text-xs outline-none focus:border-plum">
                  {EDITOR_PRODUCTS.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <label htmlFor="bulk-qty" className="mt-2 block text-[10px] font-semibold text-ink/50">Quantity (10+)</label>
                <input id="bulk-qty" type="number" min="10" value={bulk.qty}
                  onChange={(e) => setBulk((b) => ({ ...b, qty: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-ink/10 px-2 py-1.5 text-xs outline-none focus:border-plum" />
                <label htmlFor="bulk-note" className="mt-2 block text-[10px] font-semibold text-ink/50">Details (optional)</label>
                <input id="bulk-note" type="text" maxLength={80} value={bulk.note} placeholder="College fest, corporate gifting…"
                  onChange={(e) => setBulk((b) => ({ ...b, note: e.target.value }))}
                  className="mt-0.5 w-full rounded-lg border border-ink/10 px-2 py-1.5 text-xs outline-none focus:border-plum" />
                <div className="mt-2.5 flex gap-2">
                  <button onClick={sendBulkEnquiry}
                    className="flex-1 rounded-full bg-emerald-500 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-600">
                    Send enquiry on WhatsApp
                  </button>
                  <button onClick={() => setBulkForm(false)} aria-label="Dismiss bulk enquiry form"
                    className="rounded-full bg-ink/5 px-3 py-2 text-[11px] font-semibold text-ink/55 hover:bg-ink/10">
                    Later
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-ink/8 bg-white px-3 py-3">
            {QUICK_REPLIES.map((qr) => (
              <button key={qr.id} onClick={() => pick(qr)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  qr.human
                    ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                    : "border-plum/30 text-plum hover:bg-plum/5"
                }`}>
                {qr.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — header, hero, products, studio CTA, etc.
   ═══════════════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#products", label: "Products" },
  { action: "collage", label: "Collage Maker" },
  { href: "#how", label: "How it Works" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

function Header({ cartCount, onCartOpen, onCollage }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 glass shadow-[0_4px_24px_rgba(27,20,48,0.06)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <a href="#home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-plum to-tangerine font-display text-lg font-bold text-white shadow-md">D</span>
          <span className="font-display text-2xl font-bold tracking-tight text-ink">Drucka</span>
        </a>
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              {l.action ? (
                <button onClick={onCollage} className="text-sm font-medium text-ink/70 transition hover:text-plum">{l.label}</button>
              ) : (
                <a href={l.href} className="text-sm font-medium text-ink/70 transition hover:text-plum">{l.label}</a>
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href={wa("Hi Drucka! I'd like to place a custom printing order.")} target="_blank" rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 sm:flex">
            <Icon d={icons.whatsapp} filled className="h-4 w-4" /> WhatsApp Order
          </a>
          <button onClick={onCartOpen} className="relative grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink shadow-md transition hover:bg-white"
            aria-label={`Open cart, ${cartCount} items`}>
            <Icon d={icons.cart} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-tangerine px-1 text-[11px] font-bold text-white">{cartCount}</span>
            )}
          </button>
          <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink shadow-md lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            <Icon d={open ? icons.x : icons.menu} />
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-white/60 px-4 pb-4 lg:hidden">
          <ul className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                {l.action ? (
                  <button onClick={() => { setOpen(false); onCollage(); }}
                    className="block w-full rounded-xl px-3 py-2.5 text-left font-medium text-ink/80 transition hover:bg-plum/5 hover:text-plum">
                    {l.label}
                  </button>
                ) : (
                  <a href={l.href} onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2.5 font-medium text-ink/80 transition hover:bg-plum/5 hover:text-plum">
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

const TRUST_BADGES = [
  { icon: icons.truck, label: "2–4 Days Delivery" },
  { icon: icons.spark, label: "Premium Print Quality" },
  { icon: icons.shield, label: "Secure UPI Checkout" },
  { icon: icons.whatsapp, label: "WhatsApp Support" },
];

function FloatCard({ img, title, price, className, style }) {
  return (
    <div className={`glass overflow-hidden rounded-3xl shadow-[0_24px_48px_-12px_rgba(27,20,48,0.25)] transition-transform duration-500 [transform-style:preserve-3d] hover:[transform:rotateY(0deg)_rotateX(0deg)_scale(1.03)] ${className}`} style={style}>
      <img src={img} alt={title} className="aspect-[4/5] w-full object-cover" loading="eager" />
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="rounded-full bg-plum/10 px-2.5 py-0.5 text-xs font-bold text-plum">{price}</span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="home" className="soft-gradient scroll-mt-16 overflow-hidden pb-16 pt-28 sm:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <div>
          <span className="anim-fade inline-flex items-center gap-2 rounded-full border border-plum/15 bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-plum">
            <Icon d={icons.spark} filled className="h-3.5 w-3.5" /> PREMIUM CUSTOM PRINTING STUDIO · INDIA
          </span>
          <h1 className="anim-rise mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
            style={{ "--d": ".15s" }}>
            Print it.<br />Gift it.{" "}
            <span className="bg-gradient-to-r from-plum via-tangerine to-blush bg-clip-text text-transparent">Feel it.</span>
          </h1>
          <p className="anim-fade mt-5 max-w-xl text-lg leading-relaxed text-ink/65" style={{ "--d": ".38s" }}>
            Upload your photo or design and turn it into premium T-shirts, mugs, frames, cushions,
            canvas and personalized keychains — printed beautifully, delivered fast.
          </p>
          <div className="anim-pop mt-8 flex flex-wrap gap-3" style={{ "--d": ".55s" }}>
            <a href="#products"
              className="btn-shine group rounded-full bg-gradient-to-r from-plum to-plum-soft px-7 py-3.5 font-semibold text-white shadow-lg shadow-plum/30 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-plum/40">
              Browse Products{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </a>
          </div>
          <ul className="mt-10 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {TRUST_BADGES.map((b, i) => (
              <li key={b.label} style={{ "--d": `${0.65 + i * 0.09}s` }}
                className="anim-rise group glass flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="trust-icon grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-plum/10 to-tangerine/10 text-plum">
                  <Icon d={b.icon} className="h-4.5 w-4.5" />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-ink/75">{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="anim-slide-right relative mx-auto w-full max-w-xl" style={{ "--d": ".3s" }}>
          <img src="/images/hero-lifestyle.jpg" alt="Custom printed T-shirt by Drucka, worn on a road trip in India"
            fetchpriority="high"
            className="animate-float-soft w-full rounded-[2rem] border border-white/60 object-cover shadow-[0_34px_80px_rgba(27,20,48,0.28)]" />
          <div className="badge-pop-float glass absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
            style={{ "--d": ".95s" }}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-plum to-tangerine text-white">
              <Icon d={icons.spark} filled className="h-4.5 w-4.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-ink">Your design, printed</span>
              <span className="block text-xs text-ink/55">Custom tees from ₹349 · 2–4 days</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Shop-by-category showcase — real model mockups (mix 11 shoot) ── */
const SHOWCASE_CATEGORIES = [
  { id: "men-tshirt", label: "Men T-Shirts", sub: "Classic crew · 180 GSM", img: "/images/categories/men-tshirt.jpg", productId: "tshirt" },
  { id: "men-polo", label: "Men Polos", sub: "Smart casual staple", img: "/images/categories/men-polo.jpg", productId: "tshirt" },
  { id: "hoodie", label: "Hoodies", sub: "Cozy 320 GSM fleece", img: "/images/categories/hoodie-2.jpg", productId: "hoodie" },
  { id: "oversized", label: "Oversized Tees", sub: "Streetwear black drop", img: "/images/categories/oversized-black-tee.jpg", productId: "tshirt" },
  { id: "women-tshirt", label: "Women T-Shirts", sub: "Feminine relaxed fit", img: "/images/categories/women-tshirt.jpg", productId: "tshirt-women" },
  { id: "women-crop", label: "Women Crop Tops", sub: "Trend-ready cut", img: "/images/categories/women-crop-top.jpg", productId: "tshirt-women" },
  { id: "kids-tshirt", label: "Kids T-Shirts", sub: "Soft & skin friendly", img: "/images/categories/kids-tshirt.jpg", productId: "kids-tshirt" },
  { id: "girls-tshirt", label: "Girls T-Shirts", sub: "2–14 years", img: "/images/categories/girls-tshirt.jpg", productId: "kids-tshirt" },
  { id: "kids-jacket", label: "Kids Jackets & Hoodies", sub: "Warm everyday layers", img: "/images/categories/kids-jacket.jpg", productId: "kids-hoodie" },
];

function CategoryShowcase({ onCustomize }) {
  return (
    <section id="categories" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-16 sm:px-6 lg:px-8">
      <div className="reveal mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Shop by category</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Pick your canvas</h2>
        <p className="mx-auto mt-2 max-w-xl text-ink/55">Every piece is printed on demand with your design — choose a style to start customizing.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {SHOWCASE_CATEGORIES.map((c, i) => (
          <button key={c.id} onClick={() => onCustomize(c.productId)}
            style={{ "--rd": `${(i % 3) * 90}ms` }}
            className="reveal-stagger group relative overflow-hidden rounded-3xl border border-ink/5 bg-white text-left shadow-[0_8px_30px_rgba(27,20,48,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(91,33,182,0.14)]">
            <img src={c.img} alt={c.label} loading="lazy"
              className="aspect-[4/5] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.07]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent p-4 pt-12 sm:p-5">
              <h3 className="font-display text-lg font-bold text-white sm:text-xl">{c.label}</h3>
              <p className="text-xs text-white/75">{c.sub}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur transition duration-300 group-hover:gap-2 group-hover:bg-tangerine group-hover:pr-2.5">
                Customize
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Featured: Photo Prints & Custom Frames ──────────────────────
   Premium promo block — two category cards (Photo Prints + Custom
   Frames) with selectable options that flow into a prefilled WhatsApp
   order. CSS-only frame mockups (no image assets needed). */

const PRINT_TYPES = ["Glossy Photo Print", "Matte Photo Print", "Passport Size Photo", "Poster Print", "Canvas Style Print"];
const PRINT_SIZES = ["4x6", "5x7", "6x8", "8x10", "12x18", "A4", "A3"];

const FRAME_STYLES = [
  { id: "classic-black",      name: "Classic Black",       mat: "linear-gradient(135deg,#3a3a3a,#0c0c0c)", accent: null },
  { id: "premium-golden",     name: "Premium Golden",      mat: "linear-gradient(135deg,#f6e09a,#caa033 48%,#8c5f17)", accent: "#f2d98c" },
  { id: "wooden-brown",       name: "Wooden Brown",        mat: "linear-gradient(135deg,#a06f40,#5d3819)", accent: null },
  { id: "white-minimal",      name: "White Minimal",       mat: "linear-gradient(135deg,#ffffff,#e7e7ea)", accent: null, light: true },
  { id: "designer-black-gold",name: "Designer Black Gold", mat: "linear-gradient(135deg,#1c1c1c,#000)", accent: "#d4af37" },
  { id: "traditional-ornate", name: "Traditional Ornate",  mat: "linear-gradient(135deg,#d8b358,#7a5414)", accent: "#f0d98f" },
];

const FRAME_OPTIONS = ["Black Frame", "White Frame", "Wooden Frame", "Golden Frame", "Premium Designer Frame", "Ornate Traditional Frame"];
const FRAME_STEPS = ["Upload Photo", "Select Print Size", "Choose Frame", "Confirm on WhatsApp"];

function FrameMock({ frame, big }) {
  return (
    <div className="overflow-hidden transition-transform duration-300"
      style={{ background: frame.mat, padding: big ? "7%" : "10%", borderRadius: 5,
        boxShadow: big ? "0 14px 34px rgba(0,0,0,.22)" : "0 5px 16px rgba(0,0,0,.18)" }}>
      <div className="bg-white" style={{ padding: "8%", boxShadow: frame.accent ? `inset 0 0 0 ${big ? 3 : 2}px ${frame.accent}` : "none" }}>
        <div className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br from-plum/20 via-blush/20 to-tangerine/15">
          <Icon d={icons.image} className={`text-ink/25 ${big ? "h-8 w-8" : "h-5 w-5"}`} />
        </div>
      </div>
    </div>
  );
}

function PhotoFramesSection({ onCustomize }) {
  const [printType, setPrintType] = useState(null);
  const [printSize, setPrintSize] = useState(null);
  const [frame, setFrame] = useState(FRAME_STYLES[1]); // Premium Golden featured
  const [frameSize, setFrameSize] = useState(null);

  const printMsg = wa(
    `Hi, I want to order a Photo Print.${printType ? ` Type: ${printType}.` : ""}${printSize ? ` Size: ${printSize}.` : ""} I will share photo and size details.`
  );
  const frameMsg = wa(
    `Hi, I want to order a Custom Frame.${frame ? ` Frame: ${frame.name}.` : ""}${frameSize ? ` Print size: ${frameSize}.` : ""} I will share my photo and details.`
  );

  return (
    <section id="photo-frames" className="scroll-mt-16 bg-gradient-to-b from-white via-cream/60 to-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="reveal mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            <Icon d={icons.spark} filled className="h-3.5 w-3.5" /> Featured Studio Service
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Photo Prints <span className="text-amber-600">&amp;</span> Custom Frames
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">
            Upload your photo, choose print size, select frame style, and get a ready-to-hang customized frame.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {/* ═══ Photo Prints ═══ */}
          <div className="reveal group relative overflow-hidden rounded-[1.75rem] border border-ink/8 bg-white p-6 shadow-[0_10px_40px_rgba(27,20,48,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(27,20,48,0.12)] sm:p-8">
            <span className="absolute right-5 top-5 z-10 rounded-full bg-tangerine px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
              ⚡ Fast Printing
            </span>

            {/* sample stack visual */}
            <div className="mb-6 flex h-40 items-end justify-center gap-3" aria-hidden="true">
              {["from-plum/25 to-blush/25", "from-tangerine/25 to-amber-200", "from-sky-200 to-plum/20"].map((g, i) => (
                <div key={i}
                  className={`relative aspect-[3/4] w-24 rounded-xl bg-gradient-to-br ${g} shadow-lg transition-transform duration-500 group-hover:-translate-y-1`}
                  style={{ transform: `rotate(${(i - 1) * 6}deg)`, transitionDelay: `${i * 60}ms` }}>
                  <span className="absolute inset-x-2 bottom-2 h-2 rounded-full bg-white/55" />
                </div>
              ))}
            </div>

            <h3 className="font-display text-2xl font-bold text-ink">Photo Prints</h3>
            <p className="mt-1 text-sm text-ink/55">Premium lab-quality prints, delivered crisp and vivid.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {PRINT_TYPES.map((t) => (
                <button key={t} onClick={() => setPrintType(printType === t ? null : t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    printType === t ? "border-amber-500 bg-amber-500 text-white shadow" : "border-ink/12 bg-white text-ink/70 hover:border-amber-400 hover:text-amber-700"
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-ink/40">Choose a size</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRINT_SIZES.map((s) => (
                <button key={s} onClick={() => setPrintSize(printSize === s ? null : s)}
                  className={`min-w-12 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition ${
                    printSize === s ? "border-ink bg-ink text-white" : "border-ink/12 bg-white text-ink/70 hover:border-ink/40"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/50">
              <Icon d={icons.check} className="h-4 w-4 text-emerald-500" /> High quality color print with sharp finishing.
            </p>

            <a href={printMsg} target="_blank" rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 font-bold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/35">
              <Icon d={icons.upload} className="h-4.5 w-4.5" /> Upload Photo for Print
            </a>
          </div>

          {/* ═══ Custom Frames ═══ */}
          <div className="reveal group relative overflow-hidden rounded-[1.75rem] border-2 border-amber-300/50 bg-white p-6 shadow-[0_12px_44px_rgba(180,138,46,0.14)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_56px_rgba(180,138,46,0.22)] sm:p-8">
            <span className="absolute right-5 top-5 z-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
              ★ Most Popular
            </span>

            <div className="flex items-center gap-5">
              <div className="w-32 shrink-0">
                <FrameMock frame={frame} big />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-ink">Custom Frames</h3>
                <p className="mt-1 text-sm text-ink/55">Ready-to-hang frames, built around your photo.</p>
                <p className="mt-2 text-xs font-semibold text-amber-700">Selected: {frame.name}</p>
              </div>
            </div>

            {/* mini flow */}
            <ol className="mt-5 flex items-center justify-between gap-1">
              {FRAME_STEPS.map((s, i) => (
                <li key={s} className="flex flex-1 items-center gap-1">
                  <span className="flex flex-col items-center gap-1 text-center">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                    <span className="text-[9px] font-semibold leading-tight text-ink/55">{s}</span>
                  </span>
                  {i < FRAME_STEPS.length - 1 && <span className="mb-4 h-px flex-1 bg-ink/15" />}
                </li>
              ))}
            </ol>

            {/* frame style grid */}
            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-ink/40">Choose your frame</p>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {FRAME_STYLES.map((f) => {
                const active = frame.id === f.id;
                return (
                  <button key={f.id} onClick={() => setFrame(f)}
                    className={`rounded-xl border-2 p-2 text-left transition ${active ? "border-amber-500 bg-amber-50" : "border-ink/8 bg-white hover:border-amber-300"}`}>
                    <div className="transition-transform duration-300 group-hover:scale-[1.02]">
                      <FrameMock frame={f} />
                    </div>
                    <p className="mt-1.5 truncate text-[11px] font-bold text-ink">{f.name}</p>
                    <span className={`mt-1 block rounded-full py-1 text-center text-[10px] font-bold transition ${active ? "bg-amber-500 text-white" : "bg-ink/5 text-ink/60"}`}>
                      {active ? "✓ Selected" : "Select Frame"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* size + customization choices */}
            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-ink/40">Print size</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRINT_SIZES.map((s) => (
                <button key={s} onClick={() => setFrameSize(frameSize === s ? null : s)}
                  className={`min-w-12 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition ${
                    frameSize === s ? "border-ink bg-ink text-white" : "border-ink/12 bg-white text-ink/70 hover:border-ink/40"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/50">
              <Icon d={icons.check} className="h-4 w-4 text-emerald-500" /> Select frame design and we will adjust your photo perfectly.
            </p>

            <a href={frameMsg} target="_blank" rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ink to-plum py-3.5 font-bold text-white shadow-lg shadow-plum/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-plum/35">
              <Icon d={icons.whatsapp} filled className="h-4.5 w-4.5" /> Customize Frame
            </a>
            <button onClick={() => onCustomize("frame")}
              className="mt-2 w-full text-center text-xs font-semibold text-amber-700 underline-offset-2 hover:underline">
              or design &amp; preview your frame online →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, fav, onFav, onCustomize }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-[0_8px_30px_rgba(27,20,48,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(91,33,182,0.14)]">
      <div className="relative overflow-hidden">
        <img src={product.img} alt={product.name} loading="lazy"
          onError={(e) => {
            if (product.fallbackImg && e.currentTarget.src !== location.origin + product.fallbackImg)
              e.currentTarget.src = product.fallbackImg;
          }}
          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold tracking-wide text-plum shadow-sm backdrop-blur">{product.tag}</span>
        <button onClick={() => onFav(product.id)} aria-pressed={fav}
          aria-label={fav ? `Remove ${product.name} from favourites` : `Add ${product.name} to favourites`}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-md backdrop-blur transition ${
            fav ? "bg-blush/90 text-rose-600" : "bg-white/85 text-ink/50 hover:text-rose-500"
          }`}>
          <Icon d={icons.heart} filled={fav} className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
          {CATEGORIES.find((c) => c.id === product.category)?.label}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-ink">{product.name}</h3>
        <p className="mt-0.5 text-sm text-ink/55">{product.blurb}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-ink/45">Starting at</p>
            <p className="text-lg font-extrabold text-plum">{inr(product.price)}</p>
          </div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink/55">
            <Icon d={icons.truck} className="h-4 w-4 text-tangerine" /> {product.delivery}
          </p>
        </div>
        <button onClick={() => onCustomize(product.id)}
          className="btn-shine group/cta mt-4 w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-plum hover:shadow-lg hover:shadow-plum/25">
          Customize{" "}
          <span className="inline-block transition-transform duration-300 group-hover/cta:translate-x-1">→</span>
        </button>
      </div>
    </article>
  );
}

function ProductTabs({ favs, onFav, onCustomize }) {
  const [tab, setTab] = useState("all");
  const visible = useMemo(() => (tab === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === tab)), [tab]);
  return (
    <section id="products" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tangerine">Our Products</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">Pick it. We&rsquo;ll print it.</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">Every product is printed on demand with your photo, art or message.</p>
        </div>
        <div className="reveal mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Product categories">
          {CATEGORIES.map((c) => (
            <button key={c.id} role="tab" aria-selected={tab === c.id} onClick={() => setTab(c.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                tab === c.id
                  ? "bg-gradient-to-r from-plum to-plum-soft text-white shadow-lg shadow-plum/25"
                  : "bg-white text-ink/60 shadow-sm ring-1 ring-ink/10 hover:text-plum hover:ring-plum/30"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="reveal mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} fav={favs.includes(p.id)} onFav={onFav} onCustomize={onCustomize} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* Studio CTA — teases the editor and opens it */
function StudioCTA({ onOpenEditor }) {
  /* landing teaser walks the real-mockup candidate chain; NO cartoon fallback */
  const [srcIdx, setSrcIdx] = useState(0);
  const teaserCandidates = getMockupAsset("tshirt", "white", "real", "front");
  const teaserMissing = srcIdx >= teaserCandidates.length;
  return (
    <section id="studio" className="soft-gradient scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-tangerine">Design Studio</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">A real product editor.<br />Right in your browser.</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink/65">
              Blank mockups, a dashed print area, draggable layers, fonts, colours, front &amp; back
              designs, live preview — everything you'd expect from a pro print-on-demand editor,
              free and instant. No login needed.
            </p>
            <ul className="mt-5 grid max-w-md grid-cols-2 gap-2.5 text-sm text-ink/70">
              {["Drag & drop your design", "8 blank products", "5 product colours", "Front, back & neck label", "Undo / redo", "Save & reorder anytime"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Icon d={icons.check} className="h-4 w-4 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => onOpenEditor("tshirt")}
              className="mt-7 rounded-full bg-gradient-to-r from-plum to-plum-soft px-8 py-4 font-semibold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5 hover:shadow-xl">
              Open the Design Studio →
            </button>
          </div>
          {/* mini fake-editor teaser */}
          <button onClick={() => onOpenEditor("tshirt")} aria-label="Open the design editor"
            className="glass group relative mx-auto w-full max-w-md cursor-pointer overflow-hidden rounded-3xl p-4 text-left shadow-[0_24px_56px_-16px_rgba(27,20,48,0.3)] transition hover:-translate-y-1">
            <div className="flex items-center gap-1.5 border-b border-ink/8 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-semibold text-ink/45">Drucka Editor — Regular T-Shirt</span>
            </div>
            <div className="relative mx-auto mt-2 h-72 w-60">
              {teaserMissing ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-white/70 text-center">
                  <Icon d={icons.image} className="h-8 w-8 text-ink/25" />
                  <p className="text-sm font-bold text-ink/55">Add real mockup image</p>
                  <code className="rounded bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-plum">public/mockups/tshirt-front-white.png</code>
                </div>
              ) : (
                <img
                  src={teaserCandidates[srcIdx]}
                  alt="Blank white T-shirt ready for your design"
                  loading="lazy"
                  className="h-full w-full object-contain"
                  onError={() => setSrcIdx(srcIdx + 1)}
                />
              )}
              {!teaserMissing && (
                <div
                  className="absolute border-2 border-dashed border-sky-500/70"
                  style={{ left: "34%", top: "31%", width: "32%", height: "36%" }}
                >
                  <img src={GRAPHICS[3].src} alt="" className="absolute left-1/2 top-[42%] w-[68%] -translate-x-1/2 -translate-y-1/2" />
                  <span className="absolute bottom-[8%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-extrabold tracking-wide text-[#2c4a63]">ADVENTURE AWAITS</span>
                </div>
              )}
            </div>
            <span className="absolute bottom-5 right-5 rounded-full bg-plum px-4 py-2 text-xs font-bold text-white shadow-lg transition group-hover:scale-105">Try it free →</span>
          </button>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { title: "Choose a product", body: "Pick from T-shirts, hoodies, mugs, frames, cushions, canvas prints and keychains. Every product shows the price and delivery time upfront." },
  { title: "Upload your design", body: "Add your photo, artwork or logo right in the Design Studio. JPG, PNG and SVG work great — our team checks every file for print quality before printing." },
  { title: "Customize & preview", body: "Drag your design inside the print area, add text, pick colours and sizes, design front and back, and see a realistic live preview instantly." },
  { title: "We print & deliver", body: "We print with premium inks, pack it safely and ship across India. Most orders reach you in 2–4 days, with WhatsApp updates along the way." },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <section id="how" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tangerine">How It Works</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">From photo to gift in 4 steps</h2>
        </div>
        <div className="reveal mt-10 grid gap-4">
          {STEPS.map((s, i) => {
            const open = active === i;
            return (
              <div key={s.title} className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                open ? "border-plum/25 bg-white shadow-[0_16px_40px_rgba(91,33,182,0.12)]" : "border-ink/8 bg-white/70 shadow-sm hover:border-plum/20"
              }`}>
                <button onClick={() => setActive(open ? -1 : i)} aria-expanded={open}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg font-bold transition ${
                    open ? "bg-gradient-to-br from-plum to-tangerine text-white shadow-md" : "bg-plum/8 text-plum"
                  }`}>{i + 1}</span>
                  <span className="flex-1 font-display text-lg font-bold text-ink sm:text-xl">{s.title}</span>
                  <Icon d={icons.chevron} className={`h-5 w-5 text-ink/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-20 text-ink/65 sm:px-6 sm:pl-[5.25rem]">{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const OCCASIONS = ["Birthday", "Anniversary", "Corporate Gift", "Friendship", "Festival"];
const RECIPIENTS = ["Mom", "Dad", "Friend", "Partner", "Employee", "Client"];
const BUDGETS = [
  { id: "low", label: "Under ₹300" },
  { id: "mid", label: "₹300 – ₹700" },
  { id: "high", label: "₹700+" },
];

function suggestGift(occasion, recipient, budget) {
  const pools = { low: ["keychain", "mug"], mid: ["mug", "cushion", "tshirt"], high: ["frame", "canvas"] };
  const preference = {
    Birthday: ["mug", "cushion", "tshirt", "frame", "canvas", "keychain"],
    Anniversary: ["frame", "canvas", "cushion", "mug", "keychain", "tshirt"],
    "Corporate Gift": ["mug", "tshirt", "keychain", "frame", "canvas", "cushion"],
    Friendship: ["tshirt", "keychain", "mug", "cushion", "canvas", "frame"],
    Festival: ["cushion", "frame", "mug", "canvas", "keychain", "tshirt"],
  };
  const personal = {
    Mom: "she'll smile at it every single day",
    Dad: "a keepsake he'll actually use",
    Friend: "the inside-joke gift they'll never forget",
    Partner: "your favourite memory, printed forever",
    Employee: "appreciation they can see on their desk",
    Client: "a branded gift that keeps you remembered",
  };
  const angle = {
    Birthday: "with their photo and a birthday message",
    Anniversary: "with your best couple photo and the date",
    "Corporate Gift": "with your logo and a thank-you note",
    Friendship: "with a group photo or an inside joke",
    Festival: "with festive colours and family photos",
  };
  const ranked = preference[occasion].filter((id) => pools[budget].includes(id));
  const main = PRODUCTS.find((p) => p.id === ranked[0]);
  const alt = PRODUCTS.find((p) => p.id === ranked[1]) ?? null;
  return { main, alt, line: `Best gift: ${main.name} ${angle[occasion]} — ${personal[recipient]}.` };
}

function GiftIdeaTool({ onCustomize }) {
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [budget, setBudget] = useState(BUDGETS[1].id);
  const [result, setResult] = useState(null);

  const Select = ({ id, label, value, onChange, options }) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-medium shadow-sm outline-none transition focus:border-plum focus:ring-2 focus:ring-plum/20">
        {options.map((o) =>
          typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.id} value={o.id}>{o.label}</option>
        )}
      </select>
    </div>
  );

  return (
    <section id="gift-ideas" className="soft-gradient scroll-mt-20 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tangerine">Gift Genie</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">Not sure what to gift?</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">Tell us the occasion, person and budget — we&rsquo;ll suggest the perfect personalised gift.</p>
        </div>
        <div className="reveal glass mt-10 rounded-3xl p-6 shadow-xl sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select id="gift-occasion" label="Occasion" value={occasion} onChange={setOccasion} options={OCCASIONS} />
            <Select id="gift-recipient" label="Recipient" value={recipient} onChange={setRecipient} options={RECIPIENTS} />
            <Select id="gift-budget" label="Budget" value={budget} onChange={setBudget} options={BUDGETS} />
          </div>
          <button onClick={() => setResult(suggestGift(occasion, recipient, budget))}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-tangerine to-blush px-6 py-3.5 font-semibold text-white shadow-lg shadow-tangerine/30 transition hover:-translate-y-0.5">
            <Icon d={icons.gift} className="h-5 w-5" /> Suggest the perfect gift
          </button>
          {result && (
            <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-plum/15 bg-white p-5 sm:flex-row sm:p-6">
              <img src={result.main.img} alt={result.main.name} loading="lazy" className="h-28 w-28 rounded-2xl object-cover shadow-md" />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-display text-xl font-bold text-ink">{result.main.name} · {inr(result.main.price)}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/65">{result.line}</p>
                {result.alt && <p className="mt-1.5 text-xs font-medium text-ink/45">Also great: {result.alt.name} ({inr(result.alt.price)})</p>}
              </div>
              <button onClick={() => onCustomize(result.main.id)}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-plum">
                Customize this →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  { name: "Aarti Patil", city: "Pune", text: "Ordered a photo mug for my mom's birthday — the print quality genuinely surprised me. Colours are rich and it arrived in 3 days, beautifully packed.", product: "Photo Mug" },
  { name: "Rohan Kulkarni", city: "Kolhapur", text: "Got 15 custom T-shirts for our college fest. The team helped finalise the design on WhatsApp and delivered before the deadline. Fabric is genuinely premium.", product: "Premium T-Shirts (bulk)" },
  { name: "Sneha Deshmukh", city: "Mumbai", text: "The framed print of our wedding photo looks like it belongs in a gallery. My husband loved it. Drucka is now my go-to for every gift.", product: "Framed Print" },
];

function Reviews() {
  return (
    <section id="reviews" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tangerine">Reviews</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">Loved by gifters across India</h2>
        </div>
        <div className="reveal mt-10 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="glass flex flex-col rounded-3xl p-6 shadow-[0_12px_36px_rgba(27,20,48,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(91,33,182,0.14)]">
              <Stars />
              <blockquote className="mt-4 flex-1 leading-relaxed text-ink/70">&ldquo;{r.text}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink/8 pt-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-plum to-tangerine font-bold text-white">
                  {r.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <div>
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="text-xs text-ink/50">{r.city} · {r.product}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Can I upload my own image?", a: "Yes! Open the Design Studio and upload any JPG, PNG or SVG — your photo, artwork, logo or screenshot. For best print quality we recommend images of at least 1000×1000 px. Our team manually checks every file before printing and will message you on WhatsApp if anything needs fixing." },
  { q: "How long does delivery take?", a: "Most orders are printed within 24 hours and delivered in 2–4 working days across India. Metro cities are usually faster. Bulk orders may take a little longer — we'll always confirm the timeline before you pay." },
  { q: "Can I track my order?", a: "Absolutely. Once your order ships, we send the tracking link directly on WhatsApp. You can also tap 'Track Order' in the footer anytime to message us — we reply fast." },
  { q: "How do I place an order?", a: "Two easy ways: (1) Design your product in the Design Studio editor and add it to cart, then checkout via WhatsApp in one tap. (2) Message us directly on WhatsApp with your idea. We confirm details and share a secure UPI payment link. No account or app needed." },
  { q: "Do you support bulk orders?", a: "Yes — corporate gifting, college fests, team T-shirts, wedding favours and more. Bulk pricing kicks in from 10+ pieces with special rates at 50+. Message us on WhatsApp with your quantity and we'll send a custom quote within a few hours." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-tangerine">FAQ</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">Questions, answered</h2>
        </div>
        <div className="reveal mt-10 grid gap-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`overflow-hidden rounded-2xl border bg-white transition ${
                isOpen ? "border-plum/25 shadow-[0_12px_32px_rgba(91,33,182,0.1)]" : "border-ink/8 shadow-sm"
              }`}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink sm:px-6">
                  {f.q}
                  <Icon d={icons.chevron} className={`h-5 w-5 shrink-0 text-plum transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink/65 sm:px-6">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer({ onAdmin, onTrack }) {
  return (
    <footer className="bg-ink text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-plum-soft to-tangerine font-display text-lg font-bold text-white">D</span>
            <span className="font-display text-2xl font-bold text-white">Drucka</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Premium custom printing studio. Personalized T-shirts, mugs, frames, cushions, canvas
            prints and gifts — printed beautifully, delivered across India in 2–4 days.
          </p>
          <p className="mt-4 font-display text-lg italic text-blush">Print it. Gift it. Feel it.</p>
        </div>
        <nav aria-label="Shop links">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {PRODUCTS.map((p) => (
              <li key={p.id}><a href="#products" className="transition hover:text-tangerine">{p.name}</a></li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Get in touch</h3>
          <ul className="mt-4 grid gap-3 text-sm">
            <li>
              <a href={wa("Hi Drucka! I have a question about your products.")} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 transition hover:text-emerald-400">
                <Icon d={icons.whatsapp} filled className="h-4 w-4" /> WhatsApp us
              </a>
            </li>
            <li>
              <a href={CONFIG.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-blush">
                <Icon d={icons.instagram} className="h-4 w-4" /> @druc.ka
              </a>
            </li>
            <li>
              <a href={`mailto:${CONFIG.email}`} className="flex items-center gap-2 transition hover:text-tangerine">
                <Icon d={icons.mail} className="h-4 w-4" /> {CONFIG.email}
              </a>
            </li>
            <li>
              <button onClick={onTrack} className="flex items-center gap-2 transition hover:text-tangerine">
                <Icon d={icons.package} className="h-4 w-4" /> Track Order
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Drucka · drucka.in · Made with ❤️ in Maharashtra, India ·{" "}
        <button onClick={onAdmin} className="underline-offset-2 transition hover:text-white/70 hover:underline">
          Admin
        </button>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CART DRAWER (localStorage-backed, shows custom design previews)
   ═══════════════════════════════════════════════════════════════ */
const customSizeText = (cs) =>
  cs
    ? `chest ${cs.chest}${cs.unit}, length ${cs.length}${cs.unit}` +
      (cs.shoulder ? `, shoulder ${cs.shoulder}${cs.unit}` : "") +
      (cs.sleeve ? `, sleeve ${cs.sleeve}${cs.unit}` : "") +
      (cs.note ? ` (${cs.note})` : "")
    : "";

function OrderSummary({ cart, total, colorLabel }) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold text-ink">Order Summary · ऑर्डर समरी</h3>
      <ul className="mt-3 grid gap-2.5">
        {cart.map((i) => (
          <li key={i.key} className="flex items-start justify-between gap-3 rounded-xl border border-ink/8 px-3 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{i.name} × {i.qty}</p>
              <p className="truncate text-xs text-ink/50">{[i.size, colorLabel(i.color), i.summary].filter(Boolean).join(" · ")}</p>
              {i.customSize && <p className="text-[11px] text-ink/50">📐 {customSizeText(i.customSize)}</p>}
            </div>
            <p className="shrink-0 font-bold text-plum">{inr(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid gap-1.5 rounded-xl bg-ink/4 p-3 text-sm">
        <div className="flex justify-between"><dt className="text-ink/55">Subtotal</dt><dd className="font-semibold">{inr(total)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink/55">Delivery · डिलिव्हरी</dt><dd className="font-semibold text-emerald-600">FREE · 2–4 days 🚚</dd></div>
        <div className="flex justify-between border-t border-ink/10 pt-1.5"><dt className="font-bold text-ink">Total</dt><dd className="font-display text-lg font-bold text-ink">{inr(total)}</dd></div>
      </dl>
      <div className="mt-4 grid gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11.5px] leading-relaxed text-ink/75">
        <p className="font-bold text-emerald-700">Payment options · पेमेंट</p>
        <p>✅ UPI — GPay / PhonePe / Paytm ({CONFIG.upiId})</p>
        <p>📦 Cash on Delivery — available on request</p>
        <p>💬 Order confirmed on WhatsApp before printing</p>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink/45">
        ✂️ Background removal available on request — just mention it in the WhatsApp chat.
      </p>
    </div>
  );
}

function CartDrawer({ open, onClose, cart, onRemove, onQty, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const colorLabel = (id) => PRODUCT_COLORS.find((c) => c.id === id)?.label;
  const [summary, setSummary] = useState(false);
  useEffect(() => { if (!open) setSummary(false); }, [open]);

  const checkoutMsg = wa(
    `Hi Drucka! I'd like to checkout my cart:\n\n` +
      cart.map((i) =>
        `🛍 ${i.name} ×${i.qty} — ${inr(i.price * i.qty)}` +
        (i.size ? `\n   📏 Size: ${i.size}` : "") +
        (i.customSize ? `\n   📐 Custom size: ${customSizeText(i.customSize)}` : "") +
        (i.color ? `\n   🎨 Colour: ${colorLabel(i.color)}` : "") +
        (i.summary ? `\n   ✏️ ${i.summary} (I'll attach my design files here)` : "")
      ).join("\n") +
      `\n\n💰 Total: ${inr(total)}\n🚚 Delivery: 2–4 days\nPayment: UPI (${CONFIG.upiId}) / COD. Please confirm my order!`
  );

  return (
    <>
      <div className={`fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose} aria-hidden="true" />
      <aside className={`fixed right-0 top-0 z-[110] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Your Cart {cart.length > 0 && <span className="font-sans text-sm font-medium text-ink/50">({cart.length})</span>}
          </h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 transition hover:bg-ink/10" aria-label="Close cart">
            <Icon d={icons.x} className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-plum/8 text-plum">
                  <Icon d={icons.cart} className="h-7 w-7" />
                </span>
                <p className="mt-4 font-semibold text-ink">Your cart is empty</p>
                <p className="mt-1 text-sm text-ink/50">Design something beautiful in the studio.</p>
              </div>
            </div>
          ) : summary ? (
            <OrderSummary cart={cart} total={total} colorLabel={colorLabel} />
          ) : (
            <ul className="grid gap-4">
              {cart.map((item) => (
                <li key={item.key} className="flex gap-3 rounded-2xl border border-ink/8 p-3">
                  {item.type === "custom"
                    ? <MiniMockup item={item} />
                    : <img src={item.img} alt={item.name} className="h-20 w-[68px] rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {[item.size, colorLabel(item.color)].filter(Boolean).join(" · ")}
                    </p>
                    {item.customSize && <p className="truncate text-[11px] text-ink/50">📐 {customSizeText(item.customSize)}</p>}
                    {item.summary && <p className="truncate text-xs text-ink/50">✏️ {item.summary}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-ink/10">
                        <button onClick={() => onQty(item.key, -1)} className="px-2.5 py-1 font-bold text-ink/60" aria-label="Decrease quantity">−</button>
                        <span className="min-w-7 text-center text-sm font-bold">{item.qty}</span>
                        <button onClick={() => onQty(item.key, 1)} className="px-2.5 py-1 font-bold text-ink/60" aria-label="Increase quantity">+</button>
                      </div>
                      <p className="font-bold text-plum">{inr(item.price * item.qty)}</p>
                    </div>
                  </div>
                  <button onClick={() => onRemove(item.key)} className="self-start text-ink/30 transition hover:text-rose-500" aria-label={`Remove ${item.name}`}>
                    <Icon d={icons.trash} className="h-4.5 w-4.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-ink/8 px-5 py-4">
            {!summary ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink/60">Total</span>
                  <span className="font-display text-2xl font-bold text-ink">{inr(total)}</span>
                </div>
                <button onClick={() => setSummary(true)}
                  className="w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-6 py-3.5 font-semibold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5">
                  Review order · ऑर्डर समरी →
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onCheckout?.()}
                  className="w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-6 py-3.5 font-semibold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5">
                  Proceed to Checkout · चेकआउट →
                </button>
                <a href={checkoutMsg} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500 px-6 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50">
                  <Icon d={icons.whatsapp} filled className="h-4 w-4" /> Or order directly on WhatsApp
                </a>
                <button onClick={() => setSummary(false)}
                  className="mt-2 w-full text-center text-xs font-semibold text-ink/50 transition hover:text-plum">
                  ← Back to cart
                </button>
              </>
            )}
            <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink/45">
              Pay securely via UPI or COD after we confirm your order. Attach your design photo in the WhatsApp chat.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRACK ORDER — customer self-service (order ID + phone)
   ═══════════════════════════════════════════════════════════════ */
const TRACK_STEPS = ["Order received", "In Production", "Shipped", "Delivered"];

function TrackOrderModal({ onClose, localOrders }) {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    setBusy(true); setError(null); setResult(null);
    const cleanId = id.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    try {
      const { order } = await qikinkApi.trackOrder(cleanId, cleanPhone);
      setResult(order);
    } catch (err) {
      /* offline / backend absent → same-device localStorage fallback */
      const lo = localOrders.find(
        (o) => o.id.toUpperCase() === cleanId &&
          String(o.customer?.phone ?? "").replace(/\D/g, "").slice(-10) === cleanPhone
      );
      if (lo) setResult({
        id: lo.id, createdAt: lo.createdAt, total: lo.total,
        items: lo.items.map((i) => ({ name: i.name, qty: i.qty, size: i.size, color: i.color })),
        paymentStatus: lo.paymentStatus,
        status: lo.qikinkStatus === "Draft" ? "Order received" : lo.qikinkStatus,
        tracking: lo.tracking ?? null, courier: lo.courier ?? null,
      });
      else setError(err.message);
    }
    setBusy(false);
  };

  const stepIdx = result
    ? Math.max(0, TRACK_STEPS.indexOf(result.status === "Sent to Qikink" ? "In Production" : result.status))
    : 0;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-sheet w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true"
        aria-label="Track order" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Track Order · ऑर्डर ट्रॅक करा</h2>
          <button onClick={onClose} aria-label="Close tracking" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10">
            <Icon d={icons.x} className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <div>
            <label htmlFor="trk-id" className="mb-0.5 block text-[11px] font-semibold text-ink/60">Drucka order ID</label>
            <input id="trk-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="DRK-XXXXXXXX"
              className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-plum" />
          </div>
          <div>
            <label htmlFor="trk-phone" className="mb-0.5 block text-[11px] font-semibold text-ink/60">Mobile number used at checkout</label>
            <input id="trk-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit"
              className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-plum" />
          </div>
          <button onClick={lookup} disabled={busy || !id.trim() || phone.replace(/\D/g, "").length < 10}
            className="w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-4 py-3 text-sm font-bold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5 disabled:opacity-40">
            {busy ? "Checking…" : "Track my order"}
          </button>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600" role="alert">⚠ {error}</p>}

          {result && (
            <div className="rounded-2xl border border-ink/8 bg-ink/3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">{result.id}</p>
                <p className="text-sm font-bold text-plum">{inr(result.total)}</p>
              </div>
              <p className="mt-1 text-xs text-ink/55">
                {result.items.map((i) => `${i.name} ×${i.qty}`).join(", ")} · {result.paymentStatus}
              </p>
              {/* status timeline */}
              {result.status === "Failed" ? (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                  ⚠ There's an issue with this order — our team is on it. Message us on WhatsApp for details.
                </p>
              ) : (
                <ol className="mt-3 grid gap-1.5">
                  {TRACK_STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 text-xs">
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        i <= stepIdx ? "bg-emerald-500 text-white" : "bg-ink/10 text-ink/40"
                      }`}>{i <= stepIdx ? "✓" : i + 1}</span>
                      <span className={i <= stepIdx ? "font-bold text-ink" : "text-ink/45"}>{s}</span>
                      {i === stepIdx && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">current</span>}
                    </li>
                  ))}
                </ol>
              )}
              {result.tracking && (
                <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">
                  📦 {result.courier ? `${result.courier} · ` : ""}AWB {result.tracking}
                </p>
              )}
            </div>
          )}

          <a href={wa(`Hi Drucka! I'd like to track my order${id.trim() ? ` ${id.trim().toUpperCase()}` : ""}.`)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50">
            <Icon d={icons.whatsapp} filled className="h-4 w-4" /> Or ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHECKOUT — customer details → order → payment → Qikink handoff
   ═══════════════════════════════════════════════════════════════ */
function CheckoutModal({ cart, total, onClose, onPlaceOrder, onMarkPaid, onPayRazorpay, onSendToQikink, settings, showToast }) {
  const [order, setOrder] = useState(null); // set after placing
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address1: "", address2: "",
    city: "", state: "Maharashtra", pincode: "",
    paymentMode: FEATURES.ENABLE_COD_TESTING ? "cod" : "prepaid", // COD-first while testing
    notes: "",
  });
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) return setError("Full name is required");
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) return setError("Enter a valid 10-digit mobile number");
    if (!form.address1.trim()) return setError("Address line 1 is required");
    if (!form.city.trim()) return setError("City is required");
    if (!form.state.trim()) return setError("State is required");
    if (!/^\d{6}$/.test(form.pincode)) return setError("Enter a valid 6-digit pincode");
    setError(null);
    setOrder(onPlaceOrder(form));
  };

  const canSend = order && ["Paid", "COD Approved"].includes(order.paymentStatus);
  const inputCls = "w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-plum focus:ring-2 focus:ring-plum/20";
  const lblCls = "mb-0.5 block text-[11px] font-semibold text-ink/60";

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-sheet flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog" aria-modal="true" aria-label="Checkout" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-ink">{order ? "Order placed 🎉" : "Checkout · चेकआउट"}</h2>
          <button onClick={onClose} aria-label="Close checkout" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10">
            <Icon d={icons.x} className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">
          {!order ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="co-name" className={lblCls}>Full name *</label>
                  <input id="co-name" value={form.name} onChange={set("name")} className={inputCls} autoComplete="name" /></div>
                <div><label htmlFor="co-phone" className={lblCls}>Mobile number *</label>
                  <input id="co-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="10-digit" className={inputCls} autoComplete="tel" /></div>
                <div><label htmlFor="co-email" className={lblCls}>Email</label>
                  <input id="co-email" type="email" value={form.email} onChange={set("email")} className={inputCls} autoComplete="email" /></div>
                <div className="sm:col-span-2"><label htmlFor="co-addr1" className={lblCls}>Address line 1 *</label>
                  <input id="co-addr1" value={form.address1} onChange={set("address1")} className={inputCls} autoComplete="address-line1" /></div>
                <div className="sm:col-span-2"><label htmlFor="co-addr2" className={lblCls}>Address line 2</label>
                  <input id="co-addr2" value={form.address2} onChange={set("address2")} className={inputCls} autoComplete="address-line2" /></div>
                <div><label htmlFor="co-city" className={lblCls}>City *</label>
                  <input id="co-city" value={form.city} onChange={set("city")} className={inputCls} autoComplete="address-level2" /></div>
                <div><label htmlFor="co-state" className={lblCls}>State *</label>
                  <input id="co-state" value={form.state} onChange={set("state")} className={inputCls} autoComplete="address-level1" /></div>
                <div><label htmlFor="co-pin" className={lblCls}>Pincode *</label>
                  <input id="co-pin" inputMode="numeric" maxLength={6} value={form.pincode} onChange={set("pincode")} className={inputCls} autoComplete="postal-code" /></div>
                <div><label className={lblCls}>Payment mode</label>
                  <div className="flex gap-2">
                    {(FEATURES.ENABLE_COD_TESTING
                      ? [["cod", "COD / Test Order"], ["prepaid", "UPI"]]
                      : [["prepaid", "UPI"], ["cod", "COD request"]]
                    ).map(([v, l]) => (
                      <button key={v} onClick={() => setForm((s) => ({ ...s, paymentMode: v }))} aria-pressed={form.paymentMode === v}
                        className={`flex-1 rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                          form.paymentMode === v ? "border-plum bg-plum text-white" : "border-ink/15 text-ink/60"
                        }`}>{l}</button>
                    ))}
                  </div></div>
                <div className="sm:col-span-2"><label htmlFor="co-notes" className={lblCls}>Notes (optional)</label>
                  <input id="co-notes" value={form.notes} onChange={set("notes")} maxLength={120} placeholder="Gift wrap, delivery instructions…" className={inputCls} /></div>
              </div>
              {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600" role="alert">⚠ {error}</p>}
            </>
          ) : (
            <>
              {/* order summary */}
              <div className="rounded-2xl bg-ink/4 p-3 text-sm">
                <p className="font-bold text-ink">{order.id} <span className="font-sans text-xs font-medium text-ink/45">· {order.items.length} item(s)</span></p>
                <ul className="mt-2 grid gap-1 text-xs text-ink/65">
                  {order.items.map((i) => (
                    <li key={i.key} className="flex justify-between">
                      <span>{i.name} × {i.qty} ({[i.size, i.color].filter(Boolean).join(", ")})</span>
                      <span className="font-semibold">{inr(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-bold text-ink">
                  <span>Total</span><span>{inr(order.total)}</span>
                </p>
              </div>

              {/* payment status */}
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-ink/8 px-3 py-2.5">
                <span className="text-xs font-semibold text-ink/60">Payment status</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  ["Paid", "COD Approved"].includes(order.paymentStatus) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>{order.paymentStatus}</span>
              </div>

              {["Paid", "COD Approved"].includes(order.paymentStatus) && (
                <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center">
                  <p className="font-display text-lg font-bold text-emerald-700">🎉 Order confirmed!</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/60">
                    Save your order ID <strong className="text-ink">{order.id}</strong> — track it anytime from the
                    footer → <strong>Track Order</strong> with this ID + your phone number. Updates also come on WhatsApp.
                  </p>
                </div>
              )}
              {order.paymentStatus === "Payment Pending" && (
                <div className="mt-3 grid gap-2">
                  {/* Razorpay is fully wired but hidden while COD testing — flip FEATURES.ENABLE_RAZORPAY */}
                  {FEATURES.ENABLE_RAZORPAY && (
                  <button
                    onClick={async () => {
                      if (sending) return;
                      setSending(true);
                      const updated = await onPayRazorpay(order);
                      if (updated) setOrder(updated);
                      setSending(false);
                    }}
                    disabled={sending}
                    className="w-full rounded-full bg-ink px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-plum disabled:opacity-50">
                    {sending ? "Opening secure payment…" : `💳 Pay ${inr(order.total)} — UPI / Card / Netbanking`}
                  </button>
                  )}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-ink/70">
                    <p className="font-bold text-emerald-700">Or pay via UPI manually · पेमेंट करा</p>
                    <p className="mt-1">Send {inr(order.total)} to <strong>{CONFIG.upiId}</strong> (GPay / PhonePe / Paytm), then tap below. Our team verifies before printing.</p>
                    <button onClick={() => setOrder(onMarkPaid(order.id))}
                      className="mt-2 w-full rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600">
                      ✓ I've paid via UPI
                    </button>
                  </div>
                </div>
              )}
              {order.paymentStatus === "COD Pending Approval" && (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  📦 <strong>COD test order received!</strong> Our team approves it (Admin → Orders → Approve COD),
                  and only then is it sent to Qikink for printing. You'll get a WhatsApp confirmation shortly.
                </p>
              )}

              {/* Qikink handoff */}
              <button
                onClick={async () => {
                  if (sending) return;
                  setSending(true);
                  setOrder((await onSendToQikink(order.id)) ?? order);
                  setSending(false);
                }}
                disabled={!canSend || sending || order.qikinkStatus !== "Draft"}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-4 py-3 text-sm font-bold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0">
                {sending ? "Uploading artwork & sending…" : order.qikinkStatus === "Draft" ? "Send to Qikink fulfillment →" : `✓ ${order.qikinkStatus}`}
              </button>
              {order.qikinkStatus !== "Draft" && (
                <p className="mt-2 rounded-xl bg-plum/5 px-3 py-2 text-center text-[11px] font-medium text-plum">
                  Qikink payload generated (see browser console). Connect the backend API to send live orders.
                </p>
              )}
              <a href={wa(`Hi Drucka! I just placed order ${order.id} (${inr(order.total)}, ${order.paymentMode.toUpperCase()}). Please confirm!`)}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50">
                <Icon d={icons.whatsapp} filled className="h-4 w-4" /> Notify Drucka on WhatsApp
              </a>
            </>
          )}
        </div>

        {!order && (
          <div className="border-t border-ink/8 px-5 py-4">
            <button onClick={submit}
              className="w-full rounded-full bg-gradient-to-r from-plum to-plum-soft px-6 py-3.5 font-semibold text-white shadow-lg shadow-plum/30 transition hover:-translate-y-0.5">
              {form.paymentMode === "cod" ? `Place COD Test Order — ${inr(total)}` : `Place order — ${inr(total)}`}
            </button>
            <p className="mt-2 text-center text-[10.5px] text-ink/45">🚚 Free 2–4 day delivery · ✅ UPI · 📦 COD on approval · Printed & shipped under the Drucka brand</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN PANEL — Fulfillment settings · Qikink mapping · Orders
   ═══════════════════════════════════════════════════════════════ */
function AdminPanel({ onClose, settings, onSaveSettings, orders, onUpdateOrder, onSendToQikink, onRefreshStatus, onSyncOrders, productMap, onSaveMap, onLoadMap, showToast }) {
  const [tab, setTab] = useState("settings");
  const [local, setLocal] = useState(settings);
  const [mapDraft, setMapDraft] = useState(productMap);
  useEffect(() => setMapDraft(productMap), [productMap]);
  const editMap = (druckaId, patch) =>
    setMapDraft((d) => d.map((m) => (m.druckaId === druckaId ? { ...m, ...patch } : m)));
  const [clientSecret, setClientSecret] = useState(""); // ⚠ in-memory ONLY — never persisted
  const [adminKey, setAdminKeyLocal] = useState(getAdminKey); // sessionStorage (tab-scoped)
  const set = (k) => (e) => setLocal((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const inputCls = "w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-plum";
  const lblCls = "mb-0.5 block text-[11px] font-semibold text-ink/60";

  const testConnection = async () => {
    /* Real check via OUR backend (credentials live in Vercel env vars —
       the fields here are informational placeholders only). */
    try {
      const r = await qikinkApi.testConnection();
      showToast(`Qikink ${r.mode} connection OK ✓`);
    } catch (err) {
      showToast(`⚠ Backend unreachable (${err.message}) — deploy api/ to Vercel, see DEPLOY.md`);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-ink/60 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="animate-sheet flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog" aria-modal="true" aria-label="Drucka admin" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Drucka Admin</h2>
            <p className="text-[11px] text-ink/45">Fulfillment Settings → Qikink · <a href="https://creator.qikink.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-plum underline-offset-2 hover:underline">Qikink dashboard ↗</a></p>
          </div>
          <button onClick={onClose} aria-label="Close admin" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10">
            <Icon d={icons.x} className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b border-ink/8 px-5 pt-2" role="tablist" aria-label="Admin sections">
          {[["settings", "Fulfillment Settings"], ["mapping", "Product Mapping"], ["orders", `Orders (${orders.length})`]].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`rounded-t-xl px-4 py-2.5 text-xs font-bold transition ${
                tab === id ? "border border-b-0 border-ink/10 bg-white text-plum" : "text-ink/50 hover:text-ink"
              }`}>{label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scroll-thin">
          {tab === "settings" && (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">
                <strong>🔐 Security:</strong> API keys must be stored on the backend, never in browser localStorage.
                This panel saves only non-sensitive settings. The Client Secret field below is kept in memory for this
                session only and is never persisted — move real credentials to your server's environment variables
                (see <code className="font-bold">server/qikink-api.example.js</code>).
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className={lblCls}>Integration status</label>
                  <select value={local.status} onChange={set("status")} className={inputCls}>
                    <option value="not_connected">Not connected</option>
                    <option value="sandbox">Sandbox</option>
                    <option value="live">Live</option>
                  </select></div>
                <div><label className={lblCls}>Store / Brand name</label>
                  <input value={local.storeName} onChange={set("storeName")} className={inputCls} /></div>
                <div><label className={lblCls}>Qikink Client ID <span className="font-normal text-ink/40">(demo placeholder)</span></label>
                  <input value={local.clientId} onChange={set("clientId")} placeholder="e.g. 1234" className={inputCls} /></div>
                <div><label className={lblCls}>Qikink Client Secret <span className="font-bold text-rose-500">(never stored)</span></label>
                  <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="kept in memory only" className={inputCls} /></div>
                <div className="sm:col-span-2"><label className={lblCls}>Admin API key <span className="font-normal text-ink/40">(= ADMIN_SECRET on Vercel · session only, authorizes order list/updates)</span></label>
                  <input type="password" value={adminKey}
                    onChange={(e) => { setAdminKeyLocal(e.target.value); setAdminKey(e.target.value); }}
                    placeholder="cleared when this tab closes" className={inputCls} /></div>
                <div className="sm:col-span-2"><label className={lblCls}>Default pickup / return address</label>
                  <input value={local.pickupAddress} onChange={set("pickupAddress")} className={inputCls} /></div>
                <div><label className={lblCls}>Support WhatsApp</label>
                  <input value={local.supportWhatsapp} onChange={set("supportWhatsapp")} className={inputCls} /></div>
                <div><label className={lblCls}>Support email</label>
                  <input value={local.supportEmail} onChange={set("supportEmail")} className={inputCls} /></div>
                <div><label className={lblCls}>Payment mode</label>
                  <select value={local.paymentMode} onChange={set("paymentMode")} className={inputCls}>
                    <option value="prepaid">Prepaid only</option>
                    <option value="cod">COD only</option>
                    <option value="both">Prepaid + COD</option>
                  </select></div>
                <div><label className={lblCls}>Packing slip brand name (white-label)</label>
                  <input value={local.packingSlipBrand} onChange={set("packingSlipBrand")} className={inputCls} /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink/70">
                  <input type="checkbox" checked={local.sandbox} onChange={set("sandbox")} className="h-4 w-4 accent-plum" />
                  Sandbox mode
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink/70">
                  <input type="checkbox" checked={local.autoSend} onChange={set("autoSend")} className="h-4 w-4 accent-plum" />
                  Auto-send paid orders to Qikink (backend feature)
                </label>
              </div>
              <p className="rounded-xl bg-ink/4 px-3 py-2.5 text-[11px] leading-relaxed text-ink/55">
                ℹ Branding/packing slip options depend on Qikink account settings. Confirm in the Qikink dashboard.
                Customers always see <strong>{local.packingSlipBrand || "Drucka"}</strong> — never Qikink.
              </p>
              <div className="flex gap-2">
                <button onClick={testConnection}
                  className="rounded-full border border-plum px-5 py-2.5 text-xs font-bold text-plum transition hover:bg-plum/5">
                  Test connection
                </button>
                <button onClick={() => { onSaveSettings(local); showToast("Fulfillment settings saved ✓"); }}
                  className="rounded-full bg-gradient-to-r from-plum to-plum-soft px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5">
                  Save settings
                </button>
              </div>
            </div>
          )}

          {tab === "mapping" && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-ink/50">
                  Copy REAL product IDs & SKU patterns from the <a href="https://creator.qikink.com/dashboard" target="_blank" rel="noopener noreferrer" className="font-bold text-plum underline-offset-2 hover:underline">Qikink dashboard ↗</a>. Saved to Supabase via <code className="font-bold">/api/admin/product-map</code> (needs Admin API key).
                </p>
                <div className="flex gap-2">
                  <button onClick={onLoadMap} className="rounded-full border border-plum px-4 py-2 text-[11px] font-bold text-plum hover:bg-plum/5">⟳ Load from server</button>
                  <button onClick={() => onSaveMap(mapDraft)} className="rounded-full bg-gradient-to-r from-plum to-plum-soft px-5 py-2 text-[11px] font-bold text-white shadow-md">Save mappings</button>
                </div>
              </div>
              {mapDraft.map((m) => {
                const fieldCls = "w-full rounded-lg border border-ink/10 px-2 py-1.5 text-[11px] shadow-sm outline-none focus:border-plum";
                return (
                  <div key={m.druckaId} className={`rounded-2xl border p-3.5 ${m.active ? "border-ink/8 bg-white" : "border-dashed border-ink/15 bg-ink/3 opacity-80"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{m.druckaName} <span className="text-ink/40">→</span> {m.qikinkProduct}</p>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink/60">
                        <input type="checkbox" checked={m.active} onChange={(e) => editMap(m.druckaId, { active: e.target.checked })} className="h-3.5 w-3.5 accent-plum" />
                        Active
                      </label>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <div><label className="mb-0.5 block text-[10px] font-semibold text-ink/40">Qikink Product ID</label>
                        <input value={m.qikinkProductId} onChange={(e) => editMap(m.druckaId, { qikinkProductId: e.target.value })} className={fieldCls} /></div>
                      <div><label className="mb-0.5 block text-[10px] font-semibold text-ink/40">Variant / SKU pattern</label>
                        <input value={m.skuPattern} onChange={(e) => editMap(m.druckaId, { skuPattern: e.target.value })} placeholder="ABC-{color}-{size}" className={fieldCls} /></div>
                      <div><label className="mb-0.5 block text-[10px] font-semibold text-ink/40">Print method</label>
                        <select value={m.printMethod} onChange={(e) => editMap(m.druckaId, { printMethod: e.target.value })} className={fieldCls}>
                          {["DTG", "DTF", "Embroidery", "Sublimation"].map((p) => <option key={p}>{p}</option>)}
                        </select></div>
                      <div><label className="mb-0.5 block text-[10px] font-semibold text-ink/40">Base cost ₹</label>
                        <input type="number" value={m.baseCost} onChange={(e) => editMap(m.druckaId, { baseCost: +e.target.value })} className={fieldCls} /></div>
                      <div><label className="mb-0.5 block text-[10px] font-semibold text-ink/40">Shipping ₹</label>
                        <input type="number" value={m.shippingCost ?? 0} onChange={(e) => editMap(m.druckaId, { shippingCost: +e.target.value })} className={fieldCls} /></div>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-ink/60 sm:grid-cols-4">
                      <div><dt className="font-semibold text-ink/40">Colours</dt><dd>{m.colors.join(", ")}</dd></div>
                      <div><dt className="font-semibold text-ink/40">Sizes</dt><dd>{m.sizes.join(", ")}</dd></div>
                      <div><dt className="font-semibold text-ink/40">Print areas</dt><dd>{m.printAreas.join(", ")}</dd></div>
                      <div><dt className="font-semibold text-ink/40">Margin</dt><dd className="font-bold text-emerald-600">{inr(m.sellingPrice - m.baseCost - (m.shippingCost ?? 0))} <span className="font-normal text-ink/40">(after ship)</span></dd></div>
                    </dl>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "orders" && (
            <div className="grid gap-3">
              <div className="flex justify-end">
                <button onClick={onSyncOrders}
                  className="rounded-full border border-plum px-4 py-2 text-[11px] font-bold text-plum transition hover:bg-plum/5">
                  ⟳ Sync from server (Supabase)
                </button>
              </div>
            {orders.length === 0 ? (
              <p className="rounded-2xl bg-ink/4 px-4 py-10 text-center text-sm text-ink/50">No orders yet — they appear here after customer checkout.</p>
            ) : (
              <div className="grid gap-3">
                {orders.map((o) => {
                  const canSend = ["Paid", "COD Approved"].includes(o.paymentStatus);
                  return (
                    <div key={o.id} className="rounded-2xl border border-ink/8 bg-white p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink">{o.id} <span className="font-sans text-[11px] font-medium text-ink/40">· {new Date(o.createdAt).toLocaleString("en-IN")}</span></p>
                        <p className="text-sm font-bold text-plum">{inr(o.total)}</p>
                      </div>
                      <p className="mt-1 text-xs text-ink/60">
                        👤 {o.customer.name} · {o.customer.phone} · {o.customer.city} {o.customer.pincode}
                      </p>
                      <p className="text-xs text-ink/60">
                        🛍 {o.items.map((i) => `${i.name} ×${i.qty} (${[i.size, i.color].filter(Boolean).join("/")})`).join(", ")}
                      </p>
                      {o.lastError && (
                        <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600">
                          ⚠ Last fulfillment error: {o.lastError}
                        </p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          ["Paid", "COD Approved"].includes(o.paymentStatus) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>{o.paymentStatus}</span>
                        <select value={o.qikinkStatus} onChange={(e) => onUpdateOrder(o.id, { qikinkStatus: e.target.value })}
                          aria-label="Qikink status"
                          className="rounded-lg border border-ink/10 px-2 py-1 text-[10px] font-bold text-ink/70 outline-none focus:border-plum">
                          {QIKINK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {o.qikinkOrderId && <span className="rounded-full bg-plum/8 px-2.5 py-1 text-[10px] font-bold text-plum">QK: {o.qikinkOrderId}</span>}
                        {o.tracking && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold text-sky-700">📦 {o.courier ? `${o.courier} · ` : ""}AWB {o.tracking}</span>}
                        {o.qikinkOrderId && !o.qikinkOrderId.startsWith("QK-DEMO") && (
                          <button onClick={() => onRefreshStatus(o)} aria-label="Refresh Qikink status"
                            className="rounded-full border border-ink/15 px-2.5 py-1 text-[10px] font-bold text-ink/60 hover:border-plum hover:text-plum">⟳ Status</button>
                        )}
                        <span className="flex-1" />
                        {o.paymentStatus === "Payment Pending" && (
                          <button onClick={() => onUpdateOrder(o.id, { paymentStatus: "Paid" })}
                            className="rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-600">Mark Paid</button>
                        )}
                        {o.paymentStatus === "COD Pending Approval" && (
                          <button onClick={() => onUpdateOrder(o.id, { paymentStatus: "COD Approved" })}
                            className="rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-amber-600">Approve COD</button>
                        )}
                        <button onClick={() => onSendToQikink(o.id)} disabled={!canSend}
                          className="rounded-full bg-plum px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-plum-soft disabled:opacity-35">
                          {o.qikinkStatus === "Draft" ? "Send to Qikink" : "Retry send"}
                        </button>
                        <a href={`https://wa.me/91${(o.customer.phone || "").replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi ${o.customer.name}! This is Drucka about your order ${o.id}. `)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-600">
                          <Icon d={icons.whatsapp} filled className="h-3 w-3" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10.5px] text-ink/45">
                  "Send to Qikink" uploads artwork to Cloudinary and creates the order via <code className="font-bold">/api/qikink/create-order</code>.
                  If the backend isn't deployed yet, it falls back to a demo payload in the browser console (see DEPLOY.md).
                </p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [cart, setCart] = useState(() => load("drucka-cart", []));
  const [favs, setFavs] = useState(() => load("drucka-favs", []));
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  /* THE single design-customization flow: product page → designer → submit.
     (The legacy in-file ProductEditor is no longer rendered anywhere.) */
  const [designerPage, setDesignerPage] = useState(null); // null | { productId }
  const [designer, setDesigner] = useState(null); // null | { productId, selections }
  const [collageOpen, setCollageOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(true);
  /* Qikink fulfillment layer */
  const [qikinkSettings, setQikinkSettings] = useState(() => load("drucka-qikink-settings", DEFAULT_QIKINK_SETTINGS));
  const [orders, setOrders] = useState(() => load("drucka-orders", []));
  const [adminOpen, setAdminOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [productMap, setProductMap] = useState(() => load("drucka-product-map", QIKINK_PRODUCT_MAP));

  useEffect(() => save("drucka-cart", cart), [cart]);
  useEffect(() => save("drucka-favs", favs), [favs]);
  useEffect(() => save("drucka-qikink-settings", qikinkSettings), [qikinkSettings]); // non-sensitive only
  useEffect(() => save("drucka-orders", orders), [orders]);
  useEffect(() => save("drucka-product-map", productMap), [productMap]);

  /* ── order lifecycle (Draft → Paid/COD Approved → Sent to Qikink → …) ── */
  const updateOrder = (id, patch) => {
    const next = orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
    setOrders(next);
    syncOrderPatch(id, patch); // best-effort → Supabase via /api/orders
    return next.find((o) => o.id === id);
  };
  const placeOrder = (customer) => {
    const order = {
      id: `DRK-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0),
      paymentMode: customer.paymentMode,
      paymentStatus: customer.paymentMode === "cod" ? "COD Pending Approval" : "Payment Pending",
      qikinkStatus: "Draft",
      qikinkOrderId: null,
    };
    setOrders([order, ...orders]);
    setCart([]); // cart is now an order
    setCartOpen(false);
    syncOrderCreate(order); // best-effort → Supabase (local copy stays the instant UI)
    return order;
  };
  const markPaid = (id) => {
    const o = updateOrder(id, { paymentStatus: "Paid" }); // self-serve claim; team verifies
    showToast("Payment marked — we verify before printing ✓");
    return o;
  };
  /* PRODUCTION handoff: artwork → Cloudinary, order → Qikink, both via
     our backend (/api/upload-artwork, /api/qikink/create-order — the
     secrets live there). If the backend isn't deployed/reachable, falls
     back to the demo console payload so the flow never dead-ends. */
  const sendToQikink = async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return null;
    const problems = validateQikinkOrder(order, productMap);
    if (problems.length) {
      showToast(`⚠ ${problems[0]}`);
      return order;
    }
    const payload = buildQikinkOrderPayload(order, qikinkSettings, productMap);
    try {
      const { qikinkOrderId } = await fulfillOrder(order, payload);
      showToast(`Order sent to Qikink ✓ ${qikinkOrderId}`);
      return updateOrder(id, { qikinkStatus: "Sent to Qikink", qikinkOrderId });
    } catch (err) {
      console.log(`📦 Qikink payload for ${order.id} (backend unreachable — demo fallback):`, payload);
      console.warn("Qikink send failed:", err.message);
      showToast("Backend not connected — demo payload logged (see DEPLOY.md)");
      return updateOrder(id, { qikinkStatus: "Sent to Qikink", qikinkOrderId: `QK-DEMO-${id.slice(4)}` });
    }
  };
  /* Poll real Qikink status (admin ⟳ button) — updates tracking number */
  const refreshOrderStatus = async (o) => {
    try {
      const r = await qikinkApi.orderStatus(o.qikinkOrderId, o.id);
      updateOrder(o.id, { qikinkStatus: r.druckaStatus, tracking: r.tracking ?? o.tracking, courier: r.courier ?? o.courier });
      showToast(`Status: ${r.druckaStatus}${r.tracking ? ` · AWB ${r.tracking}` : ""}`);
    } catch {
      showToast("⚠ Status API unreachable — deploy the backend first (DEPLOY.md)");
    }
  };
  /* Razorpay checkout: backend creates the order, modal collects payment,
     the WEBHOOK is the authoritative "Paid" — this is optimistic UX.
     Throws are caught → customer falls back to manual UPI / COD. */
  const payRazorpay = async (order) => {
    try {
      await payWithRazorpay(order);
      showToast("Payment received ✓ — confirming with the bank");
      return updateOrder(order.id, { paymentStatus: "Paid" });
    } catch (err) {
      showToast(`⚠ ${err.message} — UPI manual option below works too`);
      return null;
    }
  };
  /* Editable product mapping: local always, server best-effort */
  const saveProductMap = async (map) => {
    setProductMap(map);
    try {
      await qikinkApi.saveProductMap(map.map(mapEntryToRow));
      showToast("Product mappings saved to server ✓");
    } catch (err) {
      showToast(`Saved locally — server: ${err.message}`);
    }
  };
  const loadProductMapFromServer = async () => {
    try {
      const { map } = await qikinkApi.getProductMap();
      if (map?.length) {
        setProductMap(map.map(mapRowToEntry));
        showToast(`Loaded ${map.length} mappings from server ✓`);
      } else showToast("No mappings on server yet — run supabase/schema-update.sql");
    } catch {
      showToast("⚠ Mapping API unreachable — using local mappings");
    }
  };
  /* Load canonical orders from Supabase (admin, needs Admin API key) */
  const syncOrdersFromServer = async () => {
    try {
      const { orders: rows } = await qikinkApi.listOrders();
      setOrders(rows);
      showToast(`Loaded ${rows.length} orders from server ✓`);
    } catch (err) {
      showToast(`⚠ ${err.message === "Admin secret required" ? "Set the Admin API key in Settings first" : "Server orders unavailable — showing local orders"}`);
    }
  };

  /* scroll-reveal */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast.t);
    showToast.t = window.setTimeout(() => setToast(null), 2600);
  };

  const addToCart = (item) => setCart((c) => [...c, item]);
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  /* every "customize" entry point on the site lands in the ONE designer */
  const openEditor = (productId = "tshirt") =>
    setDesignerPage({ productId: designerProductById(productId) ? productId : "tshirt" });

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <AnnouncementBar visible={announceOpen} onClose={() => setAnnounceOpen(false)} />
      <FrameNavbar
        topOffset={announceOpen}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        onCollage={() => setCollageOpen(true)}
      />
      {IS_STAGING && (
        <div className="fixed inset-x-0 bottom-0 z-[45] bg-amber-400/95 py-1 text-center text-[11px] font-bold tracking-wide text-amber-950 shadow"
          role="status">
          ⚠ STAGING — sandbox test environment · orders are NOT real · payments disabled (COD testing)
        </div>
      )}
      <main>
        <FrameHero />
        <TrustBar />
        {/* featured promo — photo prints & custom frames (kept highlighted) */}
        <PhotoFramesSection onCustomize={openEditor} />
        {/* existing custom-product business: apparel / kids / gifts designer */}
        <CategoryShowcase onCustomize={openEditor} />
        <BestsellingFrames />
        <FeaturedProduct />
        <GalleryWalls />
        <StatementCollection />
        <MagneticWalls />
        <QualityBanner />
        <SignatureGift />
        <FrameFeatures />
        <FrameTestimonials />
        <StoreLocations />
        <FAQ />
      </main>
      <FrameFooter onTrack={() => setTrackOpen(true)} onAdmin={() => setAdminOpen(true)} />
      <BackToTop />

      {collageOpen && (
        <CollageMaker
          onClose={() => setCollageOpen(false)}
          onAddToCart={addToCart}
          onOpenCart={() => setCartOpen(true)}
          showToast={showToast}
        />
      )}

      {designerPage && (
        <DesignerProductPage
          initialProductId={designerPage.productId}
          onClose={() => setDesignerPage(null)}
          onStartDesigning={({ productId, selections }) => setDesigner({ productId, selections })}
        />
      )}
      {designer && (
        <ProductDesigner
          product={designerProductById(designer.productId)}
          initial={designer.selections}
          onClose={() => setDesigner(null)}
          onAddToCart={addToCart}
          onOpenCart={() => { setDesignerPage(null); setCartOpen(true); }}
          showToast={showToast}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemove={(key) => setCart((c) => c.filter((i) => i.key !== key))}
        onQty={(key, d) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qty: Math.max(1, i.qty + d) } : i)))}
        onCheckout={() => setCheckoutOpen(true)}
      />

      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          total={cart.reduce((s, i) => s + i.price * i.qty, 0)}
          onClose={() => setCheckoutOpen(false)}
          onPlaceOrder={placeOrder}
          onMarkPaid={markPaid}
          onPayRazorpay={payRazorpay}
          onSendToQikink={sendToQikink}
          settings={qikinkSettings}
          showToast={showToast}
        />
      )}

      {trackOpen && <TrackOrderModal onClose={() => setTrackOpen(false)} localOrders={orders} />}

      {adminOpen && (
        <AdminPanel
          onClose={() => setAdminOpen(false)}
          settings={qikinkSettings}
          onSaveSettings={setQikinkSettings}
          orders={orders}
          onUpdateOrder={updateOrder}
          onSendToQikink={sendToQikink}
          onRefreshStatus={refreshOrderStatus}
          onSyncOrders={syncOrdersFromServer}
          productMap={productMap}
          onSaveMap={saveProductMap}
          onLoadMap={loadProductMapFromServer}
          showToast={showToast}
        />
      )}

      <WhatsAppChatbot />

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </>
  );
}
