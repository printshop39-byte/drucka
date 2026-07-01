import { useEffect, useMemo, useRef, useState } from "react";
import {
  BG_SWATCHES, PRINT_SIZES, SOCIAL_SIZES, FRAME_OPTIONS, LAMINATION_OPTIONS,
  LAYOUTS, OCCASIONS, PATTERNS, PHOTO_FILTERS,
  calcCollagePrice, cellRect, cuid, filterCss, layoutById, patternDataUrl,
} from "./collageData";
import { collageDataUrl, downloadDataUrl } from "./exportCollage";
import { FONTS, GRAPHICS, fileToDataUrl, fontStack, graphicDataUrl, inr, productById, uid } from "../designer/data";
import { Icon, ic } from "../designer/icons";

/* ── Drucka Collage Maker — PicMonkey-style light theme ──
   Layout: left tool rail + panel · center live preview · bottom action bar.
   Mobile: bottom tab bar + slide-up sheets. Full print-size/frame pricing. */

const MAX_PHOTOS = 20;
const WA_PHONE = "917083811355";
const TABS = [
  { id: "layout", label: "Layouts", icon: ic.layers },
  { id: "photos", label: "Photos", icon: ic.upload },
  { id: "style", label: "Style", icon: ic.settings },
  { id: "size", label: "Size", icon: ic.ruler },
  { id: "text", label: "Text", icon: ic.text },
  { id: "stickers", label: "Stickers", icon: ic.sticker },
  { id: "order", label: "Order", icon: ic.cart },
];

const Slider = ({ label, value, min, max, step, onChange, fmt = (v) => v }) => (
  <label className="block">
    <span className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-charcoal/45">
      {label} <span className="text-charcoal/70">{fmt(value)}</span>
    </span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(+e.target.value)} className="w-full accent-tangerine" />
  </label>
);

/* radio row used by the order panel */
const OptionRow = ({ active, onClick, label, price }) => (
  <button onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${
      active ? "border-tangerine bg-tangerine/5 text-charcoal" : "border-black/10 text-charcoal/70 hover:border-black/25"}`}>
    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${active ? "border-tangerine" : "border-black/25"}`}>
      {active && <span className="h-2 w-2 rounded-full bg-tangerine" />}
    </span>
    <span className="flex-1">{label}</span>
    {price > 0 && <span className="text-xs font-bold text-tangerine">+{inr(price)}</span>}
    {price === 0 && <span className="text-xs font-bold text-charcoal/35">Free</span>}
  </button>
);

