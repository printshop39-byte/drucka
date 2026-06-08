import Link from "next/link";
import MockImage from "./MockImage";
import type { Product } from "@/data/products";

const badgeClass: Record<string, string> = {
  Bestseller: "badge-gold",
  "Wall Art": "badge-gold",
  Premium: "badge-dark",
  New: "badge-green",
  Cozy: "badge-green",
  Gift: "badge-green",
};

const categoryLabel: Record<string, string> = {
  apparel: "Apparel",
  drinkware: "Drinkware",
  "wall-art": "Wall Art",
  home: "Home",
  accessories: "Accessories",
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-white border border-brand-border rounded-premium shadow-soft overflow-hidden transition hover:-translate-y-[6px] hover:shadow-premium hover:border-brand-gold/45 flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden bg-brand-mint h-[220px] flex items-center justify-center">
        <span className="absolute top-3 left-3 z-10 text-[0.68rem] font-bold uppercase tracking-wide text-brand-muted bg-white/85 backdrop-blur px-2.5 py-1 rounded-full">
          {categoryLabel[product.category] ?? product.category}
        </span>
        {product.badge && (
          <span className={`absolute top-3 right-3 z-10 badge ${badgeClass[product.badge] ?? "badge-green"}`}>{product.badge}</span>
        )}
        <MockImage
          src={product.image}
          alt={`${product.name} mockup`}
          emoji={product.fallbackEmoji}
          className="w-full h-full object-contain p-[18px] transition-transform duration-500 group-hover:scale-[1.12]"
          emojiClassName="text-[3.4rem] transition-transform duration-500 group-hover:scale-[1.12]"
        />
      </div>

      {/* Body */}
      <div className="p-[18px] flex flex-col flex-1">
        <h3 className="font-body text-[1.05rem] font-bold text-brand-ink">{product.name}</h3>
        <p className="text-brand-muted text-[0.85rem] mt-[5px] flex-1">{product.description}</p>
        <div className="text-[0.78rem] text-brand-muted mt-3">Starting at <span className="font-heading text-[1.15rem] font-extrabold text-brand-primary">₹{product.price}</span></div>
        <div className="text-[0.74rem] text-brand-muted mt-1">🚚 Delivery in 2–4 days</div>
        <div className="flex items-center justify-between mt-3">
          <Link href={`/customize?product=${product.id}`} className="btn-mini">Customize →</Link>
        </div>
      </div>
    </div>
  );
}
