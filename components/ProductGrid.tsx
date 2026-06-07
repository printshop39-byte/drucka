import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-[22px] [grid-template-columns:repeat(3,1fr)] max-[900px]:[grid-template-columns:1fr_1fr] max-[680px]:[grid-template-columns:1fr]">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