export default function CollageMaker({ onClose, onBack, onAddToCart, onOpenCart, showToast, onPro, initial }) {
  /* ── state ── */
  const [photos, setPhotos] = useState([]);
  const [layoutId, setLayoutId] = useState("2x2");
  const [slots, setSlots] = useState({}); // cellIdx → {photoId, zoom, ox, oy, filter}
  const [gap, setGap] = useState(0.012);
  const [radius, setRadius] = useState(0.012);
  const [bg, setBg] = useState("#ffffff");
  const [pattern, setPattern] = useState("none");
  const [size, setSize] = useState(() => PRINT_SIZES.find((s) => s.id === "square") ?? PRINT_SIZES[1]);
  const [custom, setCustom] = useState({ w: 1800, h: 1800 });
  const [texts, setTexts] = useState([]);
  const [stickers, setStickers] = useState([]);
  const [selected, setSelected] = useState(null); // {type:'cell'|'text'|'sticker', key}
  const [tab, setTab] = useState("layout");
  const [mobilePanel, setMobilePanel] = useState(null);
  const [busy, setBusy] = useState(false);

  /* order config (PRD §6.4 / §11) */
  const [frame, setFrame] = useState("none");
  const [lamination, setLamination] = useState("glossy");
  const [qty, setQty] = useState(1);

  /* apply a template chosen on the welcome screen (once, on mount) */
  const appliedInitial = useRef(false);
  useEffect(() => {
    if (appliedInitial.current || !initial) return;
    appliedInitial.current = true;
    if (initial.occasion) {
      const o = OCCASIONS.find((x) => x.id === initial.occasion);
      if (o) applyOccasion(o);
    } else if (initial.layout) {
      setLayoutId(initial.layout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

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
  const price = useMemo(() => calcCollagePrice({ size, frame, lamination, qty }), [size, frame, lamination, qty]);

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
  /* add the rendered collage to the cart as a custom photo-print line item */
  const addToCart = async () => {
    if (!ensurePhotos()) return;
    setBusy(true);
    try {
      const src = await collageDataUrl(exportState, "image/jpeg", 0.9, 1600);
      const base = productById("frame"); // photo-print fulfilment product
      const frameOpt = FRAME_OPTIONS.find((f) => f.id === frame);
      const lamOpt = LAMINATION_OPTIONS.find((l) => l.id === lamination);
      const summary = [
        `Collage · ${size.dim || size.label}`,
        frame !== "none" && `${frameOpt.label} frame`,
        lamination !== "none" && `${lamOpt.label} lamination`,
      ].filter(Boolean).join(" · ");
      onAddToCart({
        key: uid(),
        productId: base.qikinkId,
        type: "custom",
        name: `Photo Collage — ${size.dim || size.label}`,
        price: price.unit,
        qty,
        size: size.dim || size.label,
        color: "White",
        printMethod: "Full Colour",
        placement: "Front",
        design: { front: [{ id: uid(), type: "image", name: "Collage", src, x: 50, y: 50, w: 100, h: 100, rot: 0, opacity: 1, visible: true }] },
        summary,
      });
      showToast(`Collage added to cart · ${inr(price.total)} ✓`);
      onClose();
      onOpenCart();
    } catch (err) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  /* WhatsApp order (PRD §12) — download image so the user can attach it */
  const orderWhatsApp = async () => {
    if (!ensurePhotos()) return;
    setBusy(true);
    try {
      const url = await collageDataUrl(exportState, "image/jpeg", 0.9, 2000);
      downloadDataUrl(url, "drucka-collage.jpg");
      const frameOpt = FRAME_OPTIONS.find((f) => f.id === frame);
      const lamOpt = LAMINATION_OPTIONS.find((l) => l.id === lamination);
      const msg = [
        "*DRUCKA Collage Order*", "",
        `Size: ${size.label}`,
        `Frame: ${frameOpt.label}`,
        `Lamination: ${lamOpt.label}`,
        `Quantity: ${qty}`, "",
        `Total: ${inr(price.grandTotal)} (${price.shipping ? inr(price.shipping) + " shipping" : "free shipping"})`, "",
        "I've created my collage — sending the image now to place my order!",
      ].join("\n");
      window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      showToast("Collage downloaded — attach it in the WhatsApp chat ✓");
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
                className={`rounded-xl border-2 p-1.5 transition ${layoutId === l.id ? "border-tangerine bg-tangerine/10" : "border-black/10 hover:border-black/30"}`}>
                <span className="relative block w-full overflow-hidden rounded bg-black/[0.04]" style={{ aspectRatio: "1" }}>
                  {l.cells.map((c, i) => (
                    <span key={i} className="absolute rounded-[1px] bg-charcoal/25"
                      style={{ left: `${c.x * 100 + 2}%`, top: `${c.y * 100 + 2}%`, width: `${c.w * 100 - 4}%`, height: `${c.h * 100 - 4}%` }} />
                  ))}
                </span>
                <span className="mt-1 block text-center text-[9px] font-bold text-charcoal/55">{l.label}</span>
              </button>
            ))}
          </div>
          <p className="panel-title mt-5">Smart templates</p>
          <div className="space-y-1.5">
            {OCCASIONS.map((o) => (
              <button key={o.id} onClick={() => applyOccasion(o)}
                className="flex w-full items-center justify-between rounded-xl border border-black/10 px-3 py-2.5 text-left text-sm font-semibold text-charcoal/80 transition hover:border-tangerine hover:bg-tangerine/5">
                {o.label}
                <span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: o.bg }} />
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
            className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-tangerine/50 bg-tangerine/5 px-4 py-6 text-tangerine transition hover:bg-tangerine/10 disabled:opacity-40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
            <Icon d={ic.upload} className="h-6 w-6" />
            <span className="text-sm font-bold">{busy ? "Processing…" : "Upload photos"}</span>
            <span className="text-[10px] text-tangerine/70">JPG · PNG · HEIC — {photos.length}/{MAX_PHOTOS}</span>
          </button>
          <button onClick={autoFill} disabled={photos.length < 2}
            className="mt-2 w-full rounded-full bg-charcoal/5 py-2 text-xs font-bold text-charcoal transition hover:bg-charcoal/10 disabled:opacity-35">
            ⚡ Auto-fill collage
          </button>
          <p className="mt-2 text-[10px] text-charcoal/40">Drag a photo onto a cell, or tap a photo to fill the next empty cell.</p>
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
                className="relative aspect-square overflow-hidden rounded-lg border border-black/10 transition hover:border-tangerine">
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
                  className={`h-8 w-8 rounded-full border-2 ${bg === c ? "border-tangerine ring-2 ring-tangerine/40" : "border-black/15"}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-full border border-black/15 bg-transparent" title="Custom colour" />
            </div>
          </div>
          <div>
            <p className="panel-title">Pattern</p>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button key={p.id} onClick={() => setPattern(p.id)}
                  className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold transition ${pattern === p.id ? "border-tangerine bg-tangerine text-white" : "border-black/15 text-charcoal/60"}`}>
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
                    selectedSlot?.filter === f.id ? "border-tangerine bg-tangerine text-white" : "border-black/15 text-charcoal/60"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button disabled={!selectedSlot?.photoId}
              onClick={() => setSlots((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, filter: selectedSlot.filter }])))}
              className="mt-2 rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-bold text-charcoal/80 hover:bg-charcoal/10 disabled:opacity-30">
              Apply to all photos
            </button>
          </div>
        </div>
      );
      case "size": return (
        <>
          <p className="panel-title">Print sizes</p>
          <div className="space-y-1.5">
            {PRINT_SIZES.map((s) => (
              <button key={s.id} onClick={() => setSize(s)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                  size.id === s.id ? "border-tangerine bg-tangerine/5 text-charcoal" : "border-black/10 text-charcoal/70 hover:border-black/25"}`}>
                {s.label}
                <span className="text-[10px] font-bold text-tangerine">{inr(s.price)}</span>
              </button>
            ))}
          </div>
          <p className="panel-title mt-4">Social / digital</p>
          <div className="space-y-1.5">
            {SOCIAL_SIZES.map((s) => (
              <button key={s.id} onClick={() => setSize(s)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                  size.id === s.id ? "border-tangerine bg-tangerine/5 text-charcoal" : "border-black/10 text-charcoal/70 hover:border-black/25"}`}>
                {s.label}
                <span className="text-[10px] text-charcoal/40">{s.w}×{s.h}</span>
              </button>
            ))}
          </div>
          <p className="panel-title mt-4">Custom size (px)</p>
          <div className="flex items-center gap-2">
            <input type="number" min={400} max={4000} value={custom.w}
              onChange={(e) => setCustom((c) => ({ ...c, w: +e.target.value }))}
              className="w-full rounded-lg border border-black/15 bg-black/[0.03] px-2 py-1.5 text-sm font-semibold text-charcoal outline-none focus:border-tangerine" />
            <span className="text-charcoal/40">×</span>
            <input type="number" min={400} max={4000} value={custom.h}
              onChange={(e) => setCustom((c) => ({ ...c, h: +e.target.value }))}
              className="w-full rounded-lg border border-black/15 bg-black/[0.03] px-2 py-1.5 text-sm font-semibold text-charcoal outline-none focus:border-tangerine" />
            <button onClick={() => {
              const w = Math.max(400, Math.min(4000, custom.w || 1800));
              const h = Math.max(400, Math.min(4000, custom.h || 1800));
              setSize({ id: "custom", label: `Custom ${w}×${h}`, dim: `${w}×${h}`, w, h });
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
                className="w-full resize-none rounded-xl border border-black/15 bg-black/[0.03] px-3 py-2 text-sm font-semibold text-charcoal outline-none focus:border-tangerine" />
              <select value={selectedText.font}
                onChange={(e) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, font: e.target.value } : t)))}
                className="w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm font-semibold text-charcoal outline-none focus:border-tangerine">
                {FONTS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
              </select>
              <Slider label="Size" value={selectedText.size} min={2} max={14} step={0.25}
                onChange={(v) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, size: v } : t)))} />
              <div className="flex items-center gap-2">
                <button onClick={() => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, bold: !t.bold } : t)))}
                  className={`h-9 w-9 rounded-lg border-2 text-sm font-black ${selectedText.bold ? "border-tangerine bg-tangerine text-white" : "border-black/15 text-charcoal/60"}`}>B</button>
                <input type="color" value={selectedText.color}
                  onChange={(e) => setTexts((ts) => ts.map((t) => (t.id === selectedText.id ? { ...t, color: e.target.value } : t)))}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-black/15 bg-transparent" />
                <button onClick={() => { setTexts((ts) => ts.filter((t) => t.id !== selectedText.id)); setSelected(null); }}
                  className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-500/10"><Icon d={ic.trash} className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-charcoal/40">Tap a text on the collage to edit it. Drag to move.</p>
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
                className="grid aspect-square place-items-center rounded-xl border border-black/10 bg-black/[0.03] p-2 transition hover:border-tangerine">
                <img src={graphicDataUrl(g)} alt={g.label} className="h-full w-full" />
              </button>
            ))}
          </div>
          {selectedSticker && (
            <div className="mt-3 space-y-3 rounded-xl border border-black/10 p-3">
              <Slider label="Sticker size" value={selectedSticker.size} min={4} max={40} step={1}
                onChange={(v) => setStickers((ss) => ss.map((s) => (s.id === selectedSticker.id ? { ...s, size: v } : s)))} />
              <Slider label="Rotate" value={selectedSticker.rot ?? 0} min={0} max={359} step={1} fmt={(v) => `${v}°`}
                onChange={(v) => setStickers((ss) => ss.map((s) => (s.id === selectedSticker.id ? { ...s, rot: v } : s)))} />
              <button onClick={() => { setStickers((ss) => ss.filter((s) => s.id !== selectedSticker.id)); setSelected(null); }}
                className="w-full rounded-full bg-red-500/10 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/20">Remove sticker</button>
            </div>
          )}
        </>
      );
      case "order": return (
        <div className="space-y-3">
          <p className="panel-title">Download · {size.w}×{size.h}px</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => exportFile("jpg")} disabled={busy}
              className="rounded-full bg-charcoal py-2.5 text-xs font-bold text-white transition hover:bg-charcoal/90 disabled:opacity-50">
              {busy ? "Rendering…" : "Download JPG"}
            </button>
            <button onClick={() => exportFile("png")} disabled={busy}
              className="rounded-full bg-charcoal/5 py-2.5 text-xs font-bold text-charcoal transition hover:bg-charcoal/10 disabled:opacity-50">
              Download PNG
            </button>
          </div>

          <div className="my-1 border-t border-black/10" />
          <p className="panel-title">Print size</p>
          <select value={PRINT_SIZES.some((s) => s.id === size.id) ? size.id : ""}
            onChange={(e) => setSize(PRINT_SIZES.find((s) => s.id === e.target.value))}
            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm font-semibold text-charcoal outline-none focus:border-tangerine">
            {!PRINT_SIZES.some((s) => s.id === size.id) && <option value="">{size.label} (digital)</option>}
            {PRINT_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} — {inr(s.price)}</option>)}
          </select>

          <p className="panel-title mt-2">Frame</p>
          <div className="space-y-1.5">
            {FRAME_OPTIONS.map((f) => (
              <OptionRow key={f.id} active={frame === f.id} onClick={() => setFrame(f.id)} label={f.label} price={f.price} />
            ))}
          </div>

          <p className="panel-title mt-2">Lamination</p>
          <div className="space-y-1.5">
            {LAMINATION_OPTIONS.map((l) => (
              <OptionRow key={l.id} active={lamination === l.id} onClick={() => setLamination(l.id)} label={l.label} price={l.price} />
            ))}
          </div>

          <p className="panel-title mt-2">Quantity</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-black/15 text-lg font-bold text-charcoal hover:border-charcoal">−</button>
            <span className="w-8 text-center text-lg font-bold text-charcoal">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-black/15 text-lg font-bold text-charcoal hover:border-charcoal">+</button>
          </div>

          {/* price breakdown */}
          <div className="mt-2 space-y-1.5 rounded-xl bg-charcoal/[0.04] p-3 text-sm">
            <div className="flex justify-between text-charcoal/60"><span>Unit price</span><span className="font-semibold text-charcoal">{inr(price.unit)}</span></div>
            <div className="flex justify-between text-charcoal/60"><span>Subtotal ({qty}×)</span><span className="font-semibold text-charcoal">{inr(price.total)}</span></div>
            <div className="flex justify-between text-charcoal/60"><span>Shipping</span><span className="font-semibold text-charcoal">{price.shipping ? inr(price.shipping) : "FREE"}</span></div>
            <div className="mt-1 flex items-baseline justify-between border-t border-black/10 pt-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-charcoal/50">Total</span>
              <span className="text-xl font-black text-charcoal">{inr(price.grandTotal)}</span>
            </div>
          </div>

          <button onClick={addToCart} disabled={busy}
            className="w-full rounded-full bg-tangerine py-3 text-sm font-bold text-white shadow-lg shadow-tangerine/25 transition hover:brightness-110 disabled:opacity-50">
            🛒 Add to Cart · {inr(price.total)}
          </button>
          <button onClick={orderWhatsApp} disabled={busy}
            className="w-full rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-50">
            💬 Order on WhatsApp
          </button>
          <p className="text-[10px] leading-relaxed text-charcoal/40">Printed &amp; shipped by Drucka in 2–4 days · COD available · Free shipping over {inr(2999)}.</p>
        </div>
      );
      default: return null;
    }
  };

  /* ── render ── */
  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#eceef1] text-charcoal" role="dialog" aria-modal="true" aria-label="Drucka collage maker">
      <style>{`.panel-title{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(33,28,23,.45);margin-bottom:8px}`}</style>

      {/* header */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-black/10 bg-white px-3 sm:px-4">
        <button onClick={onBack ?? onClose} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full text-charcoal/55 hover:bg-black/5 hover:text-charcoal">
          <Icon d={ic.back} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Collage Maker</p>
          <p className="hidden text-[10px] text-charcoal/40 sm:block">Drucka Studio · {size.label}</p>
        </div>
        <div className="mx-auto hidden items-center gap-1 text-[11px] font-semibold text-charcoal/45 sm:flex">
          {filledCount}/{layout.cells.length} photos placed
        </div>
        {onPro && (
          <div className="mr-1 flex rounded-full bg-black/5 p-0.5 text-[10px] font-bold" role="tablist" aria-label="Editor mode">
            <span className="rounded-full bg-tangerine px-3 py-1.5 text-white">Grid Editor</span>
            <button onClick={onPro} title="Freeform mode: shape crops, blend, text, pen, effects"
              className="rounded-full px-3 py-1.5 text-charcoal/55 transition hover:text-charcoal">
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
        <aside className="hidden w-[330px] shrink-0 border-r border-black/10 bg-white lg:flex">
          <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-black/8 py-3">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[9px] font-bold transition ${
                  tab === t.id ? "bg-tangerine/10 text-tangerine" : "text-charcoal/45 hover:bg-black/5 hover:text-charcoal"}`}>
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
              className="relative max-h-full shadow-2xl ring-1 ring-black/5"
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
                    className={`absolute touch-none overflow-hidden ${isSel ? "ring-2 ring-tangerine" : ""} ${photo ? "cursor-move" : "cursor-pointer bg-black/[0.06]"}`}
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
                      <span className="pointer-events-none absolute inset-0 grid place-items-center text-2xl" style={{ color: "rgba(33,28,23,.3)" }}>+</span>
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
                    fontSize: (t.size / 100) * size.h * previewScale,
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
            <div className="z-20 mx-auto mb-1 flex w-fit max-w-full items-center gap-3 rounded-full bg-white px-4 py-2 shadow-xl ring-1 ring-black/5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-charcoal/40">Zoom</span>
              <input type="range" min={1} max={3} step={0.05} value={selectedSlot.zoom ?? 1}
                onChange={(e) => patchSlot(selected.key, { zoom: +e.target.value })} className="w-28 accent-tangerine sm:w-40" />
              <button onClick={() => patchSlot(selected.key, { zoom: 1, ox: 0, oy: 0 })}
                className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold text-charcoal/70 hover:bg-black/10">Reset</button>
              <button onClick={() => { setSlots((s) => ({ ...s, [selected.key]: undefined })); setSelected(null); }}
                className="grid h-7 w-7 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Icon d={ic.trash} className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* bottom bar */}
          <div className="z-20 flex shrink-0 items-center gap-3 border-t border-black/10 bg-white px-3 py-2.5 sm:px-4">
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal/40">{size.dim || size.label}{frame !== "none" ? " · framed" : ""}</p>
              <p className="text-sm font-black text-charcoal">{inr(price.grandTotal)} <span className="text-[10px] font-semibold text-charcoal/40">incl. shipping</span></p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={shareCollage} disabled={busy}
                className="rounded-full bg-black/5 px-4 py-2 text-xs font-bold text-charcoal transition hover:bg-black/10 disabled:opacity-50">Share</button>
              <button onClick={() => { setTab("order"); setMobilePanel("order"); }}
                className="rounded-full bg-tangerine px-5 py-2 text-xs font-bold text-white shadow-lg shadow-tangerine/25 transition hover:brightness-110">
                Order print →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* mobile tab bar */}
      <nav className="z-30 flex shrink-0 items-stretch justify-around border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMobilePanel(t.id); }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-bold text-charcoal/55">
            <Icon d={t.icon} className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </nav>

      {/* mobile sheet */}
      {mobilePanel && (
        <div className="fixed inset-0 z-[97] lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40" aria-label="Close panel" onClick={() => setMobilePanel(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-black/15" />
            <div className="max-h-[calc(78vh-12px)] overflow-y-auto p-4 scroll-thin">{panel(mobilePanel)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
