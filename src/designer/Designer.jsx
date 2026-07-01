import { useMemo, useRef, useState } from "react";
import {
  calcPrice, colorById, duplicateOf, fileToDataUrl, inr, newImageLayer, newTextLayer,
  placementOf, uid,
} from "./data";
import { Icon, ic } from "./icons";
import DesignCanvas, { clampToArea } from "./DesignCanvas";
import MockupPreview from "./MockupPreview";
import ProductSubmitInfo from "./ProductSubmitInfo";
import {
  GraphicsPanel, LayerSettingsPanel, LayersPanel, ProductInfoPanel, TextPanel, UploadsPanel,
} from "./panels";

/* ── ProductDesigner — THE single Drucka design editor ──
   Fully data-driven: pass any catalog product (men / women / kids /
   children / gifts) and the placements, mockups, colors, sizes and
   pricing all follow. Shared state:
     selectedProduct · selectedColor · selectedSize · selectedPrintMethod ·
     selectedPlacement · layersByPlacement · selectedLayerId ·
     uploadedAssets · zoom · mode (design|preview) · profitMargin (submit) */

const TOOLS = [
  { id: "product", label: "Product", icon: ic.shirt },
  { id: "layers", label: "Layers", icon: ic.layers },
  { id: "uploads", label: "Uploads", icon: ic.upload },
  { id: "text", label: "Text", icon: ic.text },
  { id: "graphics", label: "Graphics", icon: ic.sticker },
];

