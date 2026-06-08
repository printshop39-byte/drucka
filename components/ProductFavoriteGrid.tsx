import ProductCard from "./ProductCard";
import { getProducts } from "@/data/products";

// Product favorites grid — pulls from the central product data and renders
// polished cards. Server component (no client state).
export default function ProductFavoriteGrid() {
  const products = getProducts();
  return (
    <div className="grid gap-5 grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
