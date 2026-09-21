/* ── PRODUCTS ── (moved verbatim out of App.jsx, 2026-09-21)
   Homepage product cards (name, category, price, image, tag, blurb).

   Extracted UNCHANGED so the derived catalogue in ../productCatalog.js can
   read it. Nothing here is the source of truth yet — see that file for which
   fields currently disagree between the legacy catalogues. */

/* Landing-page catalogue (images live in /public/images/) */
export const PRODUCTS = [
  { id: "tshirt",   name: "Premium T-Shirt",  category: "tshirts",   price: 599, delivery: "2–4 days", img: "/images/tshirt.webp",   tag: "Bestseller", blurb: "Soft cotton, full-colour print" },
  { id: "mug",      name: "Photo Mug",        category: "mugs",      price: 299, delivery: "2–4 days", img: "/images/mug.webp",      tag: "Popular",    blurb: "Personalised ceramic mug" },
  { id: "frame",    name: "Framed Print",     category: "frames",    price: 899, delivery: "2–4 days", img: "/images/frame.webp",    tag: "Premium",    blurb: "Gallery-grade photo frame" },
  { id: "cushion",  name: "Cushion",          category: "cushions",  price: 649, delivery: "2–4 days", img: "/images/cushion.webp",  tag: "Cozy Pick",  blurb: "Soft printed throw cushion" },
  { id: "canvas",   name: "Canvas",           category: "frames",    price: 500, delivery: "2–4 days", img: "/images/canvas.webp",   tag: "Premium",    blurb: "Stretched premium canvas" },
  { id: "keychain", name: "Acrylic Keychain", category: "keychains", price: 149, delivery: "2–4 days", img: "/images/keychain.webp", tag: "Under ₹200", blurb: "Pocket-size photo keepsake" },
  { id: "kids-tshirt", name: "Kids T-Shirt",          category: "kids", price: 449, delivery: "2–4 days", img: "/mockups/kids-tshirt-front-white.png", fallbackImg: "/images/tshirt.webp", tag: "Kids 2–12Y", blurb: "Soft cotton tee for little ones" },
  { id: "kids-hoodie", name: "Kids Hoodie",           category: "kids", price: 799, delivery: "2–4 days", img: "/images/categories/kids-jacket.webp", fallbackImg: "/images/tshirt.webp", tag: "Kids 2–12Y", blurb: "Cozy printed hoodie for kids" },
  { id: "kids-mug",    name: "Kids Mug / School Gift", category: "kids", price: 279, delivery: "2–4 days", img: "/images/mug.webp", tag: "School Gift", blurb: "Break-resistant mug for school" },
];