export default function ProductDesigner({ product, initial = {}, onClose, onAddToCart, onOpenCart, showToast }) {
  /* selections */
  const [sel, setSelState] = useState({
    selectedColor: initial.selectedColor ?? product.availableColors[0],
    selectedSize: initial.selectedSize ?? product.availableSizes[Math.min(1, product.availableSizes.length - 1)],
    selectedPrintMethod: initial.selectedPrintMethod ?? product.printingOptions[0].id,
  });
  const setSel = (patch) => setSelState((s) => ({ ...s, ...patch }));
  const [qty, setQty] = useState(1);

  /* designs per placement + undo/redo history.
     A ready-made design (initial.design) seeds the first print area so the
     editor opens with the artwork already placed — customer can tweak & buy. */
  const emptyAreas = () => {
    const base = Object.fromEntries(product.printAreas.map((p) => [p.id, []]));
    if (initial.design?.src) {
      const first = product.printAreas[0];
      base[first.id] = [
        newImageLayer(initial.design.src, initial.design.name ?? "Design", initial.design.aspect ?? 1, first.inches),
      ];
    }
    return base;
  };
  const [layersByPlacement, setLayersByPlacement] = useState(emptyAreas);
  const historyRef = useRef({ past: [], future: [] });
  const [, forceHistory] = useState(0);
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

  /* editor chrome */
  const [selectedPlacement, setSelectedPlacement] = useState(product.printAreas[0].id);
  const [tool, setTool] = useState("product"); // null = panel collapsed
  const [mode, setMode] = useState("design"); // design | preview
  const [step, setStep] = useState("design"); // design | submit
  const [zoom, setZoom] = useState(86);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [mobilePanel, setMobilePanel] = useState(null);

  /* uploaded assets (session library, persisted) */
  const [uploadedAssets, setUploadedAssets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("drucka-library") ?? "[]"); } catch { return []; }
  });
  const [uploadBusy, setUploadBusy] = useState(false);

  const layers = layersByPlacement[selectedPlacement] ?? [];
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const price = useMemo(
    () => calcPrice({ product, layersByPlacement, ...sel, qty }),
    [product, layersByPlacement, sel, qty]
  );
  const hasDesign = price.printed.length > 0;

  /* ── layer ops (single history entry per gesture) ── */
  const liveRef = useRef(null);
  const patchLayer = (id, patch, live = false) => {
    if (live) {
      const base = liveRef.current ?? layersByPlacement;
      const next = { ...base, [selectedPlacement]: (base[selectedPlacement] ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)) };
      liveRef.current = next;
      setLayersByPlacement(next);
    } else if (liveRef.current) {
      historyRef.current.past = [...historyRef.current.past.slice(-39), layersByPlacement];
      historyRef.current.future = [];
      liveRef.current = null;
      forceHistory((n) => n + 1);
    } else {
      if (!Object.keys(patch).length) return;
      commit({ ...layersByPlacement, [selectedPlacement]: (layersByPlacement[selectedPlacement] ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)) });
    }
  };
  const addLayer = (layer) => {
    commit({ ...layersByPlacement, [selectedPlacement]: [...layers, clampToArea(layer)] });
    setSelectedLayerId(layer.id);
  };
  const addImage = (src, name, aspect = 1) => {
    addLayer(newImageLayer(src, name, aspect, placementOf(product, selectedPlacement).inches));
    setMobilePanel(null);
  };
  const addText = (text) => {
    addLayer(newTextLayer(text));
    setTool("text");
  };
  const deleteLayer = (id) => {
    commit({ ...layersByPlacement, [selectedPlacement]: layers.filter((l) => l.id !== id) });
    if (selectedLayerId === id) setSelectedLayerId(null);
  };
  const duplicateLayer = (id) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy = duplicateOf(src);
    commit({ ...layersByPlacement, [selectedPlacement]: [...layers, clampToArea(copy)] });
    setSelectedLayerId(copy.id);
  };
  const moveLayer = (id, dir) => {
    const idx = layers.findIndex((l) => l.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= layers.length) return;
    const next = [...layers];
    [next[idx], next[to]] = [next[to], next[idx]];
    commit({ ...layersByPlacement, [selectedPlacement]: next });
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!/image\/(png|jpe?g|svg\+xml)/.test(file.type)) {
      showToast("⚠ Please upload a PNG, JPG or SVG file");
      return;
    }
    setUploadBusy(true);
    try {
      const { src, aspect } = await fileToDataUrl(file);
      const entry = { id: uid(), src, aspect, name: file.name };
      const next = [entry, ...uploadedAssets].slice(0, 12);
      setUploadedAssets(next);
      try { localStorage.setItem("drucka-library", JSON.stringify(next)); } catch { /* quota — keep in memory */ }
      addImage(src, file.name, aspect);
    } catch (err) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setUploadBusy(false);
    }
  };

  /* ── submit step → cart (same item shape the existing checkout expects) ── */
  const cartItem = (info) => {
    const design = Object.fromEntries(price.printed.map((p) => [p.id, layersByPlacement[p.id]]));
    return {
      key: uid(),
      productId: product.qikinkId, // existing Qikink product-map key
      type: "custom",
      name: info.title,
      price: info.sellingPrice,
      qty,
      size: sel.selectedSize,
      color: colorById(sel.selectedColor)?.label ?? sel.selectedColor,
      printMethod: price.method.label,
      placement: price.printed.map((p) => p.label).join(", "),
      design,
      summary: `${price.method.label} print · ${price.printed.map((p) => p.label).join(", ")}`,
    };
  };
  const handleSubmit = (info) => {
    onAddToCart(cartItem(info));
    showToast(`${info.title} added to cart ✓`);
    onClose();
    onOpenCart();
  };
  const handleSaveDraft = (info) => {
    try {
      const drafts = JSON.parse(localStorage.getItem("drucka-saved-products") ?? "[]");
      localStorage.setItem("drucka-saved-products", JSON.stringify([
        { id: uid(), savedAt: Date.now(), productId: product.productId, ...sel, qty, layersByPlacement, info },
        ...drafts,
      ].slice(0, 10)));
      showToast("Draft saved ✓");
    } catch {
      showToast("⚠ Could not save draft (storage full)");
    }
  };

  const panelFor = (id, mobile = false) => {
    const close = mobile ? () => setMobilePanel(null) : () => setTool(null);
    switch (id) {
      case "product":
        return <ProductInfoPanel product={product} state={sel} setSel={setSel} qty={qty} setQty={setQty} onClose={close} />;
      case "layers":
        return (
          <LayersPanel layers={layers} selectedId={selectedLayerId}
            onSelect={(i) => { setSelectedLayerId(i); if (mobile) setMobilePanel(null); }}
            onPatch={(id2, p) => patchLayer(id2, p)} onDelete={deleteLayer}
            onDuplicate={duplicateLayer} onMove={moveLayer}
            placementLabel={placementOf(product, selectedPlacement).label} onClose={close} />
        );
      case "uploads":
        return <UploadsPanel assets={uploadedAssets} onUpload={handleUpload} busy={uploadBusy}
          onUse={(a) => addImage(a.src, a.name, a.aspect)} onClose={close} />;
      case "text":
        return <TextPanel selected={selectedLayer} onAddText={addText} onPatch={(id2, p) => patchLayer(id2, p)} onClose={close} />;
      case "graphics":
        return <GraphicsPanel onAddImage={addImage} onClose={close} />;
      default:
        return null;
    }
  };

  const preview = mode === "preview";

  /* ── SUBMIT STEP ── */
  if (step === "submit") {
    return (
      <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Product information">
        <ProductSubmitInfo product={product} color={sel.selectedColor} size={sel.selectedSize}
          price={price} qty={qty} layersByPlacement={layersByPlacement}
          onBack={() => setStep("design")} onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#f1f0f5]" role="dialog" aria-modal="true" aria-label="Drucka product designer">
      {/* ─── header ─── */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-1.5 border-b border-ink/10 bg-white px-3 sm:px-4">
        <button onClick={onClose} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 hover:text-ink">
          <Icon d={ic.back} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{product.productName}</p>
          <p className="hidden text-[10px] text-ink/45 sm:block">Drucka Design Studio</p>
        </div>

        {!preview && (
          <div className="ml-2 hidden items-center gap-0.5 border-l border-ink/10 pl-2 sm:flex">
            <button onClick={() => selectedLayer && duplicateLayer(selectedLayer.id)} disabled={!selectedLayer}
              title="Duplicate layer" aria-label="Duplicate layer"
              className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-25">
              <Icon d={ic.copy} className="h-4.5 w-4.5" />
            </button>
            <button onClick={() => setZoom(86)} title="Fit to screen" aria-label="Fit to screen"
              className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5">
              <Icon d={ic.fit} className="h-4.5 w-4.5" />
            </button>
            <button onClick={() => selectedLayer && deleteLayer(selectedLayer.id)} disabled={!selectedLayer}
              title="Delete layer" aria-label="Delete layer"
              className="grid h-9 w-9 place-items-center rounded-full text-red-400 hover:bg-red-50 disabled:opacity-25">
              <Icon d={ic.trash} className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        <div className="mx-auto flex items-center gap-1">
          <button onClick={undo} disabled={!historyRef.current.past.length} aria-label="Undo"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-25"><Icon d={ic.undo} className="h-4.5 w-4.5" /></button>
          <button onClick={redo} disabled={!historyRef.current.future.length} aria-label="Redo"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:bg-ink/5 disabled:opacity-25"><Icon d={ic.redo} className="h-4.5 w-4.5" /></button>
          <div className="ml-1 flex rounded-full bg-ink/6 p-0.5" role="tablist" aria-label="Editor mode">
            {["design", "preview"].map((m) => (
              <button key={m} role="tab" aria-selected={mode === m}
                onClick={() => { setMode(m); setSelectedLayerId(null); }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition sm:px-4 ${mode === m ? "bg-white text-tangerine shadow" : "text-ink/55"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 md:flex">
          <Icon d={ic.check} className="h-3.5 w-3.5" /> Auto-saved
        </span>
      </header>

      {/* ─── body ─── */}
      <div className="flex min-h-0 flex-1">
        {/* left toolbar + panel (desktop) */}
        {!preview && (
          <aside className={`hidden shrink-0 border-r border-ink/10 bg-white lg:flex ${tool ? "w-[340px]" : "w-[76px]"}`}>
            <nav className="flex w-[76px] shrink-0 flex-col items-center gap-1 border-r border-ink/8 py-3">
              {TOOLS.map((t) => (
                <button key={t.id} onClick={() => setTool(tool === t.id ? null : t.id)}
                  className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition ${
                    tool === t.id ? "bg-tangerine/10 text-tangerine" : "text-ink/50 hover:bg-ink/4 hover:text-ink"
                  }`}>
                  <Icon d={t.icon} className="h-5 w-5" />
                  {t.label}
                </button>
              ))}
            </nav>
            {tool && <div className="min-w-0 flex-1">{panelFor(tool)}</div>}
          </aside>
        )}

        {/* canvas column */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* placement switcher (design mode; preview has its own thumbnails) */}
          {!preview && (
            <div className="z-20 flex shrink-0 justify-center gap-1.5 overflow-x-auto px-3 py-2.5">
              {product.printAreas.map((p) => {
                const n = (layersByPlacement[p.id] ?? []).filter((l) => l.visible !== false).length;
                return (
                  <button key={p.id} onClick={() => { setSelectedPlacement(p.id); setSelectedLayerId(null); }}
                    className={`relative shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                      selectedPlacement === p.id ? "border-tangerine bg-tangerine text-white" : "border-ink/12 bg-white text-ink/60 hover:border-ink/30"
                    }`}>
                    {p.label}
                    {n > 0 && (
                      <span className={`absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-black ${selectedPlacement === p.id ? "bg-ink text-white" : "bg-tangerine text-white"}`}>
                        {n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="min-h-0 flex-1">
            {preview ? (
              <MockupPreview product={product} color={sel.selectedColor}
                layersByPlacement={layersByPlacement} placement={selectedPlacement}
                onPlacement={setSelectedPlacement} zoom={zoom} />
            ) : (
              <DesignCanvas product={product} placement={selectedPlacement} color={sel.selectedColor}
                layers={layers} selectedId={selectedLayerId} onSelect={setSelectedLayerId}
                onPatch={patchLayer} zoom={zoom} preview={false} showToast={showToast} />
            )}
          </div>

          {/* selected-layer quick bar (mobile settings entry) */}
          {selectedLayer && !preview && (
            <button onClick={() => setMobilePanel("settings")}
              className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-xl xl:hidden">
              <Icon d={ic.settings} className="h-4 w-4" /> Layer settings
            </button>
          )}

          {/* ── THE single bottom bar: zoom (design only) + price + continue ── */}
          <div className="z-20 flex shrink-0 items-center gap-3 border-t border-ink/10 bg-white px-3 py-2.5 sm:px-4">
            {!preview && (
              <div className="hidden items-center gap-2 sm:flex">
                <Icon d={ic.zoomIn} className="h-4 w-4 text-ink/45" />
                <input type="range" min={50} max={160} value={zoom} onChange={(e) => setZoom(+e.target.value)}
                  className="w-28 accent-tangerine" aria-label="Zoom" />
                <span className="w-10 text-xs font-bold text-ink/50">{zoom}%</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-3">
              {hasDesign ? (
                <div className="text-right leading-tight">
                  <p className="text-base font-extrabold text-ink sm:text-lg">{inr(price.total)}</p>
                  <p className="text-[10px] text-ink/45">
                    {qty > 1 ? `${qty} × ${inr(price.unit)} · ` : ""}{price.method.label} · {price.printed.map((p) => p.label).join(" + ")}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-semibold text-ink/45">Add designs to see price</p>
              )}
              <button onClick={() => (hasDesign ? setStep("submit") : showToast("Add a design first — upload, text or graphics"))}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
                  hasDesign ? "bg-tangerine text-white shadow-lg shadow-tangerine/30 hover:brightness-105" : "bg-ink/10 text-ink/35"
                }`}>
                Continue →
              </button>
            </div>
          </div>
        </div>

        {/* right layer-settings panel (desktop) */}
        {!preview && selectedLayer && (
          <aside className="hidden w-[270px] shrink-0 border-l border-ink/10 bg-white xl:block">
            <LayerSettingsPanel layer={selectedLayer} product={product} placement={selectedPlacement}
              onPatch={(id, p) => patchLayer(id, p)} onClose={() => setSelectedLayerId(null)} />
          </aside>
        )}
      </div>

      {/* ─── mobile toolbar ─── */}
      {!preview && (
        <nav className="z-30 flex shrink-0 items-stretch justify-around border-t border-ink/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => { setTool(t.id); setMobilePanel(t.id); }}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-ink/55">
              <Icon d={t.icon} className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {/* ─── mobile slide-up panel ─── */}
      {mobilePanel && !preview && (
        <div className="fixed inset-0 z-[97] xl:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-ink/40" aria-label="Close panel" onClick={() => setMobilePanel(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink/15" />
            <div className="max-h-[calc(72vh-12px)] overflow-y-auto">
              {mobilePanel === "settings"
                ? <LayerSettingsPanel layer={selectedLayer} product={product} placement={selectedPlacement}
                    onPatch={(id, p) => patchLayer(id, p)} onClose={() => setMobilePanel(null)} />
                : panelFor(mobilePanel, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
