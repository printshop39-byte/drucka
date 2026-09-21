/* ── EDITOR_PRODUCTS ── (moved verbatim out of App.jsx, 2026-09-21)
   The inline editor's product list (price, cost, sizes, print area box).

   Extracted UNCHANGED so the derived catalogue in ../productCatalog.js can
   read it. Nothing here is the source of truth yet — see that file for which
   fields currently disagree between the legacy catalogues. */

/* ═══ EDITOR CATALOGUE — blank mockups, prices, print areas ═══
   area = printable area in % of the 420×500 canvas
printArea = real-world size shown in the variants panel      */

export const EDITOR_PRODUCTS = [
  { id: "tshirt",    name: "Regular T-Shirt",   price: 599, cost: 359, sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], apparel: true,  printArea: "30 × 40 cm", area: { left: 29.5, top: 23, width: 41, height: 46 } },
  { id: "oversized", name: "Oversized T-Shirt", price: 699, cost: 419, sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], apparel: true,  printArea: "35 × 45 cm", area: { left: 28.5, top: 24, width: 43, height: 47 } },
  { id: "hoodie",    name: "Hoodie",            price: 999, cost: 649, sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], apparel: true,  printArea: "28 × 30 cm", area: { left: 33, top: 27, width: 34, height: 27 } },
  { id: "mug",       name: "Photo Mug",         price: 299, cost: 179, sizes: ["325 ml"],                   apparel: false, printArea: "20 × 9 cm",  area: { left: 33, top: 35, width: 34, height: 33 } },
  { id: "frame",     name: "Framed Print",      price: 899, cost: 539, sizes: ["A4", "A3"],                 apparel: false, printArea: "21 × 30 cm", area: { left: 35, top: 24, width: 30, height: 42 } },
  { id: "cushion",   name: "Cushion",           price: 649, cost: 389, sizes: ['16"', '18"'],               apparel: false, printArea: "40 × 40 cm", area: { left: 31, top: 27, width: 38, height: 38 } },
  { id: "canvas",    name: "Canvas",            price: 500, cost: 250, sizes: ['8×8"', '8×12"', '16×20"', '20×30"'], apparel: false, printArea: "20 × 20 cm", area: { left: 31.5, top: 21, width: 39, height: 54 } },
  { id: "keychain",  name: "Acrylic Keychain",  price: 149, cost: 79,  sizes: ["Standard"],                 apparel: false, printArea: "3 × 5 cm",   area: { left: 39.5, top: 35.5, width: 21, height: 28 } },
  { id: "kids-tshirt", name: "Kids T-Shirt",           price: 449, cost: 269, sizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], apparel: true,  kids: true, printArea: "25 × 32 cm", area: { left: 31, top: 26, width: 38, height: 42 } },
  { id: "kids-hoodie", name: "Kids Hoodie",            price: 799, cost: 499, sizes: ["2Y", "4Y", "6Y", "8Y", "10Y", "12Y", "14Y"], apparel: true,  kids: true, printArea: "22 × 26 cm", area: { left: 33, top: 28, width: 34, height: 26 } },
  { id: "kids-mug",    name: "Kids Mug / School Gift", price: 279, cost: 159, sizes: ["250 ml"],                                  apparel: false, kids: true, printArea: "18 × 8 cm",  area: { left: 33, top: 35, width: 34, height: 33 } },
];
