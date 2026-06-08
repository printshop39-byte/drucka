"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts, type ProductCategory } from "@/data/products";

// Category filter chips + filtered product grid (client-side, no router/URL).
// Hydration-safe: initial filter is the constant "all", products come from
// local data (no window/Date/random during render).
const FILTERS: { key: "all" | ProductCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "apparel", label: "T-Shirts" },
  { key: "drinkware", label: "Mugs" },
  { key: "wall-art", label: "Frames & Canvas" },
  { key: "home", label: "Cushions" },
  { key: "accessories", label: "Keychains" },
];

export default function ProductCategoryStrip() {
  const allProducts = getProducts();
  const [active, setActive] = useState<"all" | ProductCategory>("all");

  const products = active === "all" ? allProducts : allProducts.filter((p) => p.category === active);

  return (
    <>
      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-7 justify-center max-[700px]:justify-start">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-[0.84rem] font-semibold transition border ${
              active === f.key
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-white text-brand-muted border-brand-border hover:border-brand-gold/50 hover:text-brand-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtered grid */}
      <div className="grid gap-5 grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
