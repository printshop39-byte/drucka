"use client";

import { useState } from "react";
import Link from "next/link";
import MockImage from "@/components/MockImage";
import { useCart } from "@/components/CartContext";
import type { Product } from "@/data/products";

// Brand-tinted color swatches (white/grey/black) — the DRUCKA palette equivalent
// of the template's color picker. Garment colors only matter for apparel/home.
const SWATCHES = [
  { id: "white", label: "White", hex: "#FFFFFF", border: true },
  { id: "grey", label: "Grey", hex: "#9AA0A6", border: false },
  { id: "black", label: "Black", hex: "#1A1A1A", border: false },
];

const categoryLabel: Record<string, string> = {
  apparel: "Apparel", drinkware: "Drinkware", "wall-art": "Wall Art", home: "Home", accessories: "Accessories",
};

const HIGHLIGHTS = [
  "Premium full-color printing",
  "Crisp, fade-resistant colors",
  "Gift-ready packaging",
  "Delivered in 2–4 days",
];

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const hasSizes = product.sizes.length > 0;
  const hasColor = product.category === "apparel" || product.category === "home";

  const [size, setSize] = useState<string>(product.sizes[0] ?? "");
  const [color, setColor] = useState<string>("white");
  const [added, setAdded] = useState(false);

  // T-shirt opens the advanced editor; everything else uses the simple customizer.
  const customizeHref = product.id === "tshirt" ? "/editor/tshirt" : `/customize?product=${product.id}`;

  function addToCart() {
    const metaParts = [
      hasColor ? `Color ${SWATCHES.find((s) => s.id === color)?.label}` : null,
      "Blank — customize after",
    ].filter(Boolean);
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        fallbackEmoji: product.fallbackEmoji,
        size: hasSizes ? size : undefined,
        meta: metaParts.join(" · "),
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="bg-brand-cream">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="wrap pt-6">
        <ol className="flex items-center gap-2 text-[0.84rem]">
          <li><Link href="/catalog" className="font-medium text-brand-muted hover:text-brand-primary">Catalog</Link></li>
          <li className="text-brand-border">/</li>
          <li><Link href="/catalog" className="font-medium text-brand-muted hover:text-brand-primary">{categoryLabel[product.category] ?? product.category}</Link></li>
          <li className="text-brand-border">/</li>
          <li aria-current="page" className="font-semibold text-brand-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="wrap pt-8 pb-16 grid gap-10 lg:[grid-template-columns:1.1fr_1fr] items-start">
        {/* Gallery */}
        <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
          <div className="col-span-2 bg-white border border-brand-border rounded-premium shadow-soft overflow-hidden aspect-[4/3] flex items-center justify-center bg-brand-mint">
            <MockImage
              src={product.image}
              alt={`${product.name} main`}
              emoji={product.fallbackEmoji}
              className="w-full h-full object-contain p-8"
              emojiClassName="text-[6rem]"
            />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="bg-brand-mint border border-brand-border rounded-premium overflow-hidden aspect-square flex items-center justify-center">
              <MockImage
                src={product.image}
                alt={`${product.name} view ${i + 2}`}
                emoji={product.fallbackEmoji}
                className="w-full h-full object-contain p-6 opacity-90"
                emojiClassName="text-[3.4rem]"
              />
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-[92px]">
          {product.badge && <span className="eyebrow mb-3">{product.badge}</span>}
          <h1 className="font-heading text-[clamp(1.8rem,4vw,2.6rem)] mt-2">{product.name}</h1>
          <p className="font-heading text-[2rem] font-extrabold text-brand-primary mt-2">From ₹{product.price}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-brand-gold tracking-[2px]">★★★★★</span>
            <span className="text-brand-muted text-[0.84rem]">4.9 · 117 reviews</span>
          </div>

          <p className="text-brand-muted text-[0.96rem] mt-5">{product.description} Upload your photo, text or artwork and we&apos;ll print it in premium quality.</p>

          {/* Color */}
          {hasColor && (
            <div className="mt-7">
              <h3 className="text-[0.82rem] font-bold text-brand-ink">Color</h3>
              <div className="flex items-center gap-3 mt-3">
                {SWATCHES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setColor(s.id)}
                    aria-label={s.label}
                    title={s.label}
                    className={`w-9 h-9 rounded-full border-2 transition ${color === s.id ? "border-brand-gold shadow-glow" : s.border ? "border-brand-border" : "border-transparent"}`}
                    style={{ background: s.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {hasSizes && (
            <div className="mt-7">
              <h3 className="text-[0.82rem] font-bold text-brand-ink">Size</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[44px] px-3 h-11 rounded-[0.7rem] border text-[0.86rem] font-bold transition ${
                      size === s ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-brand-ink border-brand-border hover:border-brand-gold/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-9">
            <Link href={customizeHref} className="btn-primary flex-1 min-w-[180px] justify-center">
              Customize →
            </Link>
            <button onClick={addToCart} className="btn-secondary flex-1 min-w-[160px] justify-center">
              {added ? "✓ Added to Cart" : "Add to Cart"}
            </button>
          </div>
          <p className="text-[0.76rem] text-brand-muted mt-3">🚚 Delivery in 2–4 days · 🔒 Secure checkout · 💬 WhatsApp support</p>

          {/* Highlights */}
          <div className="mt-9 border-t border-brand-border pt-6">
            <h3 className="text-[0.82rem] font-bold text-brand-ink">Highlights</h3>
            <ul className="list-disc pl-5 mt-3 space-y-1.5 text-[0.88rem] text-brand-muted">
              {HIGHLIGHTS.map((h) => <li key={h}><span className="text-brand-ink">{h}</span></li>)}
            </ul>
          </div>

          {/* Details */}
          <div className="mt-7">
            <h3 className="text-[0.82rem] font-bold text-brand-ink">Details</h3>
            <p className="text-[0.88rem] text-brand-muted mt-3">
              {product.name} is made for gifting — printed on demand with your custom design.
              Use the {product.id === "tshirt" ? "design editor" : "customizer"} to upload artwork,
              add text and preview before you order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
