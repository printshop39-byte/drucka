"use client";

import { useState } from "react";
import Link from "next/link";
import MockImage from "@/components/MockImage";
import { getProducts, type ProductCategory } from "@/data/products";

const FILTERS: { key: "all" | ProductCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "apparel", label: "T-Shirts" },
  { key: "drinkware", label: "Mugs" },
  { key: "wall-art", label: "Frames & Canvas" },
  { key: "home", label: "Cushions" },
  { key: "accessories", label: "Keychains" },
];

const categoryLabel: Record<string, string> = {
  apparel: "Apparel", drinkware: "Drinkware", "wall-art": "Wall Art", home: "Home", accessories: "Accessories",
};

// T-shirt opens the advanced editor; everything else uses the simple customizer.
function customizeHref(id: string): string {
  return id === "tshirt" ? "/editor/tshirt" : `/customize?product=${id}`;
}

export default function CatalogGrid() {
  const allProducts = getProducts();
  const [active, setActive] = useState<"all" | ProductCategory>("all");
  const products = active === "all" ? allProducts : allProducts.filter((p) => p.category === active);

  return (
    <>
      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-7">
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

      {/* Product grid */}
      <div className="grid gap-5 grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        {products.map((p) => (
          <div key={p.id} className="group bg-white border border-brand-border rounded-premium shadow-soft overflow-hidden transition hover:-translate-y-[5px] hover:shadow-premium hover:border-brand-gold/45 flex flex-col">
            <div className="relative overflow-hidden bg-brand-mint h-[200px] flex items-center justify-center">
              <span className="absolute top-3 left-3 z-10 text-[0.68rem] font-bold uppercase tracking-wide text-brand-muted bg-white/85 backdrop-blur px-2.5 py-1 rounded-full">
                {categoryLabel[p.category] ?? p.category}
              </span>
              {p.id === "tshirt" && <span className="absolute top-3 right-3 z-10 badge badge-gold">Editor</span>}
              <MockImage
                src={p.image}
                alt={`${p.name} mockup`}
                emoji={p.fallbackEmoji}
                className="w-full h-full object-contain p-[18px] transition-transform duration-500 group-hover:scale-[1.1]"
                emojiClassName="text-[3.2rem] transition-transform duration-500 group-hover:scale-[1.1]"
              />
            </div>
            <div className="p-[18px] flex flex-col flex-1">
              <h3 className="font-body text-[1.05rem] font-bold text-brand-ink">{p.name}</h3>
              <p className="text-brand-muted text-[0.84rem] mt-[4px] flex-1">{p.description}</p>
              <div className="text-[0.78rem] text-brand-muted mt-3">Base price <span className="font-heading text-[1.1rem] font-extrabold text-brand-primary">₹{p.price}</span></div>
              <div className="text-[0.72rem] text-brand-muted mt-1">🚚 Delivery in 2–4 days</div>
              <Link href={customizeHref(p.id)} className="btn-primary w-full mt-3 !text-[0.86rem]">
                {p.id === "tshirt" ? "Open Editor →" : "Customize →"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
