import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/product/ProductDetail";
import { getProducts, getProductById } from "@/data/products";

// Prerender a page for every product id.
export function generateStaticParams() {
  return getProducts().map((p) => ({ id: p.id }));
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);
  if (!product) notFound();

  return (
    <>
      <Navbar active="products" />
      <ProductDetail product={product} />
      <Footer />
    </>
  );
}
