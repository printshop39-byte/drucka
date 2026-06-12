import { useEffect, useMemo, useRef, useState } from "react";
import {
  BG_SWATCHES, CANVAS_SIZES, LAYOUTS, OCCASIONS, PATTERNS, PHOTO_FILTERS,
  cellRect, cuid, filterCss, layoutById, patternDataUrl,
} from "./collageData";
import { collageDataUrl, downloadDataUrl } from "./exportCollage";
import { FONTS, GRAPHICS, fileToDataUrl, fontStack, graphicDataUrl, inr, productById, uid } from "../designer/data";
import { Icon, ic } from "../designer/icons";

/* ── Drucka Collage Maker — dark-theme, canvas-export, cart-integrated ──
   Layout: left tool rail + panel · center live preview · bottom action bar.
   Mobile: bottom tab bar + slide-up sheets (same pattern as the designer). */

const MAX_PHOTOS = 20;
const TABS = [
  { id: "layout", label: "Layouts", icon: ic.layers },
  { id: "photos", label: "Photos", icon: ic.upload },
  { id: "style", label: "Style", icon: ic.settings },
  { id: "size", label: "Size", icon: ic.ruler },
  { id: "text", label: "Text", icon: ic.text },
  { id: "stickers", label: "Stickers", icon: ic.sticker },
  { id: "export", label: "Export", icon: ic.cart },
];

const Slider = ({ label, value, min, max, step, onChange, fmt = (v) => v }) => (
  <label className="block">
    <span className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-white/45">
      {label} <span className="text-white/70">{fmt(value)}</span>
    </span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(+e.target.value)} className="w-full accent-tangerine" />
  </label>
);

