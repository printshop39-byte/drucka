import { useMemo, useRef, useState } from "react";
import {
  calcPrice, colorById, duplicateOf, fileToDataUrl, inr, newImageLayer, newTextLayer,
  placementOf, uid,
} from "./data";
import { Icon, ic } from "./icons";
import DesignCanvas, { clampToArea } from "./DesignCanvas";
import MockupPreview from "./MockupPreview";
import {
  GraphicsPanel, LayerSettingsPanel, LayersPanel, ProductInfoPanel, TextPanel, UploadsPanel,
} from "./panels";

/* ── ProductEditorShell — the NEW unified, MOBILE-FIRST editor ──
   Strangler-fig: opt-in per product via src/utils/editorFlags.js; everything
   else uses the classic Designer. REUSES the proven canvas, mockup, panels,
   pricing and validation, and emits the exact same cart item as the classic
   editor (checkout / Qikink unaffected).

   ~85% of Drucka traffic is mobile, so the layout is designed for one thumb:
     Mobile:  header · top placement tabs · canvas · bottom sheet · TOOLBAR
     Desktop: header · [sidebar | canvas | settings] · bottom bar
   Bottom toolbar (thumb zone): Text · Image · Color · Layer · Preview · Cart. */

const TOOLS = [
  { id: "text", label: "Text", icon: ic.text },
  { id: "image", label: "Image", icon: ic.upload },
  { id: "color", label: "Color", swatch: true },
  { id: "layer", label: "Layer", icon: ic.layers },
  { id: "preview", label: "Preview", icon: ic.eye },
  { id: "cart", label: "Cart", icon: ic.cart },
];
const PANEL_TOOLS = new Set(["text", "image", "color", "layer", "cart"]);

