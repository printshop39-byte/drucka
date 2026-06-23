import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Upload, Trash2, MessageCircle, ShoppingBag } from "lucide-react";
import { fileToDataUrl, inr, uid } from "../designer/data";

/* ── Drucka Mini Photo Prints — standalone quick-order flow ──
   Pick a mini size → upload photos → set copies → order. Light theme,
   matches the storefront. Separate from the Collage Maker. */

const MINI_SIZES = [
  { id: "2x3", label: '2×3"', name: "Wallet & Gift Inserts", price: 19 },
  { id: "3x3", label: '3×3"', name: "Instagram Square Prints", price: 25 },
  { id: "4x3", label: '4×3"', name: "Memory & Scrapbook Prints", price: 29 },
];
const MAX_PHOTOS = 30;
const FREE_SHIP = 2999;
const WA_PHONE = "917083811355";

export default function MiniPrints({ onClose, onAddToCart, onOpenCart, showToast }) {
  const [sizeId, setSizeId] = useState("3x3");
  const [photos, setPhotos] = useState([]); // {id, src, name, copies}
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const size = MINI_SIZES.find((s) => s.id === sizeId);
  const totalPrints = photos.reduce((n, p) => n + p.copies, 0);
  const subtotal = totalPrints * size.price;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIP ? 0 : 49;
  const total = subtotal + shipping;

  const addFiles = async (files) => {
    const list = [...(files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) { showToast(photos.length >= MAX_PHOTOS ? `⚠ Max ${MAX_PHOTOS} photos` : "No files selected"); return; }
    setBusy(true);
    const added = [];
    for (const f of list) {
      if (!/image\/(jpe?g|png|heic|heif|webp)/i.test(f.type) && !/\.(heic|heif|jpe?g|png|webp)$/i.test(f.name)) continue;
      try {
        const { src } = await fileToDataUrl(f, 1600);
        added.push({ id: uid(), src, name: f.name, copies: 1 });
      } catch {
        showToast(`⚠ ${f.name}: couldn't load (HEIC? convert to JPG)`);
      }
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    setBusy(false);
  };
  const setCopies = (id, n) => setPhotos((p) => p.map((x) => (x.id === id ? { ...x, copies: Math.max(1, Math.min(99, n)) } : x)));
  const remove = (id) => setPhotos((p) => p.filter((x) => x.id !== id));

  const ensure = () => {
    if (!photos.length) { showToast("⚠ Upload at least one photo"); return false; }
    return true;
  };
  const addToCart = () => {
    if (!ensure()) return;
    photos.forEach((p) => {
      onAddToCart({
        key: uid(),
        productId: "mini-print",
        type: "custom",
        name: `Mini Print ${size.label} — ${size.name}`,
        price: size.price,
        qty: p.copies,
        size: size.label,
        color: "White",
        printMethod: "Full Colour",
        placement: "Front",
        design: { front: [{ id: uid(), type: "image", name: "Mini print", src: p.src, x: 50, y: 50, w: 100, h: 100, rot: 0, opacity: 1, visible: true }] },
        summary: `Mini photo print · ${size.label} · ${p.copies} ${p.copies > 1 ? "copies" : "copy"}`,
      });
    });
    showToast(`${totalPrints} mini prints added to cart · ${inr(subtotal)} ✓`);
    onClose();
    onOpenCart();
  };
  const orderWhatsApp = () => {
    if (!ensure()) return;
    const msg = [
      "🖼️ *DRUCKA Mini Prints Order*", "",
      `📐 Size: ${size.label} — ${size.name}`,
      `🖼️ Photos: ${photos.length}`,
      `📦 Total prints: ${totalPrints}`, "",
      `💰 Total: ${inr(total)} (${shipping ? inr(shipping) + " shipping" : "free shipping"})`, "",
      "I've picked my mini prints — sending the photos now to place my order!",
    ].join("\n");
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    showToast("Now attach your photos in the WhatsApp chat ✓");
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#eceef1] text-charcoal" role="dialog" aria-modal="true" aria-label="Mini photo prints">
      {/* header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/10 bg-white px-3 sm:px-4">
        <button onClick={onClose} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full text-charcoal/55 hover:bg-black/5 hover:text-charcoal">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Mini Photo Prints</p>
          <p className="hidden text-[10px] text-charcoal/40 sm:block">Drucka Studio · {size.label}</p>
        </div>
        <button onClick={addToCart} disabled={busy || !photos.length}
          className="ml-auto rounded-full bg-tangerine px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50">
          Add to Cart
        </button>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {/* size picker */}
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-charcoal/45">1 · Choose a size</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {MINI_SIZES.map((s) => (
            <button key={s.id} onClick={() => setSizeId(s.id)}
              className={`rounded-2xl border-2 p-3 text-left transition ${sizeId === s.id ? "border-tangerine bg-tangerine/5" : "border-black/10 bg-white hover:border-black/25"}`}>
              <p className="text-lg font-black text-charcoal">{s.label}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-tight text-charcoal/60">{s.name}</p>
              <p className="mt-1.5 text-xs font-bold text-tangerine">{inr(s.price)}<span className="text-[10px] font-semibold text-charcoal/40"> /print</span></p>
            </button>
          ))}
        </div>

        {/* upload */}
        <p className="mb-2 mt-6 text-[10px] font-extrabold uppercase tracking-[0.14em] text-charcoal/45">2 · Upload your photos</p>
        <input ref={fileRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <button onClick={() => fileRef.current?.click()} disabled={busy || photos.length >= MAX_PHOTOS}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-tangerine/50 bg-tangerine/5 px-4 py-7 text-tangerine transition hover:bg-tangerine/10 disabled:opacity-40">
          <Upload size={22} />
          <span className="text-sm font-bold">{busy ? "Processing…" : "Upload photos"}</span>
          <span className="text-[10px] text-tangerine/70">JPG · PNG · HEIC — {photos.length}/{MAX_PHOTOS}</span>
        </button>

        {/* photo grid */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-black/10 bg-white">
                <div className="aspect-square overflow-hidden bg-black/[0.04]">
                  <img src={p.src} alt={p.name} className="h-full w-full object-cover" draggable={false} />
                </div>
                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCopies(p.id, p.copies - 1)} className="grid h-6 w-6 place-items-center rounded-full border border-black/15 text-sm font-bold hover:border-charcoal">−</button>
                    <span className="w-5 text-center text-sm font-bold">{p.copies}</span>
                    <button onClick={() => setCopies(p.id, p.copies + 1)} className="grid h-6 w-6 place-items-center rounded-full border border-black/15 text-sm font-bold hover:border-charcoal">+</button>
                  </div>
                  <button onClick={() => remove(p.id)} aria-label="Remove" className="grid h-6 w-6 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] leading-relaxed text-charcoal/40">Printed on premium photo paper &amp; shipped by Drucka in 2–4 days · COD available · Free shipping over {inr(FREE_SHIP)}.</p>
      </div>

      {/* bottom order bar */}
      <div className="shrink-0 border-t border-black/10 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal/40">{totalPrints} prints · {size.label}</p>
            <p className="text-lg font-black text-charcoal">{inr(total)} <span className="text-[10px] font-semibold text-charcoal/40">{shipping ? "incl. shipping" : "free shipping"}</span></p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={orderWhatsApp} disabled={!photos.length}
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-105 disabled:opacity-50">
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={addToCart} disabled={!photos.length}
              className="flex items-center gap-1.5 rounded-full bg-tangerine px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-tangerine/25 transition hover:brightness-110 disabled:opacity-50">
              <ShoppingBag size={14} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