export default function CollageMaker({ onClose, onAddToCart, onOpenCart, showToast, onPro }) {
  /* ── state ── */
  const [photos, setPhotos] = useState([]);
  const [layoutId, setLayoutId] = useState("2x2");
  const [slots, setSlots] = useState({}); // cellIdx → {photoId, zoom, ox, oy, filter}
  const [gap, setGap] = useState(0.012);
  const [radius, setRadius] = useState(0.012);
  const [bg, setBg] = useState("#ffffff");
  const [pattern, setPattern] = useState("none");
  const [size, setSize] = useState(CANVAS_SIZES[0]);
  const [custom, setCustom] = useState({ w: 1800, h: 1800 });
  const [texts, setTexts] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [selected, setSelected] = useState(null); // {type:'cell'|'text'|'sticker', key}
  const [tab, setTab] = useState("layout");
  const [mobilePanel, setMobilePanel] = useState(null);
  const [busy, setBusy] = useState(false);

  const layout = layoutById(layoutId);
  const filledCount = layout.cells.filter((_, i) => slots[i]?.photoId).length;
  const canvasRef = useRef(null);
  const [pxW, setPxW] = useState(600);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPxW(el.clientWidth || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const previewScale = pxW / size.w;
  const bgPattern = useMemo(() => patternDataUrl(pattern, bg), [pattern, bg]);

  const exportState = { size, layoutId, slots, photos, gap, radius, bg, pattern, texts, stickers };

  /* ── photos ── */
  const fileRef = useRef(null);
  const addFiles = async (files) => {
    const list = [...(files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) {
      showToast(photos.length >= MAX_PHOTOS ? `⚠ Maximum ${MAX_PHOTOS} photos` : "No files selected");
      return;
    }
    setBusy(true);
    const added = [];
    for (const f of list) {
      if (!/image\/(jpe?g|png|heic|heif)/i.test(f.type) && !/\.(heic|heif|jpe?g|png)$/i.test(f.name)) continue;
      try {
        const { src, aspect } = await fileToDataUrl(f, 1600);
        added.push({ id: cuid(), name: f.name, src, aspect });
      } catch {
        showToast(`⚠ ${f.name}: format not supported by this browser (HEIC? convert to JPG)`);
      }
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    setBusy(false);
  };
  const assignPhoto = (cellIdx, photoId) => {
    setSlots((s) => ({ ...s, [cellIdx]: { photoId, zoom: 1, ox: 0, oy: 0, filter: "none" } }));
    setSelected({ type: "cell", key: cellIdx });
  };
  const autoFill = () => {
    if (photos.length < 2) {
      showToast("⚠ Upload at least 2 photos for auto-fill");
      return;
    }
    const next = {};
    layout.cells.forEach((_, i) => {
      next[i] = { photoId: photos[i % photos.length].id, zoom: 1, ox: 0, oy: 0, filter: slots[i]?.filter ?? "none" };
    });
    setSlots(next);
    showToast("Collage auto-filled ✓");
  };
  const patchSlot = (idx, patch) => setSlots((s) => ({ ...s, [idx]: { ...s[idx], ...patch } }));

  /* ── cell drag: pan photo inside cell (hybrid pointer pattern) ── */
  const panCell = (e, idx) => {
    const slot = slots[idx];
    setSelected({ type: "cell", key: idx });
    if (!slot?.photoId) return;
    e.preventDefault();
    const cellEl = e.currentTarget;
    const rect = cellEl.getBoundingClientRect();
    const pointerId = e.pointerId;
    try { cellEl.setPointerCapture(pointerId); } catch { /* best effort */ }
    const start = { px: e.clientX, py: e.clientY, ox: slot.ox ?? 0, oy: slot.oy ?? 0 };
    const lim = 50 * (slot.zoom ?? 1);
    const move = (ev) => {
      if (ev.pointerId !== pointerId) return;
      patchSlot(idx, {
        ox: Math.max(-lim, Math.min(lim, start.ox + ((ev.clientX - start.px) / rect.width) * 100)),
        oy: Math.max(-lim, Math.min(lim, start.oy + ((ev.clientY - start.py) / rect.height) * 100)),
      });
    };
    const up = (ev) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* ── text & sticker drag ── */
  const dragOverlay = (e, kind, id) => {
    e.stopPropagation();
    setSelected({ type: kind, key: id });
    const cv = canvasRef.current.getBoundingClientRect();
    const item = kind === "text" ? texts.find((t) => t.id === id) : stickers.find((s) => s.id === id);
    const pointerId = e.pointerId;
    try { e.currentTarget.setPointerCapture(pointerId); } catch { /* best effort */ }
    const start = { px: e.clientX, py: e.clientY, x: item.x, y: item.y };
    const move = (ev) => {
      if (ev.pointerId !== pointerId) return;
      const nx = Math.max(2, Math.min(98, start.x + ((ev.clientX - start.px) / cv.width) * 100));
      const ny = Math.max(2, Math.min(98, start.y + ((ev.clientY - start.py) / cv.height) * 100));
      if (kind === "text") setTexts((ts) => ts.map((t) => (t.id === id ? { ...t, x: nx, y: ny } : t)));
      else setStickers((ss) => ss.map((s) => (s.id === id ? { ...s, x: nx, y: ny } : s)));
    };
    const up = (ev) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* ── occasions / export / order ── */
  const applyOccasion = (o) => {
    setLayoutId(o.layout);
    setBg(o.bg);
    setPattern(o.pattern);
    if (!texts.length) {
      setTexts([{ id: cuid(), text: o.caption, x: 50, y: 92, size: 5.5, color: o.captionColor, font: o.font, bold: true }]);
    }
    showToast(`${o.label} template applied ✓`);
  };
  const ensurePhotos = () => {
    if (filledCount < 2) {
      showToast("⚠ Add at least 2 photos to your collage first");
      return false;
    }
    return true;
  };
  const exportFile = async (type) => {
    if (!ensurePhotos()) return;
    setBusy(true);
    try {
      const url = await collageDataUrl(exportState, type === "png" ? "image/png" : "image/jpeg", 0.92);
      downloadDataUrl(url, `drucka-collage-${size.w}x${size.h}.${type}`);
      showToast("Collage downloaded ✓");
    } catch (err) {
      showToast(`⚠ Export failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  const shareCollage = async () => {
    if (!ensurePhotos()) return;
    setBusy(true);
    try {
      const url = await collageDataUrl(exportState, "image/jpeg", 0.9, 2000);
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "drucka-collage.jpg", { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Drucka collage" });
      } else {
        downloadDataUrl(url, "drucka-collage.jpg");
        window.open("https://wa.me/?text=" + encodeURIComponent("Check out my Drucka collage! Made at drucka.in 🎨"), "_blank", "noopener");
        showToast("Downloaded — attach it in WhatsApp ✓");
      }
    } catch { /* user cancelled share */ } finally {
      setBusy(false);
    }
  };
  const orderPrint = async (pid) => {
    if (!ensurePhotos()) return;
    setBusy(true);
    try {
      const product = productById(pid);
      const src = await collageDataUrl(exportState, "image/jpeg", 0.9, 1600);
      onAddToCart({
        key: uid(),
        productId: product.qikinkId,
        type: "custom",
        name: `Photo Collage — ${product.productName}`,
        price: product.basePrice,
        qty: 1,
        size: product.availableSizes[0],
        color: "White",
        printMethod: "Full Colour",
        placement: "Front",
        design: { front: [{ id: uid(), type: "image", name: "Collage", src, x: 50, y: 50, w: 100, h: 100, rot: 0, opacity: 1, visible: true }] },
        summary: `Collage print · ${size.label}`,
      });
      showToast(`Collage ${product.productName} added to cart ✓`);
      onClose();
      onOpenCart();
    } catch (err) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  /* ── side panels ── */
  const selectedText = selected?.type === "text" ? texts.find((t) => t.id === selected.key) : null;
  const selectedSticker = selected?.type === "sticker" ? stickers.find((s) => s.id === selected.key) : null;
  const selectedSlot = selected?.type === "cell" ? slots[selected.key] : null;

  const panel = (id) => {
    switch (id) {
      case "layout": return (
        <>
          <p className="panel-title">Grid templates</p>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <button key={l.id} onClick={() => { setLayoutId(l.id); setSelected(null); }}
                className={`rounded-xl border-2 p-1.5 transition ${layoutId === l.id ? "border-tangerine bg-tangerine/10" : "border-white/10 hover:border-white/30"}`}>
                <span className="relative block w-full overflow-hidden rounded" style={{ aspectRatio: "1" }}>
                  {l.cells.map((c, i) => (
                    <span key={i} className="absolute rounded-[1px] bg-white/30"
                      style={{ left: `${c.x * 100 + 2}%`, top: `${c.y * 100 + 2}%`, width: `${c.w * 100 - 4}%`, height: `${c.h * 100 - 4}%` }} />
                  ))}
                </span>
                <span className="mt-1 block text-center text-[9px] font-bold text-white/60">{l.label}</span>
              </button>
            ))}
          </div>
          <p className="panel-title mt-5">Smart templates</p>
          <div className="space-y-1.5">
            {OCCASIONS.map((o) => (
              <button key={o.id} onClick={() => applyOccasion(o)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white/85 transition hover:border-tangerine hover:bg-white/5">
                {o.label}
                <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: o.bg }} />
              </button>
            ))}
          </div>
        </>
      );
      case "photos": return (
        <>
          <input ref={fileRef} type="file" multiple hidden accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy || photos.length >= MAX_PHOTOS}
            className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-tangerine/50 bg-tangerine/10 px-4 py-6 text-tangerine transition hover:bg-tangerine/15 disabled:opacity-40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <Icon d={ic.upload} className="h-6 w-6" />
            <span className="text-sm font-bold">{busy ? "Processing…" : "Upload photos"}</span>
            <span className="text-[10px] text-tangerine/70">JPG · PNG · HEIC — {photos.length}/{MAX_PHOTOS}</span>
          </button>
          <button onClick={autoFill} disabled={photos.length < 2}
            className="mt-2 w-full rounded-full bg-white/10 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-35">
            ⚡ Auto-fill collage
          </button>
          <p className="mt-2 text-[10px] text-white/40">Drag a photo onto a cell, or tap a photo to fill the next empty cell.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <button key={p.id} draggable title={p.name}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", `p:${p.id}`)}
                onClick={() => {
                  const empty = layout.cells.findIndex((_, i) => !slots[i]?.photoId);
                  if (empty >= 0) assignPhoto(empty, p.id);
                  else showToast("All cells are filled — drag onto a cell to replace");
                  if (mobilePanel) setMobilePanel(null);
                }}
                className="relative aspect-square overflow-hidden rounded-lg border border-white/10 transition hover:border-tangerine">
                <img src={p.src} alt={p.name} className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </>
      );
      case "style": return (
        <div className="space-y-4">
          <Slider label="Spacing" value={gap} min={0} max={0.05} step={0.002} onChange={setGap} fmt={(v) => `${Math.round(v * 500)}`} />
          <Slider label="Corner radius" value={radius} min={0} max={0.06} step={0.003} onChange={setRadius} fmt={(v) => `${Math.round(v * 500)}`} />
          <div>
            <p className="panel-title">Background</p>
            <div className="flex flex-wrap items-center gap-2">
              {BG_SWATCHES.map((c) => (
                <button key={c} onClick={() => setBg(c)} title={c}
                  className={`h-8 w-8 rounded-full border-2 ${bg === c ? "border-tangerine ring-2 ring-tangerine/40" : "border-white/20"}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-full border border-white/20 bg-transparent" title="Custom colour" />
            </div>
          </div>
          <div>
            <p className="panel-title">Pattern</p>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button key={p.id} onClick={() => setPattern(p.id)}
                  className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold transition ${pattern === p.id ? "border-tangerine bg-tangerine text-white" : "border-white/15 text-white/60"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="panel-title">Photo filter {selected?.type === "cell" ? "· selected photo" : "· select a photo"}</p>
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_FILTERS.map((f) => (
                <button key={f.id} disabled={!selectedSlot?.photoId}
                  onClick={() => patchSlot(selected.key, { filter: f.id })}
                  className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold transition disabled:opacity-30 ${
                    selectedSlot?.filter === f.id ? "border-tangerine bg-tangerine text-white" : "border-white/15 text-white/60"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button disabled={!selectedSlot?.photoId}
              onClick={() => setSlots((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, filter: selectedSlot.filter }])))}
              className="mt-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/80 hover:bg-white/15 disabled:opacity-30">
              Apply to all photos
            </button>
          </div>
        </div>
      );
      case "size": return (
        <>
          <p className="panel-title">Canvas presets</p>
          <div className="space-y-1.5">
            {CANVAS_SIZES.map((s) => (
              <button key={s.id} onClick={() => setSize(s)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                  size.id === s.id ? "border-tangerine bg-tangerine/10 text-white" : "border-white/10 text-white/70 hover:border-white/30"}`}>
                {s.label}
                <span className="text-[10px] text-white/40">{s.w}×{s.h}</span>
              </button>
            ))}
          </div>
          <p className="panel-title mt-4">Custom size (px)</p>
          <div className="flex items-center gap-2">
            <input type="number" min={400} max={4000} value={custom.w}
              onChange={(e) => setCustom((c) => ({ ...c, w: +e.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm font-semibold text-white outline-none focus:border-tangerine" />
            <span className="text-white/40">×</span>
            <input type="number" min={400} max={4000} value={custom.h}
              onChange={(e) => setCustom((c) => ({ ...c, h: +e.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm font-semibold text-white outline-none focus:border-tangerine" />
            <button onClick={() => {
              const w = Math.max(400, Math.min(4000, custom.w || 1800));
              const h = Math.max(400, Math.min(4000, custom.h || 1800));
              setSize({ id: "custom", label: `Custom ${w}×${h}`, w, h });
            }}
              className="shrink-0 rounded-full bg-tangerine px-3 py-1.5 text-xs font-bold text-white">Set</button>
          </div>
        </>
      );
      case "text": return (
        <>
          <button onClick={() => {
            const t = { id: cuid(), text: "Your text", x: 50, y: 88, size: 5, color: "#1b1430", font: "Inter", bold: true };
            setTexts((ts) => [...ts, t]);
            setSelected({ type: "text", key: t.id });
          }}
            className="w-full rounded-full bg-tangerine py-2.5 text-sm font-bold text-white transition hover:brightness-110">
            + Add text
          </button>
          {selectedText ? (
            <div className="mt-3 space-y-3">
              <textarea rows={2} value={selectedText.text}
                onChange={(e) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, text: e.target.value } : t)))}
                className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-tangerine" />
              <select value={selectedText.font}
                onChange={(e) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, font: e.target.value } : t)))}
                className="w-full rounded-lg border border-white/15 bg-[#221c33] px-2 py-2 text-sm font-semibold text-white outline-none focus:border-tangerine">
                {FONTS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
              </select>
              <Slider label="Size" value={selectedText.size} min={2} max={14} step={0.25}
                onChange={(v) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, size: v } : t)))} />
              <div className="flex items-center gap-2">
                <button onClick={() => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, bold: !t.bold } : t)))}
                  className={`h-9 w-9 rounded-lg border-2 text-sm font-black ${selectedText.bold ? "border-tangerine bg-tangerine text-white" : "border-white/15 text-white/60"}`}>B</button>
                <input type="color" value={selectedText.color}
                  onChange={(e) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, color: e.target.value } : t)))}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-white/15 bg-transparent" />
                <button onClick={() => { setTexts((ts) => ts.filter((t) => t.id !== selectedText.id)); setSelected(null); }}
                  className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-red-400 hover:bg-red-500/10"><Icon d={ic.trash} className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-white/40">Tap a text on the collage to edit it. Drag to move.</p>
          )}
        </>
      );
      case "stickers": return (
        <>
          <p className="panel-title">Tap to add</p>
          <div className="grid grid-cols-4 gap-2">
            {GRAPHICS.map((g) => (
              <button key={g.id} title={g.label}
                onClick={() => {
                  const st = { id: cuid(), src: graphicDataUrl(g), x: 50, y: 50, size: 14, rot: 0 };
                  setStickers((ss) => [...ss, st]);
                  setSelected({ type: "sticker", key: st.id });
                }}
                className="grid aspect-square place-items-center rounded-xl border border-white/10 bg-white/5 p-2 transition hover:border-tangerine">
                <img src={graphicDataUrl(g)} alt={g.label} className="h-full w-full" />
              </button>
            ))}
          </div>
          {selectedSticker && (
            <div className="mt-3 space-y-3 rounded-xl border border-white/10 p-3">
              <Slider label="Sticker size" value={selectedSticker.size} min={4} max={40} step={1}
                onChange={(v) => setStickers((ss) => ss.map((s) => (s.id === selectedSticker.id ? { ...s, size: v } : s)))} />
              <Slider label="Rotate" value={selectedSticker.rot ?? 0} min={0} max={359} step={1} fmt={(v) => `${v}°`}
                onChange={(v) => setStickers((ss) => ss.map((s) => (s.id === selectedSticker.id ? { ...s, rot: v } : s)))} />
              <button onClick={() => { setStickers((ss) => ss.filter((s) => s.id !== selectedSticker.id)); setSelected(null); }}
                className="w-full rounded-full bg-red-500/15 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/25">Remove sticker</button>
            </div>
          )}
        </>
      );
      case "export": return (
        <div className="space-y-2.5">
          <p className="panel-title">Download · {size.w}×{size.h}px</p>
          <button onClick={() => exportFile("jpg")} disabled={busy}
            className="w-full rounded-full bg-tangerine py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Rendering…" : "Download JPG (high quality)"}
          </button>
          <button onClick={() => exportFile("png")} disabled={busy}
            className="w-full rounded-full bg-white/10 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
            Download PNG
          </button>
          <button onClick={shareCollage} disabled={busy}
            className="w-full rounded-full bg-emerald-500/85 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
            Share to social / WhatsApp
          </button>
          <p className="panel-title mt-4">Print your collage</p>
          <button onClick={() => orderPrint("frame")} disabled={busy}
            className="flex w-full items-center justify-between rounded-xl border-2 border-white/12 px-3 py-2.5 text-sm font-bold text-white transition hover:border-tangerine">
            🖼 Framed Print <span className="text-tangerine">{inr(productById("frame").basePrice)}</span>
          </button>
          <button onClick={() => orderPrint("canvas")} disabled={busy}
            className="flex w-full items-center justify-between rounded-xl border-2 border-white/12 px-3 py-2.5 text-sm font-bold text-white transition hover:border-tangerine">
            🎨 Canvas Print <span className="text-tangerine">{inr(productById("canvas").basePrice)}</span>
          </button>
          <p className="text-[10px] text-white/40">Printed & shipped by Drucka in 2–4 days. COD available.</p>
        </div>
      );
      default: return null;
    }
  };

  /* ── render ── */
  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#141021] text-white" role="dialog" aria-modal="true" aria-label="Drucka collage maker">
      <style>{`.panel-title{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:8px}`}</style>

      {/* header */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/8 bg-[#1a1429] px-3 sm:px-4">
        <button onClick={onClose} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/8 hover:text-white">
          <Icon d={ic.back} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Collage Maker</p>
          <p className="hidden text-[10px] text-white/40 sm:block">Drucka Studio · {size.label}</p>
        </div>
        <div className="mx-auto hidden items-center gap-1 text-[11px] font-semibold text-white/45 sm:flex">
          {filledCount}/{layout.cells.length} photos placed
        </div>
        {onPro && (
          <div className="mr-1 flex rounded-full bg-white/10 p-0.5 text-[10px] font-bold" role="tablist" aria-label="Editor mode">
            <span className="rounded-full bg-tangerine px-3 py-1.5 text-white">Grid Editor</span>
            <button onClick={onPro} title="Freeform mode: shape crops, blend, text, pen, effects"
              className="rounded-full px-3 py-1.5 text-white/60 transition hover:text-white">
              Pro Editor
            </button>
          </div>
        )}
        <button onClick={() => exportFile("jpg")} disabled={busy}
          className="rounded-full bg-tangerine px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50">
          {busy ? "…" : "Download"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* left rail + panel (desktop) */}
        <aside className="hidden w-[330px] shrink-0 border-r border-white/8 bg-[#1a1429] lg:flex">
          <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-white/6 py-3">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[9px] font-bold transition ${
                  tab === t.id ? "bg-tangerine/15 text-tangerine" : "text-white/45 hover:bg-white/5 hover:text-white"}`}>
                <Icon d={t.icon} className="h-5 w-5" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-4 scroll-thin">{panel(tab)}</div>
        </aside>

        {/* center preview */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 pb-2">
            <div ref={canvasRef}
              className="relative max-h-full shadow-2xl"
              style={{
                aspectRatio: `${size.w} / ${size.h}`,
                width: "min(100%, " + (size.w >= size.h ? "860px" : `${(size.w / size.h) * 76}vh`) + ")",
                backgroundColor: bg,
                backgroundImage: bgPattern ? `url(${bgPattern})` : "none",
                backgroundSize: "240px",
              }}
              onPointerDown={() => setSelected(null)}>
              {/* cells */}
              {layout.cells.map((cell, i) => {
                const r = cellRect(cell, size.w, size.h, gap);
                const slot = slots[i];
                const photo = slot?.photoId ? photos.find((p) => p.id === slot.photoId) : null;
                const cellAspect = r.w / r.h;
                const isSel = selected?.type === "cell" && selected.key === i;
                return (
                  <div key={i}
                    onPointerDown={(e) => { e.stopPropagation(); panCell(e, i); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const d = e.dataTransfer.getData("text/plain");
                      if (d.startsWith("p:")) assignPhoto(i, d.slice(2));
                      else if (d.startsWith("c:")) {
                        const from = +d.slice(2);
                        setSlots((s) => ({ ...s, [i]: s[from], [from]: s[i] }));
                      }
                    }}
                    className={`absolute touch-none overflow-hidden ${isSel ? "ring-2 ring-tangerine" : ""} ${photo ? "cursor-move" : "cursor-pointer bg-black/10"}`}
                    style={{
                      left: `${(r.x / size.w) * 100}%`, top: `${(r.y / size.h) * 100}%`,
                      width: `${(r.w / size.w) * 100}%`, height: `${(r.h / size.h) * 100}%`,
                      borderRadius: radius * Math.min(size.w, size.h) * previewScale,
                    }}>
                    {photo ? (
                      <>
                        <img src={photo.src} alt="" draggable={false}
                          className="pointer-events-none absolute select-none"
                          style={{
                            left: `calc(50% + ${slot.ox ?? 0}%)`, top: `calc(50% + ${slot.oy ?? 0}%)`,
                            transform: `translate(-50%,-50%) scale(${slot.zoom ?? 1})`,
                            /* cover-fit: image wider than cell → match heights; taller → match widths
                               (photo.aspect = h/w, so "wider" ⇔ aspect < 1/cellAspect) */
                            ...(photo.aspect < 1 / cellAspect ? { height: "100%", width: "auto" } : { width: "100%", height: "auto" }),
                            maxWidth: "none", maxHeight: "none",
                            filter: filterCss(slot.filter ?? "none"),
                          }} />
                        {isSel && (
                          <span draggable
                            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/plain", `c:${i}`); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Drag to swap with another cell"
                            className="absolute left-1.5 top-1.5 grid h-6 w-6 cursor-grab place-items-center rounded-full bg-black/55 text-[11px] text-white">⠿</span>
                        )}
                      </>
                    ) : (
                      <span className="pointer-events-none absolute inset-0 grid place-items-center text-2xl text-black/25" style={{ color: "rgba(127,127,127,.5)" }}>+</span>
                    )}
                  </div>
                );
              })}
              {/* stickers */}
              {stickers.map((st) => (
                <img key={st.id} src={st.src} alt="" draggable={false}
                  onPointerDown={(e) => dragOverlay(e, "sticker", st.id)}
                  className={`absolute cursor-move touch-none select-none ${selected?.key === st.id ? "ring-2 ring-tangerine rounded" : ""}`}
                  style={{
                    left: `${st.x}%`, top: `${st.y}%`,
                    width: `${st.size}%`,
                    transform: `translate(-50%,-50%) rotate(${st.rot ?? 0}deg)`,
                    zIndex: 20,
                  }} />
              ))}
              {/* texts */}
              {texts.map((t) => (
                <div key={t.id}
                  onPointerDown={(e) => dragOverlay(e, "text", t.id)}
                  className={`absolute cursor-move touch-none select-none whitespace-pre text-center ${selected?.key === t.id ? "rounded ring-2 ring-tangerine" : ""}`}
                  style={{
                    left: `${t.x}%`, top: `${t.y}%`,
                    transform: "translate(-50%,-50%)",
                    fontFamily: fontStack(t.font),
                    fontWeight: t.bold ? 700 : 400,
                    fontSize: (t.size / 100) * size.h * previewScale * (size.w / size.w),
                    color: t.color,
                    textShadow: "0 1px 8px rgba(0,0,0,.18)",
                    lineHeight: 1.2,
                    zIndex: 30,
                  }}>
                  {t.text}
                </div>
              ))}
            </div>
          </div>

          {/* selected-photo quick bar */}
          {selectedSlot?.photoId && (
            <div className="z-20 mx-auto mb-1 flex w-fit max-w-full items-center gap-3 rounded-full bg-[#221c33] px-4 py-2 shadow-xl">
              <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Zoom</span>
              <input type="range" min={1} max={3} step={0.05} value={selectedSlot.zoom ?? 1}
                onChange={(e) => patchSlot(selected.key, { zoom: +e.target.value })} className="w-28 accent-tangerine sm:w-40" />
              <button onClick={() => patchSlot(selected.key, { zoom: 1, ox: 0, oy: 0 })}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70 hover:bg-white/15">Reset</button>
              <button onClick={() => { setSlots((s) => ({ ...s, [selected.key]: undefined })); setSelected(null); }}
                className="grid h-7 w-7 place-items-center rounded-full text-red-300 hover:bg-red-500/10"><Icon d={ic.trash} className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* bottom bar */}
          <div className="z-20 flex shrink-0 items-center gap-3 border-t border-white/8 bg-[#1a1429] px-3 py-2.5 sm:px-4">
            <p className="hidden text-[11px] text-white/40 sm:block">Tip: drag inside a photo to reposition it</p>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={shareCollage} disabled={busy}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50">Share</button>
              <button onClick={() => { setTab("export"); setMobilePanel("export"); }}
                className="rounded-full bg-tangerine px-5 py-2 text-xs font-bold text-white shadow-lg shadow-tangerine/25 transition hover:brightness-110">
                Order print →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* mobile tab bar */}
      <nav className="z-30 flex shrink-0 items-stretch justify-around border-t border-white/8 bg-[#1a1429] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMobilePanel(t.id); }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-bold text-white/55">
            <Icon d={t.icon} className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </nav>

      {/* mobile sheet */}
      {mobilePanel && (
        <div className="fixed inset-0 z-[97] lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/55" aria-label="Close panel" onClick={() => setMobilePanel(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-hidden rounded-t-3xl bg-[#1a1429] shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
            <div className="max-h-[calc(70vh-12px)] overflow-y-auto p-4 scroll-thin">{panel(mobilePanel)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
