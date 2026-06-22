import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, FlipHorizontal, RefreshCw, Search, X } from 'lucide-react';
import {
  CROP_MODES, CropState, PhotoSlot, cssFilter, effectiveDpi, slotSize, slotQuality,
} from './customizerData';

/* ── ImageCropper — live crop editor for one photo slot ──
   The preview box always has the selected print size's aspect ratio.
   fill/center: photo covers the box, drag to pan, zoom slider crops in.
   fit: whole photo contained, cream borders where it doesn't reach.
   free: drag/resize a crop box over the photo; the box keeps the print
   ratio so what you frame is exactly what prints. All math runs on the
   rotation-baked bitmap (see customizerData.transformSlot). */

interface Props {
  slot: PhotoSlot;
  onCrop: (patch: Partial<CropState>) => void;
  onTransform: (op: 'rotL' | 'rotR' | 'flipH') => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function ImageCropper({ slot, onCrop, onTransform }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [inspect, setInspect] = useState(false);
  const size = slotSize(slot);
  const c = slot.crop;
  const printAspect = size.w / size.h;
  const imgAspect = slot.pw / slot.ph;
  const quality = slotQuality(slot);
  const dpi = Math.round(effectiveDpi(slot));

  /* pan limits for fill/center: how far the cover-scaled photo can shift */
  const panLimits = () => {
    const coverW = Math.max(1, printAspect / imgAspect); // width of photo / width of box
    const coverH = Math.max(1, imgAspect / printAspect);
    return {
      x: ((coverW * c.zoom - 1) / 2) * 100,
      y: ((coverH * c.zoom - 1) / 2) * 100,
    };
  };

  const startPan = (e: React.PointerEvent) => {
    if (c.mode === 'fit' || c.mode === 'free') return;
    e.preventDefault();
    const rect = boxRef.current!.getBoundingClientRect();
    const pointerId = e.pointerId;
    try { (e.currentTarget as HTMLElement).setPointerCapture(pointerId); } catch { /* best effort */ }
    const start = { px: e.clientX, py: e.clientY, ox: c.ox, oy: c.oy };
    const lim = panLimits();
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      onCrop({
        mode: 'fill', // panning a center-crop makes it a manual fill crop
        ox: clamp(start.ox + ((ev.clientX - start.px) / rect.width) * 100, -lim.x, lim.x),
        oy: clamp(start.oy + ((ev.clientY - start.py) / rect.height) * 100, -lim.y, lim.y),
      });
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  /* free-crop box drag / corner-resize (box coords are % of the photo) */
  const startBox = (e: React.PointerEvent, kind: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    const host = (e.currentTarget as HTMLElement).closest('[data-freehost]') as HTMLElement;
    const rect = host.getBoundingClientRect();
    const pointerId = e.pointerId;
    try { (e.currentTarget as HTMLElement).setPointerCapture(pointerId); } catch { /* best effort */ }
    const start = { px: e.clientX, py: e.clientY, ...c.box };
    const boxAspectLock = printAspect / imgAspect; // box h% per w% that keeps print ratio
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const dx = ((ev.clientX - start.px) / rect.width) * 100;
      const dy = ((ev.clientY - start.py) / rect.height) * 100;
      if (kind === 'move') {
        onCrop({ box: {
          ...c.box,
          x: clamp(start.x + dx, 0, 100 - start.w),
          y: clamp(start.y + dy, 0, 100 - start.h),
        }});
        return;
      }
      // corner resize, print ratio locked: width change drives height
      const sign = kind === 'ne' || kind === 'se' ? 1 : -1;
      let w = clamp(start.w + sign * dx, 10, 100);
      let h = (w / boxAspectLock) * 1; // keep w:h tied to print aspect in image space
      h = w * (imgAspect / printAspect);
      if (h > 100) { h = 100; w = h * (printAspect / imgAspect); }
      let x = kind === 'nw' || kind === 'sw' ? start.x + start.w - w : start.x;
      let y = kind === 'nw' || kind === 'ne' ? start.y + start.h - h : start.y;
      x = clamp(x, 0, 100 - w);
      y = clamp(y, 0, 100 - h);
      onCrop({ box: { x, y, w, h } });
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const setMode = (mode: CropState['mode']) => {
    if (mode === 'center') onCrop({ mode, ox: 0, oy: 0 });
    else if (mode === 'free') {
      // start with the largest print-ratio box centred on the photo
      const ratio = printAspect / imgAspect;
      let w = 90, h = 90 * (imgAspect / printAspect) * ratio; // = 90
      h = w * (imgAspect / printAspect);
      if (h > 90) { h = 90; w = h * (printAspect / imgAspect); }
      h = w * (imgAspect / printAspect);
      onCrop({ mode, box: { x: (100 - w) / 2, y: (100 - h) / 2, w, h } });
    } else onCrop({ mode });
  };

  const reset = () => onCrop({ mode: 'fill', zoom: 1, ox: 0, oy: 0, bright: 100, contrast: 100, sat: 100, box: { x: 10, y: 10, w: 80, h: 80 } });

  /* image style inside the aspect box for fill/center/fit */
  const photoStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute', left: '50%', top: '50%', maxWidth: 'none', maxHeight: 'none',
      filter: cssFilter(c),
    };
    if (c.mode === 'fit') {
      return { ...base, transform: 'translate(-50%,-50%)', ...(imgAspect > printAspect ? { width: '100%' } : { height: '100%' }) };
    }
    const cover = imgAspect > printAspect ? { height: `${100 * c.zoom}%` } : { width: `${100 * c.zoom}%` };
    return {
      ...base,
      transform: `translate(calc(-50% + ${c.ox}%), calc(-50% + ${c.oy}%))`,
      ...cover,
    };
  };

  return (
    <div>
      {/* preview box in print-size shape */}
      <div className="mx-auto w-full max-w-[340px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal/45">
            Recommended size: <span className="text-charcoal">{size.label}″</span> · ratio {size.w}:{size.h}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: quality.color }}>
            {quality.label} · {dpi} DPI
          </span>
        </div>

