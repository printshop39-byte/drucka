import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogGrid from "@/components/catalog/CatalogGrid";

const WHATSAPP_HELP = "https://wa.me/917083811355?text=" + encodeURIComponent("Hi DRUCKA, I need help choosing a product.");

export default function CatalogPage() {
  return (
    <>
      <Navbar active="products" />

      <div className="container-page pt-[34px] pb-[10px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="eyebrow">Catalog</span>
            <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] mt-3">Product Catalog</h1>
            <p className="text-brand-muted mt-[6px]">Choose a product and start designing.</p>
          </div>
          <a href={WHATSAPP_HELP} target="_blank" rel="noopener noreferrer" className="btn-ghost !text-[0.84rem]">💬 Need help?</a>
        </div>
      </div>

      <div className="container-page pb-16 pt-6">
        <CatalogGrid />
      </div>

      <Footer />
    </>
  );
}
