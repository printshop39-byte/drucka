import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogGrid from "@/components/catalog/CatalogGrid";

export default function CatalogPage() {
  return (
    <>
      <Navbar active="products" />

      <div className="pt-[34px] pb-[10px]">
        <div className="wrap">
          <span className="eyebrow">Catalog</span>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] mt-3">Product Catalog</h1>
          <p className="text-brand-muted mt-[6px]">Choose a product and start designing.</p>
        </div>
      </div>

      <div className="wrap pb-16 pt-6">
        <CatalogGrid />
      </div>

      <Footer />
    </>
  );
}
