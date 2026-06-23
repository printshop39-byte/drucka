import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Upload, Trash2, MessageCircle, ShoppingBag, RotateCw,
  Crop, Copy, GripVertical, CalendarDays, Smile, X,
} from "lucide-react";
import { fileToDataUrl, inr, uid } from "../designer/data";
import {
  BORDERS, MINI_FONTS, FILTERS, CAPTION_COLORS, STICKER_SETS, STICKER_POS,
  OCCASION_TEMPLATES, SIZE_ASPECT, miniCardDataUrl,
} from "./miniCard";

/* ── Drucka Mini Photo Prints — standalone quick-order flow ──
   Size → template → border → upload → per-photo (crop/rotate/adjust,
   filter, caption, date, stickers, duplicate, reorder) → order.
   One shared miniCard renderer = preview matches the printed card. */

const MINI_SIZES = [
  { id: "2x3", label: '2×3"', name: "Wallet & Gift Inserts", price: 19 },
  { id: "3x3", label: '3×3"', name: "Instagram Square Prints", price: 25 },
  { id: "4x3", label: '4×3"', name: "Memory & Scrapbook Prints", price: 29 },
];
const MAX_PHOTOS = 30;
const FREE_SHIP = 2999;
const WA_PHONE = "917083811355";

const todayStamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())} · ${p(d.getMonth() + 1)} · ${d.getFullYear()}`;
};
const newPhoto = (src, name) => ({
  id: uid(), src, name,
  rotation: 0, zoom: 1, ox: 0, oy: 0, brightness: 100, contrast: 100,
  filter: "original",
  caption: "", captionFont: "Poppins", captionSize: "M", captionColor: "#1a1208",
  dateStamp: false, dateText: todayStamp(), stickers: [],
  copies: 1,
});
const sig = (p, sizeId, border) => JSON.stringify([
  sizeId, border, p.rotation, p.zoom, p.ox, p.oy, p.brightness, p.contrast, p.filter,
  p.caption, p.captionFont, p.captionSize, p.captionColor, p.dateStamp, p.dateText, p.stickers,
]);

/* small CSS swatch for a border style */
function BorderSwatch({ id }) {
  const inner = <span className="h-4 w-4 rounded-[1px] bg-gradient-to-br from-stone to-charcoal/20" />;
  if (id === "none") return <span className="h-7 w-7 rounded-[3px] bg-gradient-to-br from-stone to-charcoal/20 ring-1 ring-black/10" />;
  if (id === "polaroid") return <span className="grid h-7 w-7 place-items-start justify-items-center rounded-[3px] bg-white pt-0.5 ring-1 ring-black/15 shadow-sm">{inner}</span>;
  if (id === "gold") return <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-gold">{inner}</span>;
  if (id === "black") return <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-charcoal">{inner}</span>;
  return <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-white" style={{ outline: "2px dashed #c19a3d", outlineOffset: -3 }}>{inner}</span>;
}

/* ── Crop & adjust modal — drag to pan, zoom, rotate, brightness, contrast ── */
function CropModal({ photo, sizeId, onApply, onClose }) {
  const [d, setD] = useState({ rotation: photo.rotation, zoom: photo.zoom, ox: photo.ox, oy: photo.oy, brightness: photo.brightness, contrast: photo.contrast });
  const frameRef = useRef(null);
  const aspect = SIZE_ASPECT[sizeId] ?? 1;

  const pan = (e) => {
    e.preventDefault();
    const rect = frameRef.current.getBoundingClientRect();
    const id = e.pointerId;
    const start = { x: e.clientX, y: e.clientY, ox: d.ox, oy: d.oy };
    const move = (ev) => {
      if (ev.pointerId !== id) return;
      setD((s) => ({
        ...s,
        ox: Math.max(-60, Math.min(60, start.ox + ((ev.clientX - start.x) / rect.width) * 100)),
        oy: Math.max(-60, Math.min(60, start.oy + ((ev.clientY - start.y) / rect.height) * 100)),
      }));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const swap = d.rotation % 180 !== 0;
  const Slider = ({ label, val, min, max, step, k, fmt }) => (
    <label className="block">
      <span className="mb-0.5 flex justify-between text-[10px] font-bold uppercase tracking-wide text-charcoal/50">{label}<span className="text-charcoal/70">{fmt(val)}</span></span>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => setD((s) => ({ ...s, [k]: +e.target.value }))} className="w-full accent-tangerine" />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-charcoal">Crop &amp; adjust</p>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-charcoal/50 hover:bg-black/5"><X size={16} /></button>
        </div>
        {/* crop frame */}
        <div ref={frameRef} onPointerDown={pan}
          className="relative mx-auto max-h-[46vh] cursor-move touch-none overflow-hidden rounded-lg bg-black/[0.06] ring-1 ring-black/10"
          style={{ aspectRatio: `${aspect}`, width: aspect >= 1 ? "min(100%,360px)" : "auto", height: aspect < 1 ? "46vh" : "auto" }}>
          <img src={photo.src} alt="" draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              transform: `translate(-50%,-50%) translate(${d.ox}%,${d.oy}%) rotate(${d.rotation}deg) scale(${d.zoom})`,
              ...(swap
                ? { height: "auto", width: `${100 * (1 / aspect)}%` }
                : {}),
              ...(() => {
                // cover-fit the frame: pick the dimension that fills
                return aspect >= 1 ? { width: "100%", height: "auto", minHeight: "100%" } : { height: "100%", width: "auto", minWidth: "100%" };
              })(),
              filter: `brightness(${d.brightness}%) contrast(${d.contrast}%)`,
            }} />
          <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
        </div>
        <p className="mt-1.5 text-center text-[10px] text-charcoal/40">Drag the photo to reposition</p>

        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setD((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black/5 py-2 text-[11px] font-bold text-charcoal hover:bg-black/10"><RotateCw size={13} /> Rotate 90°</button>
            <button onClick={() => setD((s) => ({ ...s, ox: 0, oy: 0, zoom: 1 }))}
              className="rounded-full bg-black/5 px-3 py-2 text-[11px] font-bold text-charcoal/70 hover:bg-black/10">Reset</button>
          </div>
          <Slider label="Zoom" val={d.zoom} min={1} max={3} step={0.02} k="zoom" fmt={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Brightness" val={d.brightness} min={50} max={150} step={1} k="brightness" fmt={(v) => `${v}%`} />
          <Slider label="Contrast" val={d.contrast} min={50} max={150} step={1} k="contrast" fmt={(v) => `${v}%`} />
        </div>
        <button onClick={() => onApply(d)} className="mt-4 w-full rounded-full bg-tangerine py-2.5 text-sm font-bold text-white transition hover:brightness-110">Apply</button>
      </div>
    </div>
  );
}

export default function MiniPrints({ onClose, onAddToCart, onOpenCart, showToast }) {
  const [sizeId, setSizeId] = useState("3x3");
  const [border, setBorder] = useState("polaroid"); // global (Feature 2)
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState({});
  const [busy, setBusy] = useState(false);
  const [cropId, setCropId] = useState(null);
  const [stickerId, setStickerId] = useState(null); // which card's sticker picker is open
  const fileRef = useRef(null);
  const sigRef = useRef({});
  const dragIdx = useRef(null);

  const size = MINI_SIZES.find((s) => s.id === sizeId);
  const totalPrints = photos.reduce((n, p) => n + p.copies, 0);
  const subtotal = totalPrints * size.price;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : 49;
  const total = subtotal + shipping;
  const cropPhoto = photos.find((p) => p.id === cropId);

  /* regenerate composed previews on any visual change */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (const p of photos) {
        const s = sig(p, sizeId, border);
        if (sigRef.current[p.id] === s && previews[p.id]) continue;
        sigRef.current[p.id] = s;
        try {
          const url = await miniCardDataUrl({ ...p, sizeId, border }, 440, "image/jpeg", 0.9);
          if (!cancelled) setPreviews((pv) => ({ ...pv, [p.id]: url }));
        } catch { /* ignore */ }
      }
    };
    const t = setTimeout(run, 140);
    return () => { cancelled = true; clearTimeout(t); };
  }, [photos, sizeId, border]); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = async (files) => {
    const list = [...(files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) { showToast(photos.length >= MAX_PHOTOS ? `⚠ Max ${MAX_PHOTOS} photos` : "No files selected"); return; }
    setBusy(true);
    const added = [];
    for (const f of list) {
      if (!/image\/(jpe?g|png|heic|heif|webp)/i.test(f.type) && !/\.(heic|heif|jpe?g|png|webp)$/i.test(f.name)) continue;
      try {
        const { src } = await fileToDataUrl(f, 1600);
        const p = newPhoto(src, f.name);
        if (activeTemplate) applyTemplateToPhoto(p, activeTemplate); // inherit current template look
        added.push(p);
      } catch { showToast(`⚠ ${f.name}: couldn't load (HEIC? convert to JPG)`); }
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    setBusy(false);
  };

  const patch = (id, p) => setPhotos((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const setCopies = (id, n) => patch(id, { copies: Math.max(1, Math.min(99, n)) });
  const rotate = (id) => setPhotos((arr) => arr.map((x) => (x.id === id ? { ...x, rotation: (x.rotation + 90) % 360 } : x)));
  const remove = (id) => setPhotos((p) => p.filter((x) => x.id !== id));
  const duplicate = (id, times = 1) => setPhotos((arr) => {
    const i = arr.findIndex((x) => x.id === id);
    if (i < 0) return arr;
    const copies = Array.from({ length: times }, () => ({ ...arr[i], id: uid(), stickers: arr[i].stickers.map((s) => ({ ...s })) }));
    return [...arr.slice(0, i + 1), ...copies, ...arr.slice(i + 1)];
  });
  const moveTo = (to) => {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from == null || from === to) return;
    setPhotos((arr) => { const next = [...arr]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next; });
  };
  const toggleSticker = (id, emoji) => setPhotos((arr) => arr.map((x) => {
    if (x.id !== id) return x;
    const has = x.stickers.find((s) => s.emoji === emoji);
    if (has) return { ...x, stickers: x.stickers.filter((s) => s.emoji !== emoji) };
    if (x.stickers.length >= 2) { showToast("Max 2 stickers per photo"); return x; }
    const used = x.stickers.map((s) => s.pos);
    const pos = STICKER_POS.find((p) => !used.includes(p)) ?? "tr";
    return { ...x, stickers: [...x.stickers, { emoji, pos }] };
  }));

  /* ── templates (Feature 7) ── */
  function applyTemplateToPhoto(p, t) {
    p.caption = t.caption ?? "";
    p.captionFont = t.captionFont ?? p.captionFont;
    p.captionColor = t.captionColor ?? p.captionColor;
    p.filter = t.filter ?? "original";
    p.stickers = (t.stickers ?? []).slice(0, 2).map((emoji, i) => ({ emoji, pos: STICKER_POS[i] ?? "tr" }));
    p.dateStamp = !!t.dateStamp;
  }
  const applyTemplate = (t) => {
    setActiveTemplate(t);
    setBorder(t.border ?? "none");
    if (t.size) setSizeId(t.size);
    setPhotos((arr) => {
      let next = arr.map((p) => { const c = { ...p, stickers: [...p.stickers] }; applyTemplateToPhoto(c, t); return c; });
      if (t.duplicateCount && next.length === 1) {
        const base = next[0];
        next = Array.from({ length: t.duplicateCount }, () => ({ ...base, id: uid(), stickers: base.stickers.map((s) => ({ ...s })) }));
      }
      return next;
    });
    showToast(`${t.name} template applied ✓`);
  };

  const ensure = () => { if (!photos.length) { showToast("⚠ Upload at least one photo"); return false; } return true; };
  const addToCart = async () => {
    if (!ensure()) return;
    setBusy(true);
    try {
      for (const p of photos) {
        const src = await miniCardDataUrl({ ...p, sizeId, border }, 1100, "image/jpeg", 0.92);
        onAddToCart({
          key: uid(), productId: "mini-print", type: "custom",
          name: `Mini Print ${size.label} — ${size.name}`,
          price: size.price, qty: p.copies, size: size.label, color: "White",
          printMethod: "Full Colour", placement: "Front",
          design: { front: [{ id: uid(), type: "image", name: p.caption?.trim() || "Mini print", src, x: 50, y: 50, w: 100, h: 100, rot: 0, opacity: 1, visible: true }] },
          summary: `Mini print · ${size.label}${border !== "none" ? ` · ${border}` : ""}${p.filter !== "original" ? ` · ${p.filter}` : ""}${p.caption?.trim() ? ` · "${p.caption.trim()}"` : ""} · ${p.copies} ${p.copies > 1 ? "copies" : "copy"}`,
        });
      }
      showToast(`${totalPrints} mini prints added to cart · ${inr(subtotal)} ✓`);
      onClose(); onOpenCart();
    } catch (err) { showToast(`⚠ ${err.message}`); } finally { setBusy(false); }
  };
  const orderWhatsApp = () => {
    if (!ensure()) return;
    const lines = photos.map((p, i) => `${i + 1}. ${p.copies}× ${p.caption?.trim() ? `"${p.caption.trim()}"` : "photo"}${p.filter !== "original" ? ` · ${p.filter}` : ""}`);
    const msg = [
      "🖼️ *DRUCKA Mini Prints Order*", "",
      `📐 Size: ${size.label} — ${size.name}`,
      `🖼️ Border: ${border}`,
      `📦 Total prints: ${totalPrints}`, "",
      ...lines, "",
      `💰 Total: ${inr(total)} (${shipping ? inr(shipping) + " shipping" : "free shipping"})`, "",
      "Sending my photos now to place the order!",
    ].join("\n");
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    showToast("Now attach your photos in the WhatsApp chat ✓");
  };

  const Step = ({ n, children }) => (
    <p className="kd-label mb-2 mt-6 uppercase">{n} · {children}</p>
  );

  return (
    <div className="kd-noise fixed inset-0 z-[95] flex flex-col bg-[#eceef1] text-charcoal" role="dialog" aria-modal="true" aria-label="Mini photo prints">
      <style>{`
        .kd-noise { position: relative; }
        .kd-noise::before { content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; background-repeat: repeat;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E"); }
        .kd-noise > * { position: relative; z-index: 1; }
        .kd-mono { font-family: 'Courier New', monospace; }
        .kd-label { color: #E8650A; letter-spacing: 4px; font-size: 11px; font-weight: 600; }
        .kd-heading { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; text-shadow: 1px 1px 0 rgba(232,101,10,0.15); }
        .kd-size { font-family: 'Courier New', monospace; letter-spacing: 2px; background: #1a1208; color: #E8650A; border: 1px solid #E8650A; border-radius: 3px; }
        .kd-size .kd-sub { color: rgba(232,101,10,0.7); }
        .kd-size-on { background: #E8650A !important; color: #fff !important; border-color: #E8650A !important; }
        .kd-size-on .kd-sub { color: rgba(255,255,255,0.85) !important; }
        .kd-photo { border: 3px solid #f5e6c8; border-radius: 2px; background: #fdf6ec; }
        .kd-photo-img { filter: sepia(12%) contrast(105%); transition: all 0.35s cubic-bezier(0.23,1,0.32,1); }
        .kd-cart { background: #1a1208; color: #E8650A; font-family: 'Courier New', monospace; letter-spacing: 1px; border: 1px solid #E8650A; transition: all 0.25s ease; }
        .kd-price { color: #E8650A; font-family: 'Courier New', monospace; font-size: 13px; }
        .kd-watermark { font-family: 'Courier New', monospace; font-size: 9px; color: #E8650A; opacity: 0.5; letter-spacing: 2px; text-transform: uppercase; pointer-events: none; }
        .kd-bottominfo { font-family: 'Courier New', monospace; font-size: 11px; color: rgba(26,18,8,0.6); letter-spacing: 0.5px; }
        .kd-divider { border-top: 1px solid rgba(232,101,10,0.2); }
        @media (hover: hover) and (pointer: fine) {
          .kd-cart:hover { background: #E8650A; color: #fff; }
          .kd-photo:hover .kd-photo-img { transform: rotate(-1.5deg) translateY(-4px); filter: sepia(0%) contrast(100%); }
        }
      `}</style>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/10 bg-white px-3 sm:px-4">
        <button onClick={onClose} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full text-charcoal/55 hover:bg-black/5 hover:text-charcoal"><ArrowLeft size={18} /></button>
        <div className="min-w-0">
          <p className="kd-heading truncate text-base">Mini Photo Prints</p>
          <p className="kd-mono hidden text-[10px] sm:block" style={{ color: 'rgba(232,101,10,0.6)' }}>Drucka Studio · {size.label}</p>
        </div>
        <button onClick={addToCart} disabled={busy || !photos.length}
          className="kd-cart ml-auto rounded-sm px-4 py-2 text-xs font-bold uppercase disabled:opacity-50">{busy ? "…" : "Add to Cart"}</button>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {/* retro divider */}
        <div className="kd-divider mb-5 pt-3 text-center">
          <span className="kd-watermark">— Printed with love in Kolhapur —</span>
        </div>
        {/* size */}
        <p className="kd-label mb-2 uppercase">1 · Choose a size</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {MINI_SIZES.map((s) => (
            <button key={s.id} onClick={() => setSizeId(s.id)}
              className={`kd-size p-3 text-left transition ${sizeId === s.id ? "kd-size-on" : ""}`}>
              <p className="text-lg font-bold">{s.label}</p>
              <p className="kd-sub mt-0.5 text-[10px] font-semibold leading-tight">{s.name}</p>
              <p className="mt-1.5 text-[11px] font-bold"><span className="text-[8px] tracking-[2px] opacity-70">FROM </span>{inr(s.price)}<span className="kd-sub text-[9px]"> /print</span></p>
            </button>
          ))}
        </div>

        {/* templates */}
        <Step n="2">Quick templates</Step>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {OCCASION_TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => applyTemplate(t)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-2 text-xs font-bold transition ${activeTemplate?.id === t.id ? "border-tangerine bg-tangerine/5 text-charcoal" : "border-black/10 bg-white text-charcoal/70 hover:border-black/25"}`}>
              <span className="text-base">{t.emoji}</span> {t.name}
            </button>
          ))}
        </div>

        {/* border (global) */}
        <Step n="3">Choose border</Step>
        <div className="flex flex-wrap gap-2">
          {BORDERS.map((b) => (
            <button key={b.id} onClick={() => setBorder(b.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition ${border === b.id ? "border-tangerine bg-tangerine/5" : "border-black/10 hover:border-black/25"}`}>
              <BorderSwatch id={b.id} />
              <span className="text-[8.5px] font-bold text-charcoal/55">{b.label}</span>
            </button>
          ))}
        </div>

        {/* upload */}
        <Step n="4">Upload &amp; personalise</Step>
        <input ref={fileRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <button onClick={() => fileRef.current?.click()} disabled={busy || photos.length >= MAX_PHOTOS}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          style={{ border: '2px dashed #E8650A', borderRadius: '4px' }}
          className="flex w-full flex-col items-center gap-1.5 bg-[#fdf6ec] px-4 py-6 transition hover:bg-[#f7ecd9] disabled:opacity-40">
          <Upload size={22} style={{ color: '#E8650A' }} />
          <span className="kd-mono text-sm font-bold" style={{ color: '#E8650A', letterSpacing: '1px' }}>{busy ? "Processing…" : "Upload photos"}</span>
          <span className="kd-mono text-[11px]" style={{ color: 'rgba(232,101,10,0.6)' }}>JPG · PNG · HEIC — {photos.length}/{MAX_PHOTOS}</span>
        </button>

        {photos.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {photos.map((p, i) => (
              <div key={p.id} onDragOver={(e) => e.preventDefault()} onDrop={() => moveTo(i)}
                className="rounded-2xl border border-black/10 bg-white p-3">
                {/* header: drag handle + duplicate presets + delete */}
                <div className="mb-2 flex items-center gap-1">
                  <span draggable onDragStart={() => { dragIdx.current = i; }} title="Drag to reorder"
                    className="grid h-7 w-7 cursor-grab place-items-center rounded text-charcoal/35 hover:bg-black/5"><GripVertical size={15} /></span>
                  <span className="text-[10px] font-bold text-charcoal/40">#{i + 1}{p.copies > 1 ? ` · ×${p.copies}` : ""}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {[2, 4, 8].map((n) => (
                      <button key={n} onClick={() => duplicate(p.id, n - 1)} title={`Duplicate ×${n}`}
                        className="rounded-md bg-black/5 px-1.5 py-1 text-[10px] font-bold text-charcoal/70 hover:bg-black/10">×{n}</button>
                    ))}
                    <button onClick={() => duplicate(p.id, 1)} title="Duplicate" className="grid h-7 w-7 place-items-center rounded text-charcoal/55 hover:bg-black/5"><Copy size={14} /></button>
                    <button onClick={() => remove(p.id)} aria-label="Remove" className="grid h-7 w-7 place-items-center rounded text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* composed preview */}
                <div className="kd-photo mb-3 flex items-center justify-center p-3" style={{ minHeight: 170 }}>
                  {previews[p.id]
                    ? <img src={previews[p.id]} alt={p.name} className="kd-photo-img max-h-48 w-auto shadow-md" draggable={false} />
                    : <div className="h-36 w-28 animate-pulse rounded bg-black/5" />}
                </div>

                {/* edit toolbar */}
                <div className="flex gap-2">
                  <button onClick={() => rotate(p.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black/5 py-2 text-[11px] font-bold text-charcoal hover:bg-black/10"><RotateCw size={13} /> Rotate</button>
                  <button onClick={() => setCropId(p.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-black/5 py-2 text-[11px] font-bold text-charcoal hover:bg-black/10"><Crop size={13} /> Crop &amp; adjust</button>
                </div>

                {/* filter strip */}
                <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {FILTERS.map((f) => (
                    <button key={f.id} onClick={() => patch(p.id, { filter: f.id })}
                      className={`shrink-0 rounded-full border-2 px-2.5 py-1 text-[10px] font-bold transition ${p.filter === f.id ? "border-tangerine bg-tangerine text-white" : "border-black/10 text-charcoal/60"}`}>{f.label}</button>
                  ))}
                </div>

                {/* caption */}
                <input value={p.caption} maxLength={40} onChange={(e) => patch(p.id, { caption: e.target.value })}
                  placeholder="Add a caption (optional)…"
                  className="mt-3 w-full rounded-lg border border-black/15 bg-black/[0.03] px-3 py-2 text-sm font-semibold text-charcoal outline-none focus:border-tangerine" />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <select value={p.captionFont} onChange={(e) => patch(p.id, { captionFont: e.target.value })}
                    className="rounded-lg border border-black/15 bg-white px-2 py-1.5 text-xs font-semibold text-charcoal outline-none focus:border-tangerine">
                    {MINI_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  <div className="flex overflow-hidden rounded-lg border border-black/15">
                    {["S", "M", "L"].map((s) => (
                      <button key={s} onClick={() => patch(p.id, { captionSize: s })}
                        className={`px-2.5 py-1.5 text-xs font-bold ${p.captionSize === s ? "bg-tangerine text-white" : "text-charcoal/60"}`}>{s}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {CAPTION_COLORS.map((c) => (
                      <button key={c} aria-label={`Caption ${c}`} onClick={() => patch(p.id, { captionColor: c })}
                        className={`h-6 w-6 rounded-full border-2 ${p.captionColor === c ? "border-tangerine ring-2 ring-tangerine/30" : "border-black/15"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                {/* date + stickers */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => patch(p.id, { dateStamp: !p.dateStamp })}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[11px] font-bold transition ${p.dateStamp ? "border-tangerine bg-tangerine/5 text-charcoal" : "border-black/10 text-charcoal/60"}`}>
                    <CalendarDays size={13} /> Date stamp
                  </button>
                  <button onClick={() => setStickerId(stickerId === p.id ? null : p.id)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[11px] font-bold transition ${p.stickers.length ? "border-tangerine bg-tangerine/5 text-charcoal" : "border-black/10 text-charcoal/60"}`}>
                    <Smile size={13} /> Stickers{p.stickers.length ? ` (${p.stickers.length})` : ""}
                  </button>
                  {p.dateStamp && (
                    <input value={p.dateText} onChange={(e) => patch(p.id, { dateText: e.target.value })}
                      className="w-28 rounded-lg border border-black/15 bg-black/[0.03] px-2 py-1 text-xs font-semibold text-charcoal outline-none focus:border-tangerine" />
                  )}
                </div>
                {stickerId === p.id && (
                  <div className="mt-2 rounded-xl border border-black/10 p-2">
                    {STICKER_SETS.map((set) => (
                      <div key={set.label} className="mb-1.5 last:mb-0">
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-charcoal/40">{set.label}</p>
                        <div className="flex gap-1.5">
                          {set.items.map((emoji) => {
                            const on = p.stickers.some((s) => s.emoji === emoji);
                            return (
                              <button key={emoji} onClick={() => toggleSticker(p.id, emoji)}
                                className={`grid h-8 w-8 place-items-center rounded-lg border-2 text-lg transition ${on ? "border-tangerine bg-tangerine/10" : "border-black/10 hover:border-black/25"}`}>{emoji}</button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* copies */}
                <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-black/5 pt-3">
                  <span className="mr-auto text-[10px] font-bold uppercase tracking-wide text-charcoal/40">Copies</span>
                  <button onClick={() => setCopies(p.id, p.copies - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-black/15 text-sm font-bold hover:border-charcoal">−</button>
                  <span className="w-6 text-center text-sm font-bold">{p.copies}</span>
                  <button onClick={() => setCopies(p.id, p.copies + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-black/15 text-sm font-bold hover:border-charcoal">+</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="kd-bottominfo mt-4 leading-relaxed">Printed on premium photo paper &amp; shipped by Drucka in 2–4 days · COD available · Free shipping over {inr(FREE_SHIP)}.</p>
        <p className="kd-watermark mt-4 text-right">© Drucka Print Lab · Kolhapur</p>
      </div>

      {/* bottom bar */}
      <div className="shrink-0 border-t border-black/10 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal/40">{totalPrints} prints · {size.label}</p>
            <p className="kd-price font-bold">{inr(total)} <span className="text-[10px] font-normal" style={{ opacity: 0.6 }}>{shipping ? "incl. shipping" : "free shipping"}</span></p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={orderWhatsApp} disabled={!photos.length}
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-105 disabled:opacity-50"><MessageCircle size={14} /> WhatsApp</button>
            <button onClick={addToCart} disabled={busy || !photos.length}
              className="kd-cart flex items-center gap-1.5 rounded-sm px-5 py-2.5 text-xs font-bold uppercase disabled:opacity-50"><ShoppingBag size={14} /> Add to Cart</button>
          </div>
        </div>
      </div>

      {cropPhoto && (
        <CropModal photo={cropPhoto} sizeId={sizeId}
          onClose={() => setCropId(null)}
          onApply={(d) => { patch(cropPhoto.id, d); setCropId(null); }} />
      )}
    </div>
  );
}