        {c.mode !== 'free' ? (
          <div ref={boxRef}
            onPointerDown={startPan}
            className={`relative w-full overflow-hidden rounded-lg border-2 border-stone bg-cream shadow-inner ${c.mode !== 'fit' ? 'cursor-move' : ''} touch-none select-none`}
            style={{ aspectRatio: `${size.w} / ${size.h}`, maxHeight: '46vh' }}>
            <img src={slot.src} alt={slot.name} draggable={false} className="select-none" style={photoStyle()} />
            {/* rule-of-thirds guides */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute top-1/3 left-0 w-full h-px bg-white/70" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-white/70" />
            </div>
          </div>
        ) : (
          /* free crop: photo contained, print-ratio box on top */
          <div data-freehost
            className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg border-2 border-stone bg-charcoal/90 touch-none select-none"
            style={{ maxHeight: '46vh' }}>
            <img src={slot.src} alt={slot.name} draggable={false} className="block max-h-[46vh] max-w-full select-none" style={{ filter: cssFilter(c) }} />
            <div className="absolute bg-black/45 inset-0 pointer-events-none" />
            <div
              onPointerDown={(e) => startBox(e, 'move')}
              className="absolute cursor-move border-2 border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] touch-none"
              style={{ left: `${c.box.x}%`, top: `${c.box.y}%`, width: `${c.box.w}%`, height: `${c.box.h}%` }}>
              <img src={slot.src} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none"
                style={{
                  width: `${10000 / c.box.w}%`,
                  left: `${(-c.box.x * 100) / c.box.w}%`,
                  top: `${(-c.box.y * 100) / c.box.h}%`,
                  filter: cssFilter(c),
                }} />
              {(['nw', 'ne', 'sw', 'se'] as const).map((k) => (
                <span key={k} onPointerDown={(e) => startBox(e, k)}
                  className={`absolute h-4 w-4 rounded-full border-2 border-gold bg-white touch-none ${
                    k === 'nw' ? '-left-2 -top-2 cursor-nwse-resize' :
                    k === 'ne' ? '-right-2 -top-2 cursor-nesw-resize' :
                    k === 'sw' ? '-left-2 -bottom-2 cursor-nesw-resize' : '-right-2 -bottom-2 cursor-nwse-resize'}`} />
              ))}
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-[11px] font-medium" style={{ color: quality.color }}>{quality.message}</p>
      </div>

      {/* crop mode chips */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {CROP_MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} title={m.hint}
            className={`rounded-full border-2 px-3 py-1.5 text-[11px] font-bold transition ${
              c.mode === m.id ? 'border-gold bg-gold text-white' : 'border-stone bg-white text-charcoal/65 hover:border-gold/60'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* transform controls */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <button onClick={() => onCrop({ zoom: clamp(c.zoom + 0.15, 1, 4) })} title="Zoom in" disabled={c.mode === 'fit' || c.mode === 'free'}
          className="ctl"><ZoomIn size={15} /></button>
        <input type="range" min={1} max={4} step={0.05} value={c.zoom} disabled={c.mode === 'fit' || c.mode === 'free'}
          onChange={(e) => {
            const zoom = +e.target.value;
            const lim = { x: ((Math.max(1, printAspect / imgAspect) * zoom - 1) / 2) * 100, y: ((Math.max(1, imgAspect / printAspect) * zoom - 1) / 2) * 100 };
            onCrop({ zoom, ox: clamp(c.ox, -lim.x, lim.x), oy: clamp(c.oy, -lim.y, lim.y) });
          }}
          className="w-28 accent-gold disabled:opacity-30" aria-label="Zoom" />
        <button onClick={() => onCrop({ zoom: clamp(c.zoom - 0.15, 1, 4) })} title="Zoom out" disabled={c.mode === 'fit' || c.mode === 'free'}
          className="ctl"><ZoomOut size={15} /></button>
        <span className="mx-1 h-5 w-px bg-stone" />
        <button onClick={() => onTransform('rotL')} title="Rotate left" className="ctl"><RotateCcw size={15} /></button>
        <button onClick={() => onTransform('rotR')} title="Rotate right" className="ctl"><RotateCw size={15} /></button>
        <button onClick={() => onTransform('flipH')} title="Flip horizontal" className="ctl"><FlipHorizontal size={15} /></button>
        <span className="mx-1 h-5 w-px bg-stone" />
        <button onClick={reset} title="Reset crop" className="ctl"><RefreshCw size={15} /></button>
        <button onClick={() => setInspect(true)} title="Inspect detail (check sharpness)"
          className="flex items-center gap-1.5 rounded-full border border-stone bg-white px-3 h-[34px] text-[11px] font-bold text-charcoal/75 transition hover:border-gold">
          <Search size={14} /> Inspect
        </button>
      </div>

      {/* adjustments */}
      <div className="mx-auto mt-3 grid max-w-sm grid-cols-3 gap-3">
        {([['Brightness', 'bright'], ['Contrast', 'contrast'], ['Saturation', 'sat']] as const).map(([label, key]) => (
          <label key={key} className="block text-center">
            <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-charcoal/40">{label}</span>
            <input type="range" min={50} max={150} value={c[key]}
              onChange={(e) => onCrop({ [key]: +e.target.value } as Partial<CropState>)}
              className="w-full accent-gold" />
          </label>
        ))}
      </div>

      {/* inspect overlay — see the photo at full detail to judge sharpness */}
      {inspect && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-charcoal/90 backdrop-blur-sm"
          onClick={() => setInspect(false)}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-sm font-bold">Inspect detail · {slot.ow}×{slot.oh}px</p>
              <p className="truncate text-[11px] text-white/70">
                Pinch / scroll to examine. Soft or pixelated here means it will print blurry — {quality.label} ({dpi} DPI) at {size.label}″.
              </p>
            </div>
            <button onClick={() => setInspect(false)} aria-label="Close inspect"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={18} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2" onClick={(e) => e.stopPropagation()}>
            <img src={slot.src} alt={slot.name} draggable={false}
              style={{ width: slot.pw, maxWidth: 'none', filter: cssFilter(c) }}
              className="mx-auto select-none rounded shadow-2xl" />
          </div>
        </div>
      )}

      <style>{`.ctl{display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;border:1px solid var(--color-stone);color:#211c17;background:#fff;transition:.2s}.ctl:hover{border-color:var(--color-gold)}.ctl:disabled{opacity:.3;pointer-events:none}`}</style>
    </div>
  );
}
