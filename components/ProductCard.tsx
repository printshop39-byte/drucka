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

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-white/90 border border-brand-border rounded-premium shadow-soft p-4 transition hover:-translate-y-[6px] hover:shadow-premium hover:border-brand-gold/45">
      <div className="overflow-hidden rounded-2xl bg-brand-mint h-[190px] flex items-center justify-center">
        <MockImage
          src={product.image}
          alt={`${product.name} mockup`}
          emoji={product.fallbackEmoji}
          className="w-full h-full object-contain p-[14px] transition-transform duration-500 group-hover:scale-[1.14]"
          emojiClassName="text-[3rem] transition-transform duration-500 group-hover:scale-[1.14]"
        />
      </div>
      <div className="flex items-center justify-between gap-[10px] mt-4">
        <h3 className="font-body text-[1.05rem] font-bold text-brand-ink">{product.name}</h3>
        {product.badge && (
          <span className={`badge ${badgeClass[product.badge] ?? "badge-green"}`}>{product.badge}</span>
        )}
      </div>
      <p className="text-brand-muted text-[0.85rem] mt-[6px]">{product.description}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="font-bold text-brand-primary">From ₹{product.price}</span>
        <Link href={`/customize?product=${product.id}`} className="btn-mini">Customize →</Link>
      </div>
    </div>
  );
}
