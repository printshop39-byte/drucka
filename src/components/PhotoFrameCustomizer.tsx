import { useRef, useState } from 'react';
import { X, Upload, Pencil, Trash2, Plus, Minus, Check, MessageCircle, ChevronLeft } from 'lucide-react';
import {
  BORDER_OPTIONS, FRAME_STYLES, FrameStyle, PRINT_SIZES, PRINT_TYPES, PhotoSlot,
  cropModeLabel, cssFilter, defaultCrop, frameOrderMessage, loadPhotoFile,
  printOrderMessage, sizeById, slotQuality, transformSlot, wa,
} from './customizerData';
import ImageCropper from './ImageCropper';

/* ── PhotoFrameCustomizer — website-based print/frame ordering flow ──
   Photos stay in the browser (no upload); the customer shares the real
   files on WhatsApp after confirming. One modal, two modes:
   mode="print" → Photo Prints · mode="frame" → Custom Frames. */

const MAX_PHOTOS = 4;
const STEPS = ['Photos', 'Size & Crop', 'Options', 'Summary'];

interface Props {
  mode: 'print' | 'frame';
  initial?: { printType?: string; frameId?: string; sizeId?: string };
  onClose: () => void;
  showToast: (msg: string) => void;
}

/* non-interactive cropped preview that honours the slot's crop state */
function CroppedThumb({ slot, className = '', style }: { slot: PhotoSlot; className?: string; style?: React.CSSProperties }) {
  const s = sizeById(slot.sizeId);
  const c = slot.crop;
  const printAspect = s.w / s.h;
  const imgAspect = slot.pw / slot.ph;
  let img: React.CSSProperties;
  if (c.mode === 'fit') {
    img = {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
      maxWidth: 'none', maxHeight: 'none', filter: cssFilter(c),
      ...(imgAspect > printAspect ? { width: '100%' } : { height: '100%' }),
    };
  } else if (c.mode === 'free') {
    img = {
      position: 'absolute', maxWidth: 'none', filter: cssFilter(c),
      width: `${10000 / c.box.w}%`,
      left: `${(-c.box.x * 100) / c.box.w}%`,
      top: `${(-c.box.y * 100) / c.box.h}%`,
    };
  } else {
    img = {
      position: 'absolute', left: '50%', top: '50%', maxWidth: 'none', maxHeight: 'none',
      transform: `translate(calc(-50% + ${c.ox}%), calc(-50% + ${c.oy}%))`,
      filter: cssFilter(c),
      ...(imgAspect > printAspect ? { height: `${100 * c.zoom}%` } : { width: `${100 * c.zoom}%` }),
    };
  }
  return (
    <div className={`relative overflow-hidden bg-cream ${className}`} style={{ aspectRatio: `${s.w} / ${s.h}`, ...style }}>
      <img src={slot.src} alt={slot.name} draggable={false} style={img} className="select-none" />
    </div>
  );
}

