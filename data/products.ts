// Central product data for Drucka.
// For now this is local TypeScript. Later, swap getProducts() to read from
// Supabase / Firebase / a CMS without changing the components that consume it.

export type ProductCategory =
  | "apparel"
  | "drinkware"
  | "wall-art"
  | "home"
  | "accessories";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;            // base price in INR
  image: string;            // path under /public
  fallbackEmoji: string;    // shown if image fails to load
  sizes: string[];          // available sizes (empty if N/A)
  description: string;
  customizable: boolean;
  badge?: string;           // optional marketing badge
}

export const products: Product[] = [
  {
    id: "tshirt",
    name: "Premium T-Shirt",
    category: "apparel",
    price: 599,
    image: "/assets/tshirt-mockup.png",
    fallbackEmoji: "👕",
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Soft cotton, full-color print.",
    customizable: true,
    badge: "Bestseller",
  },
  {
    id: "mug",
    name: "Photo Mug",
    category: "drinkware",
    price: 299,
    image: "/assets/mug-mockup.png",
    fallbackEmoji: "☕",
    sizes: [],
    description: "Personalised ceramic mug.",
    customizable: true,
    badge: "New",
  },
  {
    id: "frame",
    name: "Framed Print",
    category: "wall-art",
    price: 899,
    image: "/assets/frame-mockup.png",
    fallbackEmoji: "🖼️",
    sizes: ["A4", "A3"],
    description: "Gallery-grade photo frame.",
    customizable: true,
    badge: "Premium",
  },
  {
    id: "cushion",
    name: "Cushion",
    category: "home",
    price: 649,
    image: "/assets/cushion-mockup.png",
    fallbackEmoji: "🛋️",
    sizes: ['12"', '16"'],
    description: "Soft printed throw cushion.",
    customizable: true,
    badge: "Cozy",
  },
  {
    id: "canvas",
    name: "Canvas",
    category: "wall-art",
    price: 999,
    image: "/assets/canvas-mockup.png",
    fallbackEmoji: "🎨",
    sizes: ["A3", "A2"],
    description: "Stretched premium canvas.",
    customizable: true,
    badge: "Wall Art",
  },
  {
    id: "keychain",
    name: "Keychain",
    category: "accessories",
    price: 149,
    image: "/assets/keychain-mockup.png",
    fallbackEmoji: "🔑",
    sizes: [],
    description: "Custom acrylic keychain.",
    customizable: true,
    badge: "Gift",
  },
];

// --- Accessors (swap these for async DB/CMS calls later) ---
export function getProducts(): Product[] {
  return products;
}
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
export function getCustomizableProducts(): Product[] {
  return products.filter((p) => p.customizable);
}
