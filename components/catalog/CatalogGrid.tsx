"use client";

import { useState } from "react";
import Link from "next/link";
import MockImage from "@/components/MockImage";
import FilterChips from "@/components/ui/FilterChips";
import EmptyState from "@/components/ui/EmptyState";
import { getProducts, type ProductCategory } from "@/data/products";

type FilterKey = "all" | ProductCategory;
const FILTERS: { key: FilterKey; label: string }[] = [
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
function editorHref(id: string): string {
  return id === "tshirt" ? "/editor/tshirt" : `/customize?product=${id}`;
}

export default function CatalogGrid() {
  const allProducts = getProducts();
  const [active, setActive] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const products = allProducts
    .filter((p) => active === "all" || p.category === active)
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));

  return (
    <>
      {/* Toolbar: search + filter chips */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-[0.95rem]">🔍</span>
          <input
            className="input-premium !pl-9 !py-[0.6rem] !text-[0.9rem]"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <span className="muted-label">{products.length} product{products.length === 1 ? "" : "s"}</span>
      </div>

      <FilterChips options={FILTERS} active={active} onChange={setActive} className="mb-7" />

      {/* Product grid or empty state */}
      {products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          message="Try a different category or search term."
          action={<button onClick={() => { setActive("all"); setQuery(""); }} className="btn-ghost">Clear filters</button>}
        />
      ) : (
        <div className="grid gap-5 grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {products.map((p) => (
            <article key={p.id} className="group card-standard card-hover overflow-hidden flex flex-col">
              <div className="relative overflow-hidden bg-brand-mint h-[200px] flex items-center justify-center">
                <span className="absolute top-3 left-3 z-10 text-[0.68rem] font-bold uppercase tracking-wide text-brand-muted bg-white/85 backdrop-blur px-2.5 py-1 rounded-full">
                  {categoryLabel[p.category] ?? p.category}
                </span>
                {p.badge && <span className="absolute top-3 right-3 z-10 badge badge-gold">{p.badge}</span>}
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
                <div className="text-[0.78rem] text-brand-muted mt-3">Starting at <span className="font-heading text-[1.1rem] font-extrabold text-brand-primary">₹{p.price}</span></div>
                <div className="text-[0.72rem] text-brand-muted mt-1">🚚 Delivery in 2–4 days</div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/product/${p.id}`} className="btn-ghost flex-1 justify-center !text-[0.82rem] !py-[0.55rem]">View Product</Link>
                  <Link href={editorHref(p.id)} className="btn-primary flex-1 justify-center !text-[0.82rem] !py-[0.55rem]">Customize</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
