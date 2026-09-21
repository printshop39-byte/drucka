/* ── CATALOG_CARDS ── (moved verbatim out of App.jsx, 2026-09-21)
   Shop-catalogue cards (title, price, imagery).

   Extracted UNCHANGED so the derived catalogue in ../productCatalog.js can
   read it. Nothing here is the source of truth yet — see that file for which
   fields currently disagree between the legacy catalogues. */

/* "From ₹" on the homepage cards. These are a SECOND copy of prices that
   really live in designer/data.js, so they drift — canvas advertised ₹999
   here for a while after its sizes moved to Qikink's and its cheapest became
   ₹500. Five of the six equal the product's basePrice; the tee is the odd one
   out at 599 against a real cheapest of 429 (basePrice 349 + DTG 80), which
is a pricing decision rather than a bug, so it is left alone. */

export const CATALOG_CARDS = [
  { productId: "tshirt",   title: "Premium T-Shirt", price: 599, img: "/designs/catalog-1-800.webp", img400: "/designs/catalog-1-400.webp", alt: "Custom printed premium cotton t-shirt by Drucka" },
  { productId: "mug",      title: "Photo Mug",       price: 299, img: "/designs/catalog-2-800.webp", img400: "/designs/catalog-2-400.webp", alt: "Personalised photo mug printed by Drucka" },
  { productId: "frame",    title: "Framed Print",    price: 899, img: "/designs/catalog-3-800.webp", img400: "/designs/catalog-3-400.webp", alt: "Custom framed photo print in a premium frame by Drucka" },
  { productId: "cushion",  title: "Cushion",         price: 649, img: "/designs/catalog-4-800.webp", img400: "/designs/catalog-4-400.webp", alt: "Personalised photo cushion cover printed by Drucka" },
  { productId: "canvas",   title: "Canvas",          price: 500, img: "/designs/catalog-5-800.webp", img400: "/designs/catalog-5-400.webp", alt: "Gallery-wrapped custom canvas print by Drucka" },
  { productId: "keychain", title: "Keychain",        price: 149, img: "/designs/catalog-6-800.webp", img400: "/designs/catalog-6-400.webp", alt: "Personalised acrylic photo keychain by Drucka" },
];