export default function ProductEditorShell({
  product, initial = {}, onClose, onAddToCart, onOpenCart, showToast, onUseClassic,
}) {
  /* selections — resolved so pricing + cart item match the classic flow exactly */
  const [sel, setSelState] = useState({
    selectedColor: initial.selectedColor ?? product.availableColors[0],
    selectedSize: initial.selectedSize ?? product.availableSizes[Math.min(1, product.availableSizes.length - 1)],
    selectedPrintMethod: initial.selectedPrintMethod ?? product.printingOptions[0].id,
  });
  const setSel = (patch) => setSelState((s) => ({ ...s, ...patch }));
  const [qty, setQty] = useState(1);
  const [title, setTitle] = useState(`Custom ${product.productName}`);

  /* active print area — single (mug/frame/canvas/poster) or multiple (apparel) */
  const [selectedPlacement, setSelectedPlacement] = useState(product.printAreas[0].id);
  const placement = selectedPlacement;
  const switchPlacement = (id) => { setSelectedPlacement(id); setSelectedLayerId(null); };

  const [layersByPlacement, setLayersByPlacement] = useState(() => {
    const base = Object.fromEntries(product.printAreas.map((p) => [p.id, []]));
    if (initial.design?.src) {
      const first = product.printAreas[0];
      base[first.id] = [newImageLayer(initial.design.src, initial.design.name ?? "Design", initial.design.aspect ?? 1, first.inches)];
    }
    return base;
  });

  /* undo / redo (same shape as the classic editor) */
  const historyRef = useRef({ past: [], future: [] });
  const [, forceHistory] = useState(0);
  const liveRef = useRef(null);
  const commit = (next) => {
    historyRef.current.past = [...historyRef.current.past.slice(-39), layersByPlacement];
    historyRef.current.future = [];
    setLayersByPlacement(next);
    forceHistory((n) => n + 1);
  };
  const undo = () => {
    const h = historyRef.current;
    if (!h.past.length) return;
    h.future = [layersByPlacement, ...h.future];
    setLayersByPlacement(h.past[h.past.length - 1]);
    h.past = h.past.slice(0, -1);
    forceHistory((n) => n + 1);
  };
  const redo = () => {
    const h = historyRef.current;
    if (!h.future.length) return;
    h.past = [...h.past, layersByPlacement];
    setLayersByPlacement(h.future[0]);
    h.future = h.future.slice(1);
    forceHistory((n) => n + 1);
  };

  const [activeTool, setActiveTool] = useState("image"); // opens ready to add art
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [zoom, setZoom] = useState(86);
  const [uploadedAssets, setUploadedAssets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("drucka-library") ?? "[]"); } catch { return []; }
  });
  const [uploadBusy, setUploadBusy] = useState(false);

  const layers = layersByPlacement[placement] ?? [];
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const price = useMemo(() => calcPrice({ product, layersByPlacement, ...sel, qty }), [product, layersByPlacement, sel, qty]);
  const hasDesign = price.printed.length > 0;
  const preview = activeTool === "preview";

  /* reseller profit margin (₹ per unit) — 0 keeps the normal customer price */
  const [margin, setMargin] = useState(0);
  const selling = price.unit + (Number(margin) || 0);
  const sellingTotal = selling * qty;

  /* tapping the active panel-tool again closes it (one-handed toggle) */
  const pickTool = (id) => setActiveTool((cur) => (PANEL_TOOLS.has(id) && cur === id ? null : id));

  /* ── layer ops (single history entry per gesture) ── */
  const patchLayer = (id, patch, live = false) => {
    if (live) {
      const base = liveRef.current ?? layersByPlacement;
      const next = { ...base, [placement]: (base[placement] ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)) };
      liveRef.current = next;
      setLayersByPlacement(next);
    } else if (liveRef.current) {
      historyRef.current.past = [...historyRef.current.past.slice(-39), layersByPlacement];
      historyRef.current.future = [];
      liveRef.current = null;
      forceHistory((n) => n + 1);
    } else {
      if (!Object.keys(patch).length) return;
      commit({ ...layersByPlacement, [placement]: (layersByPlacement[placement] ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)) });
    }
  };
  const addLayer = (layer) => {
    commit({ ...layersByPlacement, [placement]: [...layers, clampToArea(layer)] });
    setSelectedLayerId(layer.id);
  };
  const addImage = (src, name, aspect = 1) => addLayer(newImageLayer(src, name, aspect, placementOf(product, placement).inches));
  const addText = (text) => { addLayer(newTextLayer(text)); setActiveTool("text"); };
  const deleteLayer = (id) => {
    commit({ ...layersByPlacement, [placement]: layers.filter((l) => l.id !== id) });
    if (selectedLayerId === id) setSelectedLayerId(null);
  };
  const duplicateLayer = (id) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy = duplicateOf(src);
    commit({ ...layersByPlacement, [placement]: [...layers, clampToArea(copy)] });
    setSelectedLayerId(copy.id);
  };
  const moveLayer = (id, dir) => {
    const idx = layers.findIndex((l) => l.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= layers.length) return;
    const next = [...layers];
    [next[idx], next[to]] = [next[to], next[idx]];
    commit({ ...layersByPlacement, [placement]: next });
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploadBusy(true);
    try {
      const { src, aspect } = await fileToDataUrl(file); // shared validation runs inside
      const entry = { id: uid(), src, aspect, name: file.name };
      const next = [entry, ...uploadedAssets].slice(0, 12);
      setUploadedAssets(next);
      try { localStorage.setItem("drucka-library", JSON.stringify(next)); } catch { /* quota */ }
      addImage(src, file.name, aspect);
    } catch (err) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setUploadBusy(false);
    }
  };

  /* ── add to cart — identical item shape to the classic editor ── */
  const handleAddToCart = () => {
    if (!hasDesign) { showToast("Add a design first — Image or Text"); setActiveTool("image"); return; }
    const design = Object.fromEntries(price.printed.map((p) => [p.id, layersByPlacement[p.id]]));
    const name = title.trim() || `Custom ${product.productName}`;
    onAddToCart({
      key: uid(),
      productId: product.qikinkId,
      type: "custom",
      name,
      price: selling,
      qty,
      size: sel.selectedSize,
      color: colorById(sel.selectedColor)?.label ?? sel.selectedColor,
      printMethod: price.method.label,
      placement: price.printed.map((p) => p.label).join(", "),
      design,
      summary: `${price.method.label} print · ${price.printed.map((p) => p.label).join(", ")}`,
    });
    showToast(`${name} added to cart ✓`);
    onClose();
    onOpenCart();
  };

  /* ── panel content per tool ── */
  const panelFor = (tool) => {
    switch (tool) {
      case "text":
        return <TextPanel selected={selectedLayer} onAddText={addText} onPatch={(id, p) => patchLayer(id, p)} onClose={() => setActiveTool(null)} />;
      case "image":
        return (
          <>
            <UploadsPanel assets={uploadedAssets} onUpload={handleUpload} busy={uploadBusy} onUse={(a) => addImage(a.src, a.name, a.aspect)} onClose={() => setActiveTool(null)} />
            <GraphicsPanel onAddImage={addImage} onClose={() => setActiveTool(null)} />
          </>
        );
      case "color":
        return <ProductInfoPanel product={product} state={sel} setSel={setSel} qty={qty} setQty={setQty} onClose={() => setActiveTool(null)} />;
      case "layer":
        return selectedLayer
          ? <LayerSettingsPanel layer={selectedLayer} product={product} placement={placement} onPatch={(id, p) => patchLayer(id, p)} onClose={() => setSelectedLayerId(null)} />
          : <LayersPanel layers={layers} selectedId={selectedLayerId} onSelect={setSelectedLayerId} onPatch={(id, p) => patchLayer(id, p)} onDelete={deleteLayer} onDuplicate={duplicateLayer} onMove={moveLayer} placementLabel={placementOf(product, placement).label} onClose={() => setActiveTool(null)} />;
      case "cart":
        return (
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Product title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none focus:border-tangerine" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4">
              <span className="min-w-0">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Profit margin (₹ / unit)</span>
                <span className="block text-[10px] text-ink/40">For resellers — keep 0 for the standard price</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-xs font-bold text-ink/45">₹</span>
                <input type="number" min={0} step={10} value={margin}
                  onChange={(e) => setMargin(Math.max(0, +e.target.value || 0))}
                  className="w-20 rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-right text-sm font-bold text-ink outline-none focus:border-tangerine" />
              </span>
            </label>
            <div className="rounded-2xl border border-ink/10 bg-white p-4 text-sm">
              <div className="flex justify-between py-1"><span className="text-ink/55">Product</span><span className="font-bold text-ink">{product.productName}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink/55">Colour · Size</span><span className="font-bold text-ink">{colorById(sel.selectedColor)?.label ?? sel.selectedColor} · {sel.selectedSize}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink/55">Print</span><span className="font-bold text-ink">{price.method.label}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink/55">Base price</span><span className="font-bold text-ink">{inr(price.unit)}</span></div>
              {margin > 0 && (
                <div className="flex justify-between py-1"><span className="text-ink/55">Margin</span><span className="font-bold text-ink">+ {inr(margin)}</span></div>
              )}
              <div className="flex justify-between py-1"><span className="text-ink/55">Quantity</span><span className="font-bold text-ink">{qty}</span></div>
              <div className="mt-2 flex justify-between border-t border-ink/10 pt-2"><span className="text-ink/55">Total</span><span className="text-lg font-extrabold text-ink">{inr(sellingTotal)}</span></div>
            </div>
            <button onClick={handleAddToCart} disabled={!hasDesign}
              className={`w-full rounded-full px-6 py-3 text-sm font-bold transition ${hasDesign ? "bg-tangerine text-white shadow-lg shadow-tangerine/30 hover:brightness-105" : "bg-ink/10 text-ink/35"}`}>
              Add to cart · {inr(sellingTotal)}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  /* colour swatch used as the "Color" tool glyph */
  const swatch = (size) => (
    <span className="rounded-full border border-black/15" style={{ width: size, height: size, backgroundColor: colorById(sel.selectedColor)?.hex ?? "#fff" }} />
  );

  const toolBtn = (t, vertical) => {
    const on = activeTool === t.id;
    return (
      <button key={t.id} onClick={() => pickTool(t.id)} aria-label={t.label} aria-pressed={on}
        className={vertical
          ? `flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition ${on ? "bg-tangerine/10 text-tangerine" : "text-ink/50 hover:bg-ink/4 hover:text-ink"}`
          : `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${on ? "text-tangerine" : "text-ink/55"}`}>
        {t.swatch ? swatch(20) : <Icon d={t.icon} className="h-5 w-5" />}
        {t.label}
      </button>
    );
  };

  const placementTabs = product.printAreas.length > 1 && !preview && (
    <div className="z-20 flex shrink-0 justify-center gap-1.5 overflow-x-auto border-b border-ink/8 bg-white px-3 py-2">
      {product.printAreas.map((p) => {
        const n = (layersByPlacement[p.id] ?? []).filter((l) => l.visible !== false).length;
        return (
          <button key={p.id} onClick={() => switchPlacement(p.id)}
            className={`relative shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
              selectedPlacement === p.id ? "border-tangerine bg-tangerine text-white" : "border-ink/12 bg-white text-ink/60 hover:border-ink/30"
            }`}>
            {p.label}
            {n > 0 && (
              <span className={`absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-black ${selectedPlacement === p.id ? "bg-ink text-white" : "bg-tangerine text-white"}`}>{n}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#f1f0f5]" role="dialog" aria-modal="true" aria-label="Drucka product editor (new)">
      {/* header */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-1.5 border-b border-ink/10 bg-white px-3 sm:px-4">
        <button onClick={onClose} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 hover:text-ink">
          <Icon d={ic.back} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{product.productName}</p>
          <p className="hidden text-[10px] text-ink/45 sm:block">New Editor · Beta</p>
        </div>
        <div className="mx-auto flex items-center gap-1">
          <button onClick={undo} disabled={!historyRef.current.past.length} aria-label="Undo"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-25"><Icon d={ic.undo} className="h-4.5 w-4.5" /></button>
          <button onClick={redo} disabled={!historyRef.current.future.length} aria-label="Redo"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-25"><Icon d={ic.redo} className="h-4.5 w-4.5" /></button>
        </div>
        {/* one-click escape hatch → classic editor, zero downtime */}
        <button onClick={onUseClassic}
          className="rounded-full border border-ink/15 px-2.5 py-1.5 text-[11px] font-bold text-ink/60 transition hover:border-tangerine hover:text-tangerine">
          Classic ↩
        </button>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        {/* DESKTOP left: tool rail + active panel */}
        <aside className="hidden shrink-0 border-r border-ink/10 bg-white lg:flex">
          <nav className="flex w-[76px] shrink-0 flex-col items-center gap-1 border-r border-ink/8 py-3">
            {TOOLS.map((t) => toolBtn(t, true))}
          </nav>
          {activeTool && activeTool !== "preview" && <div className="w-[320px] min-w-0 overflow-y-auto">{panelFor(activeTool)}</div>}
        </aside>

        {/* canvas column */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {placementTabs}
          <div className="relative min-h-0 flex-1">
            {/* price chip — always visible, taps to cart (mobile-friendly) */}
            <button onClick={() => setActiveTool("cart")}
              className="absolute right-2 top-2 z-10 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur">
              {hasDesign ? inr(sellingTotal) : "Add a design"}
            </button>
            {preview ? (
              <MockupPreview product={product} color={sel.selectedColor} layersByPlacement={layersByPlacement} placement={placement} onPlacement={switchPlacement} zoom={zoom} />
            ) : (
              <DesignCanvas product={product} placement={placement} color={sel.selectedColor}
                layers={layers} selectedId={selectedLayerId} onSelect={setSelectedLayerId}
                onPatch={patchLayer} zoom={zoom} preview={false} showToast={showToast} />
            )}
          </div>

          {/* DESKTOP bottom bar: zoom + price + continue */}
          <div className="z-20 hidden shrink-0 items-center gap-3 border-t border-ink/10 bg-white px-4 py-2.5 lg:flex">
            {!preview && (
              <div className="flex items-center gap-2">
                <Icon d={ic.zoomIn} className="h-4 w-4 text-ink/45" />
                <input type="range" min={50} max={160} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-28 accent-tangerine" aria-label="Zoom" />
                <span className="w-10 text-xs font-bold text-ink/50">{zoom}%</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-3">
              {hasDesign ? (
                <div className="text-right leading-tight">
                  <p className="text-lg font-extrabold text-ink">{inr(sellingTotal)}</p>
                  <p className="text-[10px] text-ink/45">{qty > 1 ? `${qty} × ${inr(selling)} · ` : ""}{price.method.label}</p>
                </div>
              ) : (
                <p className="text-xs font-semibold text-ink/45">Add a design to see price</p>
              )}
              <button onClick={() => (hasDesign ? setActiveTool("cart") : showToast("Add a design first — Image or Text"))}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${hasDesign ? "bg-tangerine text-white shadow-lg shadow-tangerine/30 hover:brightness-105" : "bg-ink/10 text-ink/35"}`}>
                {activeTool === "cart" ? "Review ✓" : "Continue →"}
              </button>
            </div>
          </div>
        </div>

        {/* DESKTOP right: selected-layer settings */}
        {!preview && selectedLayer && (
          <aside className="hidden w-[270px] shrink-0 border-l border-ink/10 bg-white xl:block">
            <LayerSettingsPanel layer={selectedLayer} product={product} placement={placement}
              onPatch={(id, p) => patchLayer(id, p)} onClose={() => setSelectedLayerId(null)} />
          </aside>
        )}
      </div>

      {/* MOBILE bottom sheet — the active tool's panel, above the toolbar */}
      {activeTool && activeTool !== "preview" && (
        <div className="shrink-0 border-t border-ink/10 bg-white shadow-[0_-8px_24px_rgba(26,18,8,0.08)] lg:hidden">
          <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-ink/15" />
          <div className="max-h-[46vh] overflow-y-auto overscroll-contain">{panelFor(activeTool)}</div>
        </div>
      )}

      {/* MOBILE bottom toolbar — thumb zone: Text · Image · Color · Layer · Preview · Cart */}
      <nav className="z-30 flex shrink-0 items-stretch justify-around border-t border-ink/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TOOLS.map((t) => toolBtn(t, false))}
      </nav>
    </div>
  );
}
