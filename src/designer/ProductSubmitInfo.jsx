import { useState } from "react";
import { LIGHT_COLORS, colorById, inr } from "./data";
import { Icon, ic } from "./icons";
import { MiniMockup } from "./MockupPreview";

/* ── Product Info / Submit page ──
   Shown after Continue. Lets the customer name the product, set a profit
   margin (for resellers — 0 keeps the normal price), review pricing and
   submit. Submit adds the item to the existing Drucka cart; Save as Draft
   stores it locally. */

export default function ProductSubmitInfo({
  product, color, size, price, qty, layersByPlacement, onBack, onSubmit, onSaveDraft,
}) {
  const printedAreas = product.printAreas.filter((p) => (layersByPlacement[p.id] ?? []).some((l) => l.visible !== false));
  const galleryAreas = printedAreas.length ? printedAreas : product.printAreas.slice(0, 1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [title, setTitle] = useState(`Custom ${product.productName}`);
  const [description, setDescription] = useState(product.description);
  const [margin, setMargin] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState("");

  const c = colorById(color);
  const selling = price.unit + (Number(margin) || 0);

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && tags.length < 10 && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  };

  const submitPayload = () => ({
    title: title.trim() || `Custom ${product.productName}`,
    description, profitMargin: Number(margin) || 0, highlights: tags, sellingPrice: selling,
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7fa]">
      {/* header */}
      <header className="z-10 flex h-12 shrink-0 items-center gap-2 border-b border-ink/10 bg-white px-3 sm:px-4">
        <button onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-ink/60 transition hover:bg-ink/5 hover:text-ink">
          <Icon d={ic.back} className="h-4 w-4" /> Back to Edit
        </button>
        <p className="mx-auto text-sm font-bold text-ink">Product Information</p>
        <span className="w-24" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-5xl gap-6 p-4 sm:p-6 lg:grid-cols-[340px_1fr]">
          {/* ── left: gallery ── */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <MiniMockup product={product} color={color} placement={galleryAreas[activeIdx] ?? galleryAreas[0]}
              layers={layersByPlacement[(galleryAreas[activeIdx] ?? galleryAreas[0]).id]}
              className="rounded-2xl border border-ink/8 shadow-sm" />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {galleryAreas.map((p, i) => (
                <button key={p.id} onClick={() => setActiveIdx(i)} title={p.label}
                  className={`w-14 overflow-hidden rounded-lg border-2 transition ${i === activeIdx ? "border-tangerine" : "border-ink/10 hover:border-ink/30"}`}>
                  <MiniMockup product={product} color={color} placement={p} layers={layersByPlacement[p.id]} />
                </button>
              ))}
            </div>
          </div>

          {/* ── right: form ── */}
          <div className="space-y-5 pb-24">
            <label className="block">
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Product title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-tangerine" />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Description</span>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-y rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm leading-relaxed text-ink outline-none focus:border-tangerine" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink/10 bg-white p-4">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Primary Display Color</p>
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border-2 border-tangerine ring-2 ring-tangerine/30`}
                    style={{ backgroundColor: c?.hex }}>
                    <Icon d={ic.check} className={`h-4 w-4 ${LIGHT_COLORS.includes(color) ? "text-ink" : "text-white"}`} />
                  </span>
                  <span className="text-sm font-bold text-ink">{c?.label}</span>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink/40">Colors selected</p>
                <p className="text-sm font-semibold text-ink/70">{c?.label}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-ink/40">Sizes selected</p>
                <p className="text-sm font-semibold text-ink/70">{size} × {qty}</p>
              </div>

              <div className="rounded-2xl border border-ink/10 bg-white p-4">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Pricing Details</p>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-ink/55">Price Range</dt><dd className="font-bold text-ink">{inr(price.unit)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink/55">Tax Rate (GST)</dt><dd className="font-bold text-ink">{product.taxRate}%</dd></div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink/55">Profit Margin</dt>
                    <dd className="flex items-center gap-1">
                      <span className="text-xs font-bold text-ink/45">₹</span>
                      <input type="number" min={0} step={10} value={margin}
                        onChange={(e) => setMargin(Math.max(0, +e.target.value || 0))}
                        className="w-20 rounded-lg border border-ink/15 bg-white px-2 py-1 text-right text-sm font-bold text-ink outline-none focus:border-tangerine" />
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[10px] text-ink/40">Price includes {price.method.label} print on {price.printed.length || 1} placement{price.printed.length > 1 ? "s" : ""}. Margin is optional — keep 0 for the standard price.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Product Highlights</p>
                <span className="text-[11px] font-bold text-ink/40">{tags.length}/10</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-tangerine/10 px-2.5 py-1 text-xs font-bold text-tangerine">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                      <Icon d={ic.close} className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {tags.length < 10 && (
                  <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                    onBlur={addTag}
                    placeholder={tags.length ? "Add more…" : "e.g. 100% Cotton — press Enter"}
                    className="min-w-36 flex-1 rounded-lg border border-dashed border-ink/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-tangerine" />
                )}
              </div>
              {product.productHighlights?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.productHighlights.filter((h) => !tags.includes(h)).map((h) => (
                    <button key={h} onClick={() => tags.length < 10 && setTags([...tags, h])}
                      className="rounded-full border border-ink/12 px-2 py-0.5 text-[10px] font-semibold text-ink/50 hover:border-tangerine hover:text-tangerine">
                      + {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* fixed bottom bar */}
      <div className="z-10 flex shrink-0 items-center gap-3 border-t border-ink/10 bg-white px-4 py-3">
        <div className="leading-tight">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">Selling Price</p>
          <p className="text-lg font-extrabold text-ink">{inr(selling * qty)}
            {qty > 1 && <span className="ml-1 text-xs font-semibold text-ink/45">({qty} × {inr(selling)})</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => onSaveDraft(submitPayload())}
            className="rounded-full border-2 border-ink/15 px-5 py-2.5 text-sm font-bold text-ink/70 transition hover:border-ink/35">
            Save as Draft
          </button>
          <button onClick={() => onSubmit(submitPayload())}
            className="rounded-full bg-tangerine px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-tangerine/30 transition hover:brightness-105">
            Submit for Review →
          </button>
        </div>
      </div>
    </div>
  );
}
