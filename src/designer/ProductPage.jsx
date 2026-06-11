import { useState } from "react";
import {
  CATEGORIES, LIGHT_COLORS, colorById, defaultProductFor, inr, productById, productsInCategory,
} from "./data";
import { Icon, ic } from "./icons";

/* ── Product detail page — one reusable page for every catalog product.
   Category tabs (Men / Women / Kids / Children / Gifts) switch products;
   the Start Designing CTA opens the single ProductDesigner. ── */

const Stars = ({ value }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} viewBox="0 0 24 24" className="h-4 w-4"
        fill={i <= Math.round(value) ? "#f2a230" : "#e5e2ec"}>
        <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
      </svg>
    ))}
  </span>
);

function SizeChartModal({ product, onClose }) {
  return (
    <div className="fixed inset-0 z-[98] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Size chart">
      <button className="absolute inset-0 bg-ink/50" onClick={onClose} aria-label="Close size chart" />
      <div className="relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Size chart <span className="text-sm font-medium text-ink/45">(inches)</span></h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-ink/5"><Icon d={ic.close} className="h-4 w-4" /></button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-ink/45">
              <th className="pb-2">Size</th><th className="pb-2">Chest</th><th className="pb-2">Length</th><th className="pb-2 text-right">Extra</th>
            </tr>
          </thead>
          <tbody>
            {product.sizeChart.map((r) => (
              <tr key={r.size} className="border-t border-ink/8">
                <td className="py-1.5 font-bold text-ink">{r.size}</td>
                <td className="py-1.5 text-ink/70">{r.chest}″</td>
                <td className="py-1.5 text-ink/70">{r.length}″</td>
                <td className="py-1.5 text-right text-xs font-semibold text-ink/55">{product.sizeSurcharge?.[r.size] ? `+${inr(product.sizeSurcharge[r.size])}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-ink/45">Measured flat across the garment. Between sizes? Go one up — the fit is classic, not slim.</p>
      </div>
    </div>
  );
}

export default function ProductPage({ initialProductId = "tshirt", onClose, onStartDesigning }) {
  const initial = productById(initialProductId) ?? defaultProductFor("men");
  const [category, setCategory] = useState(initial.category);
  const [productId, setProductId] = useState(initial.productId);
  const p = productById(productId) ?? initial;
  const siblings = productsInCategory(category);

  const [img, setImg] = useState(0);
  const [color, setColor] = useState(p.availableColors[0]);
  const [size, setSize] = useState(p.availableSizes[Math.min(1, p.availableSizes.length - 1)]);
  const [method, setMethod] = useState(p.printingOptions[0].id);
  const [chartOpen, setChartOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const switchProduct = (np) => {
    setProductId(np.productId);
    setImg(0);
    setColor(np.availableColors[0]);
    setSize(np.availableSizes[Math.min(1, np.availableSizes.length - 1)]);
    setMethod(np.printingOptions[0].id);
    setDetailsOpen(false);
  };
  const switchCategory = (cat) => {
    setCategory(cat);
    switchProduct(defaultProductFor(cat));
  };

  const start = () => onStartDesigning({
    productId: p.productId,
    selections: { selectedColor: color, selectedSize: size, selectedPrintMethod: method },
  });

  return (
    <div className="fixed inset-0 z-[94] overflow-y-auto bg-cream" role="dialog" aria-modal="true" aria-label={p.productName}>
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
          <button onClick={onClose} aria-label="Back to Drucka" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/60 hover:bg-ink/5 hover:text-ink">
            <Icon d={ic.back} />
          </button>
          <nav className="min-w-0 truncate text-xs text-ink/50" aria-label="Breadcrumb">
            <span>Product</span><span className="mx-1.5 text-ink/30">/</span>
            <span>{CATEGORIES.find((c) => c.id === category)?.label}</span><span className="mx-1.5 text-ink/30">/</span>
            <span className="font-bold text-ink">{p.productName}</span>
          </nav>
        </div>
        {/* category tabs — ONE designer, every category */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 sm:px-6">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => switchCategory(c.id)}
              className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-xs font-bold transition ${
                category === c.id ? "border-tangerine bg-tangerine text-white" : "border-ink/12 bg-white text-ink/60 hover:border-ink/30"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-10">
        {/* ── gallery ── */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-sm" style={{ aspectRatio: "42/50" }}>
            <img src={(p.gallery[img] ?? p.gallery[0]).src} alt={`${p.productName} — ${(p.gallery[img] ?? p.gallery[0]).label}`} className="h-full w-full object-cover" />
          </div>
          {p.gallery.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.gallery.map((g, i) => (
                <button key={g.src + i} onClick={() => setImg(i)} title={g.label}
                  className={`w-16 overflow-hidden rounded-xl border-2 transition sm:w-20 ${i === img ? "border-tangerine" : "border-ink/10 hover:border-ink/30"}`}
                  style={{ aspectRatio: "42/50" }}>
                  <img src={g.src} alt={g.label} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {/* other products in this category */}
          {siblings.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {siblings.map((sp) => (
                <button key={sp.productId} onClick={() => switchProduct(sp)}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                    sp.productId === p.productId ? "border-ink bg-ink text-white" : "border-ink/12 bg-white text-ink/60 hover:border-ink/30"
                  }`}>
                  {sp.productName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── details ── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{p.productName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Stars value={p.rating} />
            <span className="font-bold text-ink">{p.rating}</span>
            <span className="text-ink/45">({p.reviews.toLocaleString("en-IN")} reviews)</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-ink">
            {inr(p.basePrice)} <span className="text-sm font-semibold text-ink/45">base price · printing extra</span>
          </p>

          {/* printing option */}
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Printing option</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {p.printingOptions.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${method === m.id ? "border-tangerine bg-tangerine/5" : "border-ink/10 bg-white hover:border-ink/25"}`}>
                  <span className="block text-sm font-extrabold text-ink">{m.label}</span>
                  <span className="block text-[11px] text-ink/50">{m.price > 0 ? `+${inr(m.price)} · ` : ""}{m.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* colors */}
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink/45">
              Color · <span className="normal-case text-ink/70">{colorById(color)?.label}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {p.availableColors.map((cid) => (
                <button key={cid} title={colorById(cid)?.label} onClick={() => setColor(cid)}
                  className={`h-10 w-10 rounded-full border-2 transition ${color === cid ? "border-tangerine ring-2 ring-tangerine/35" : "border-ink/15 hover:border-ink/35"}`}
                  style={{ backgroundColor: colorById(cid)?.hex }}>
                  {color === cid && <Icon d={ic.check} className={`mx-auto h-4 w-4 ${LIGHT_COLORS.includes(cid) ? "text-ink" : "text-white"}`} />}
                </button>
              ))}
            </div>
          </div>

          {/* sizes */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Size</p>
              {p.sizeChart && (
                <button onClick={() => setChartOpen(true)} className="flex items-center gap-1 text-xs font-bold text-tangerine hover:underline">
                  <Icon d={ic.ruler} className="h-3.5 w-3.5" /> View Size Chart
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.availableSizes.map((s) => (
                <button key={s} onClick={() => setSize(s)}
                  className={`min-w-12 rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${size === s ? "border-tangerine bg-tangerine text-white" : "border-ink/12 bg-white text-ink/70 hover:border-ink/30"}`}>
                  {s}
                </button>
              ))}
            </div>
            {p.sizeSurcharge?.[size] > 0 && <p className="mt-1.5 text-xs text-ink/50">{size} adds {inr(p.sizeSurcharge[size])}</p>}
          </div>

          {/* highlights */}
          <div className="mt-6 flex flex-wrap gap-2">
            {p.productHighlights.map((h) => (
              <span key={h} className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-bold text-ink/70">{h}</span>
            ))}
          </div>

          {/* details */}
          <button onClick={() => setDetailsOpen(!detailsOpen)} className="mt-4 flex items-center gap-1 text-xs font-bold text-tangerine hover:underline">
            View Details <Icon d={ic.chev} className={`h-3.5 w-3.5 transition ${detailsOpen ? "rotate-90" : ""}`} />
          </button>
          {detailsOpen && <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/65">{p.description}</p>}

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={start}
              className="rounded-full bg-tangerine px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-tangerine/30 transition hover:brightness-105">
              Start Designing →
            </button>
            <p className="text-xs text-ink/50">Free design preview · 2–4 day delivery · printed in India</p>
          </div>
        </div>
      </div>

      {chartOpen && p.sizeChart && <SizeChartModal product={p} onClose={() => setChartOpen(false)} />}
    </div>
  );
}