/* cropped preview wrapped in the selected frame + matting */
function FramePreview({ slot, frame, border }: { slot: PhotoSlot | null; frame: FrameStyle; border: string }) {
  const matPad = border === 'No Border' ? '0%' : border === 'White Border' ? '5%' : '9%';
  const caption = (
    <p className="mt-2 text-center text-[11px] font-bold text-charcoal/55">{frame.name}{border !== 'No Border' ? ` · ${border}` : ''}</p>
  );

  /* real-frame photo: position the cropped photo inside the frame's opening */
  if (frame.frameImg && frame.opening) {
    const o = frame.opening;
    return (
      <div className="mx-auto w-full max-w-[230px]">
        <div className="relative drop-shadow-[0_14px_34px_rgba(0,0,0,.25)]">
          <img src={frame.frameImg} alt={`${frame.name} frame`} className="block w-full select-none" draggable={false} />
          <div className="absolute overflow-hidden" style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%`, padding: matPad }}>
            {slot ? (
              <CroppedThumb slot={slot} className="!absolute !inset-0" style={{ aspectRatio: 'auto', width: '100%', height: '100%' }} />
            ) : (
              <div className="grid h-full w-full place-items-center bg-cream/90 text-center">
                <span className="px-2 text-[10px] font-semibold text-charcoal/40">Upload your photo</span>
              </div>
            )}
          </div>
        </div>
        {caption}
      </div>
    );
  }

  /* fallback: CSS-gradient frame (styles without a straight-on frame photo) */
  return (
    <div className="mx-auto w-full max-w-[230px]">
      <div className="rounded-[4px] p-[7%] shadow-[0_14px_34px_rgba(0,0,0,.25)]" style={{ background: frame.mat }}>
        <div className="bg-white" style={{ padding: matPad, boxShadow: frame.accent ? `inset 0 0 0 2px ${frame.accent}` : 'none' }}>
          {slot ? (
            <CroppedThumb slot={slot} />
          ) : (
            <div className="grid place-items-center bg-cream text-center" style={{ aspectRatio: '4 / 5' }}>
              <span className="px-3 text-[11px] font-semibold text-charcoal/40">Upload your photo to preview</span>
            </div>
          )}
        </div>
      </div>
      {caption}
    </div>
  );
}

export default function PhotoFrameCustomizer({ mode, initial, onClose, showToast }: Props) {
  const isFrame = mode === 'frame';
  const [slots, setSlots] = useState<PhotoSlot[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [printType, setPrintType] = useState(initial?.printType ?? PRINT_TYPES[0]);
  const [frame, setFrame] = useState<FrameStyle>(FRAME_STYLES.find((f) => f.id === initial?.frameId) ?? FRAME_STYLES[1]);
  const [border, setBorder] = useState(BORDER_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = slots.find((s) => s.id === activeId) ?? slots[0] ?? null;

  const addFiles = async (files: FileList | null) => {
    const room = MAX_PHOTOS - slots.length;
    const list = [...(files ?? [])].slice(0, room);
    if (!list.length) {
      showToast(room === 0 ? `⚠ Maximum ${MAX_PHOTOS} photos` : 'No files selected');
      return;
    }
    setBusy(true);
    const added: PhotoSlot[] = [];
    for (const f of list) {
      try {
        const base = await loadPhotoFile(f);
        added.push({ ...base, sizeId: initial?.sizeId ?? '4x6', crop: defaultCrop(), qty: 1 });
      } catch (err) {
        showToast(`⚠ ${(err as Error).message}`);
      }
    }
    if (added.length) {
      setSlots((s) => [...s, ...added]);
      setActiveId(added[0].id);
    }
    setBusy(false);
  };

  const patchSlot = (id: string, patch: Partial<PhotoSlot>) =>
    setSlots((s) => s.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const patchCrop = (id: string, patch: object) =>
    setSlots((s) => s.map((p) => (p.id === id ? { ...p, crop: { ...p.crop, ...patch } } : p)));
  const removeSlot = (id: string) => {
    setSlots((s) => s.filter((p) => p.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const doTransform = async (id: string, op: 'rotL' | 'rotR' | 'flipH') => {
    const slot = slots.find((p) => p.id === id);
    if (!slot) return;
    try {
      const patch = await transformSlot(slot, op);
      patchSlot(id, patch);
    } catch {
      showToast('⚠ Could not transform the image');
    }
  };

  const next = () => {
    if (step === 0 && !slots.length) { showToast('⚠ Upload at least 1 photo first'); return; }
    setStep(Math.min(STEPS.length - 1, step + 1));
  };

  const waMessage = isFrame
    ? frameOrderMessage(slots, frame, border, note)
    : printOrderMessage(slots, printType, note);
  const totalPrints = slots.reduce((n, p) => n + p.qty, 0);

  /* ── steps ── */
  const stepPhotos = (
    <>
      <p className="text-center text-sm font-semibold text-charcoal/60">Upload up to 4 photos — each photo gets its own size, crop and quantity.</p>
      <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/heic,.heic"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: MAX_PHOTOS }, (_, i) => {
          const slot = slots[i];
          return slot ? (
            <div key={slot.id}
              className={`rounded-xl border-2 p-2 transition ${activeId === slot.id ? 'border-gold bg-gold/5' : 'border-stone bg-white'}`}>
              <button onClick={() => setActiveId(slot.id)} className="block w-full">
                <CroppedThumb slot={slot} className="rounded-lg" />
              </button>
              <p className="mt-1.5 truncate text-center text-[10px] font-bold text-charcoal/60">Photo {i + 1}{activeId === slot.id ? ' · selected' : ''}</p>
              <div className="mt-1 flex justify-center gap-1">
                <button onClick={() => { setActiveId(slot.id); setStep(1); }}
                  className="flex items-center gap-1 rounded-full bg-charcoal px-2.5 py-1 text-[10px] font-bold text-white hover:bg-charcoal/85">
                  <Pencil size={10} /> Edit / Crop
                </button>
                <button onClick={() => removeSlot(slot.id)} aria-label={`Remove photo ${i + 1}`}
                  className="grid h-6 w-6 place-items-center rounded-full text-red-500 hover:bg-red-50">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button key={i} onClick={() => fileRef.current?.click()} disabled={busy}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gold/50 bg-gold/5 text-gold-dark transition hover:bg-gold/10 disabled:opacity-50">
              <Upload size={20} />
              <span className="text-[11px] font-bold">{busy ? 'Loading…' : `Photo ${i + 1}`}</span>
              <span className="text-[9px] text-gold-dark/60">Tap to upload</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-charcoal/45">Photos stay on your device — you'll share the originals on WhatsApp after confirming.</p>
    </>
  );

  const stepSizeCrop = active && (
    <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
      <div>
        {/* photo switcher */}
        {slots.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {slots.map((p, i) => (
              <button key={p.id} onClick={() => setActiveId(p.id)}
                className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold transition ${
                  p.id === active.id ? 'border-gold bg-gold text-white' : 'border-stone text-charcoal/60'}`}>
                Photo {i + 1}
              </button>
            ))}
          </div>
        )}
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Recommended print size</p>
        <div className="grid max-h-[38vh] grid-cols-3 gap-1.5 overflow-y-auto pr-1 lg:max-h-[52vh]">
          {PRINT_SIZES.map((s) => (
            <button key={s.id} onClick={() => patchSlot(active.id, { sizeId: s.id })}
              className={`relative rounded-lg border-2 px-1.5 py-2 text-xs font-bold transition ${
                active.sizeId === s.id ? 'border-gold bg-gold text-white' : 'border-stone bg-white text-charcoal/70 hover:border-gold/50'}`}>
              {s.label}
              {s.tag && <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[8px] font-black uppercase ${active.sizeId === s.id ? 'bg-charcoal text-white' : 'bg-gold/15 text-gold-dark'}`}>{s.tag}</span>}
            </button>
          ))}
        </div>
        {isFrame && (
          <div className="mt-4 hidden lg:block">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Frame preview</p>
            <FramePreview slot={active} frame={frame} border={border} />
          </div>
        )}
      </div>
      <ImageCropper slot={active}
        onCrop={(patch) => patchCrop(active.id, patch)}
        onTransform={(op) => doTransform(active.id, op)} />
    </div>
  );

  const stepOptions = (
    <div className="space-y-5">
      {!isFrame ? (
        <div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Print type</p>
          <div className="flex flex-wrap gap-2">
            {PRINT_TYPES.map((t) => (
              <button key={t} onClick={() => setPrintType(t)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                  printType === t ? 'border-gold bg-gold text-white' : 'border-stone bg-white text-charcoal/65'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Frame style</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {FRAME_STYLES.map((f) => (
                <button key={f.id} onClick={() => setFrame(f)}
                  className={`rounded-xl border-2 p-1.5 transition ${frame.id === f.id ? 'border-gold bg-gold/5' : 'border-stone bg-white hover:border-gold/50'}`}>
                  <img src={f.img} alt={f.name} loading="lazy"
                    className="block aspect-[4/5] w-full rounded-[3px] object-cover" />
                  <span className="mt-1 block truncate text-center text-[9px] font-bold text-charcoal/65">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Border / Matting</p>
            <div className="flex flex-wrap gap-2">
              {BORDER_OPTIONS.map((b) => (
                <button key={b} onClick={() => setBorder(b)}
                  className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                    border === b ? 'border-gold bg-gold text-white' : 'border-stone bg-white text-charcoal/65'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Photo fit (applies to all photos)</p>
            <div className="flex flex-wrap gap-2">
              {([['Fit Full Photo', 'fit'], ['Fill Frame / Crop', 'fill'], ['Center Photo', 'center']] as const).map(([label, m]) => (
                <button key={m}
                  onClick={() => { setSlots((s) => s.map((p) => ({ ...p, crop: { ...p.crop, mode: m, ...(m !== 'fill' ? { ox: 0, oy: 0 } : {}) } }))); showToast(`${label} applied to all photos ✓`); }}
                  className="rounded-full border-2 border-stone bg-white px-3.5 py-1.5 text-xs font-bold text-charcoal/65 transition hover:border-gold">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <FramePreview slot={active} frame={frame} border={border} />
        </>
      )}

      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Quantity per photo</p>
        <div className="space-y-2">
          {slots.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-stone bg-white p-2">
              <CroppedThumb slot={p} className="w-10 rounded-md" />
              <span className="min-w-0 flex-1 text-xs font-bold text-charcoal/70">Photo {i + 1} · {sizeById(p.sizeId).label}″</span>
              <div className="flex items-center gap-2">
                <button onClick={() => patchSlot(p.id, { qty: Math.max(1, p.qty - 1) })} aria-label="Decrease quantity" className="grid h-7 w-7 place-items-center rounded-full border border-stone hover:border-gold"><Minus size={12} /></button>
                <span className="w-5 text-center text-sm font-extrabold">{p.qty}</span>
                <button onClick={() => patchSlot(p.id, { qty: p.qty + 1 })} aria-label="Increase quantity" className="grid h-7 w-7 place-items-center rounded-full border border-stone hover:border-gold"><Plus size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-charcoal/45">Note for us (optional)</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={isFrame ? 'e.g. Need it gift-wrapped before Saturday…' : 'e.g. Slightly brighten photo 2…'}
          className="w-full resize-none rounded-xl border border-stone bg-white px-3 py-2 text-sm text-charcoal outline-none focus:border-gold" />
      </label>
    </div>
  );

  const stepSummary = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone bg-cream/60 p-4">
        <p className="mb-3 text-sm font-extrabold text-charcoal">
          {slots.length} photo{slots.length > 1 ? 's' : ''} · {totalPrints} {isFrame ? 'frame' : 'print'}{totalPrints > 1 ? 's' : ''}
          {!isFrame ? ` · ${printType}` : ` · ${frame.name} · ${border}`}
        </p>
        <ul className="space-y-2.5">
          {slots.map((p, i) => {
            const q = slotQuality(p);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm">
                {isFrame ? (
                  <div className="w-12 shrink-0 rounded-[3px] p-[5px]" style={{ background: frame.mat }}>
                    <CroppedThumb slot={p} />
                  </div>
                ) : (
                  <CroppedThumb slot={p} className="w-12 shrink-0 rounded-md" />
                )}
                <div className="min-w-0 flex-1 text-xs leading-relaxed text-charcoal/70">
                  <span className="font-extrabold text-charcoal">Photo {i + 1}</span> · {sizeById(p.sizeId).label}″ · {cropModeLabel(p.crop.mode)} · Qty {p.qty}
                  <span className="ml-1 rounded-full px-1.5 py-px text-[9px] font-bold text-white" style={{ backgroundColor: q.color }}>{q.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
        {note.trim() && <p className="mt-3 text-xs text-charcoal/60"><span className="font-bold">Note:</span> {note}</p>}
      </div>
      <p className="text-center text-[11px] text-charcoal/45">
        Confirming opens WhatsApp with this summary — then just attach your original photos in the chat.
      </p>
      <a href={wa(waMessage)} target="_blank" rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-gold/30 transition hover:brightness-105">
        <MessageCircle size={16} /> Order on WhatsApp
      </a>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[96] flex items-stretch justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true"
      aria-label={isFrame ? 'Custom frame customizer' : 'Photo print customizer'}>
      <button className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" aria-label="Close customizer" onClick={onClose} />
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-warm sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl sm:shadow-2xl">
        {/* header */}
        <header className="flex shrink-0 items-center gap-2 border-b border-stone bg-white px-4 py-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} aria-label="Previous step"
              className="grid h-8 w-8 place-items-center rounded-full text-charcoal/55 hover:bg-cream"><ChevronLeft size={18} /></button>
          )}
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg font-bold text-charcoal">
              {isFrame ? 'Custom Frame' : 'Photo Print'} Customizer
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold-dark">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>
          {/* stepper */}
          <ol className="mx-auto hidden items-center gap-1 sm:flex">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-1">
                <button onClick={() => (i < step || slots.length) && setStep(i)}
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold transition ${
                    i === step ? 'bg-gold text-white' : i < step ? 'bg-charcoal text-white' : 'bg-stone text-charcoal/50'}`}>
                  {i < step ? <Check size={11} /> : i + 1}
                </button>
                {i < STEPS.length - 1 && <span className="h-px w-4 bg-stone" />}
              </li>
            ))}
          </ol>
          <button onClick={onClose} aria-label="Close"
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-charcoal/55 hover:bg-cream sm:ml-0"><X size={18} /></button>
        </header>

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 0 && stepPhotos}
          {step === 1 && (active ? stepSizeCrop : <p className="text-center text-sm text-charcoal/50">Upload a photo first.</p>)}
          {step === 2 && stepOptions}
          {step === 3 && stepSummary}
        </div>

        {/* footer nav */}
        {step < 3 && (
          <footer className="flex shrink-0 items-center justify-between border-t border-stone bg-white px-4 py-3">
            <span className="text-[11px] font-semibold text-charcoal/45">
              {slots.length}/{MAX_PHOTOS} photos{slots.length ? ` · ${totalPrints} ${isFrame ? 'frames' : 'prints'}` : ''}
            </span>
            <div className="flex gap-2">
              {step === 1 && slots.length < MAX_PHOTOS && (
                <button onClick={() => setStep(0)}
                  className="rounded-full border-2 border-stone px-4 py-2 text-xs font-bold text-charcoal/60 hover:border-gold">+ Add photo</button>
              )}
              <button onClick={next}
                className="rounded-full bg-charcoal px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-charcoal/85">
                Continue →
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
