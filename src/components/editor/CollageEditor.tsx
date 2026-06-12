import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, FabricObject, Point, util } from 'fabric';
import {
  CANVAS_PRESETS, HistoryManager, ImageMeta, ShapeId, addPhoto, applyEffects,
  applyShape, duplicatePhoto, downloadDataUrl, exportPng, isLocked, layerOp,
  metaOf, placeBorder, removeBorderOf, setLocked, syncBorder,
} from '../../lib/editor/fabricHelpers';
import EditorToolbar from './EditorToolbar';
import ShapeCropMenu from './ShapeCropMenu';
import ImageEffectsPanel from './ImageEffectsPanel';

/* ── Drucka Pro Collage Editor — free-form Fabric.js canvas ──
   Lives inside the existing Collage Maker entry as its "Pro" mode.
   Photos stay in the browser; export renders a high-res PNG (~3000px). */

interface Props {
  onClose: () => void;
  onBackToGrid: () => void;
  showToast: (msg: string) => void;
}

export default function CollageEditor({ onClose, onBackToGrid, showToast }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const histRef = useRef(new HistoryManager());
  const presetRef = useRef(CANVAS_PRESETS[0]);
  const cropRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const captureTimer = useRef<number | undefined>(undefined);

  const [presetId, setPresetId] = useState('square');
  const [selected, setSelected] = useState<FabricImage | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  const captureSoon = useCallback(() => {
    window.clearTimeout(captureTimer.current);
    captureTimer.current = window.setTimeout(() => {
      const fc = fcRef.current;
      if (fc) { histRef.current.capture(fc); refresh(); }
    }, 350);
  }, []);

  const fitCanvas = useCallback(() => {
    const fc = fcRef.current, host = hostRef.current;
    if (!fc || !host) return;
    const { w, h } = presetRef.current;
    const pad = 24;
    const s = Math.min((host.clientWidth - pad) / w, (host.clientHeight - pad) / h, 1.2);
    fc.setDimensions({ width: Math.round(w * s), height: Math.round(h * s) });
    fc.setZoom(s);
    fc.requestRenderAll();
  }, []);

  const exitCrop = useCallback(() => {
    cropRef.current = false;
    setCropMode(false);
    const fc = fcRef.current;
    const obj = fc?.getActiveObject() as FabricImage | undefined;
    if (obj && metaOf(obj)) { obj.set({ hasControls: true }); placeBorder(fc!, obj); }
    fc?.requestRenderAll();
    captureSoon();
  }, [captureSoon]);

  /* ── canvas lifecycle ── */
  useEffect(() => {
    const fc = new Canvas(elRef.current!, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });
    fcRef.current = fc;
    fitCanvas();
    histRef.current.capture(fc);

    const syncSelection = () => {
      const obj = fc.getActiveObject();
      setSelected(metaOf(obj as FabricObject) ? (obj as FabricImage) : null);
      if (cropRef.current) exitCropNow();
      refresh();
    };
    const exitCropNow = () => { cropRef.current = false; setCropMode(false); };

    fc.on('selection:created', syncSelection);
    fc.on('selection:updated', syncSelection);
    fc.on('selection:cleared', () => { setSelected(null); if (cropRef.current) exitCropNow(); refresh(); });

    fc.on('object:moving', (e) => {
      const img = e.target as FabricImage;
      const meta = metaOf(img);
      if (!meta) return;
      if (cropRef.current && img === fc.getActiveObject() && img.clipPath) {
        /* crop mode: photo slides, mask stays put — compensate the clip offset */
        const last = lastPosRef.current ?? { x: img.left ?? 0, y: img.top ?? 0 };
        const d = new Point((img.left ?? 0) - last.x, (img.top ?? 0) - last.y)
          .rotate(-util.degreesToRadians(img.angle ?? 0));
        const clip = img.clipPath as FabricObject;
        const lim = Math.min(img.width!, img.height!) / 2;
        clip.left = Math.max(-lim, Math.min(lim, (clip.left ?? 0) - d.x / (img.scaleX || 1)));
        clip.top = Math.max(-lim, Math.min(lim, (clip.top ?? 0) - d.y / (img.scaleY || 1)));
        img.set('dirty', true);
      }
      lastPosRef.current = { x: img.left ?? 0, y: img.top ?? 0 };
      placeBorder(fc, img);
    });
    fc.on('object:scaling', (e) => { const img = e.target as FabricImage; if (metaOf(img)) placeBorder(fc, img); });
    fc.on('object:rotating', (e) => { const img = e.target as FabricImage; if (metaOf(img)) placeBorder(fc, img); });
    fc.on('object:modified', (e) => {
      const img = e.target as FabricImage;
      lastPosRef.current = null;
      if (metaOf(img)) placeBorder(fc, img);
      captureSoon();
    });
    fc.on('mouse:down', (e) => {
      const img = e.target as FabricImage | undefined;
      if (img && metaOf(img)) lastPosRef.current = { x: img.left ?? 0, y: img.top ?? 0 };
    });
    fc.on('mouse:dblclick', (e) => {
      const img = e.target as FabricImage | undefined;
      if (!img || !metaOf(img) || !img.clipPath || isLocked(img)) return;
      fc.setActiveObject(img);
      cropRef.current = !cropRef.current;
      setCropMode(cropRef.current);
      img.set({ hasControls: !cropRef.current });
      lastPosRef.current = { x: img.left ?? 0, y: img.top ?? 0 };
      fc.requestRenderAll();
      if (!cropRef.current) captureSoon();
    });

    const ro = new ResizeObserver(fitCanvas);
    ro.observe(hostRef.current!);

    return () => {
      ro.disconnect();
      fc.dispose();
      fcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const fc = fcRef.current;
      if (!fc) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deletePhoto(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); doRedo(); }
      if (e.key === 'Escape' && cropRef.current) exitCrop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── actions ── */
  const handleUpload = async (files: FileList | null) => {
    const fc = fcRef.current;
    if (!fc || !files?.length) return;
    let added = 0;
    for (const f of [...files]) {
      try {
        const url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onerror = () => rej(new Error('read failed'));
          r.onload = () => res(r.result as string);
          r.readAsDataURL(f);
        });
        await addPhoto(fc, url, fc.getObjects().filter((o) => metaOf(o)).length);
        added++;
      } catch {
        showToast(`⚠ ${f.name}: could not load`);
      }
    }
    if (added) { setEmpty(false); captureSoon(); showToast(`${added} photo${added > 1 ? 's' : ''} added ✓`); }
  };

  const patchEffects = (patch: Partial<ImageMeta['effects']>) => {
    const fc = fcRef.current;
    if (!fc || !selected) return;
    const meta = metaOf(selected)!;
    Object.assign(meta.effects, patch);
    applyEffects(fc, selected);
    refresh();
    captureSoon();
  };

  const patchStyle = (patch: { radius?: number; shadow?: number; borderWidth?: number; borderColor?: string }) => {
    const fc = fcRef.current;
    if (!fc || !selected) return;
    const meta = metaOf(selected)!;
    if (patch.radius !== undefined) {
      meta.radius = patch.radius;
      if (meta.shape === 'rounded' || meta.shape === 'none') applyShape(fc, selected, meta.shape);
    }
    if (patch.shadow !== undefined) { meta.shadow = patch.shadow; applyEffects(fc, selected); }
    if (patch.borderWidth !== undefined) meta.border.width = patch.borderWidth;
    if (patch.borderColor !== undefined) meta.border.color = patch.borderColor;
    if (patch.borderWidth !== undefined || patch.borderColor !== undefined) syncBorder(fc, selected);
    refresh();
    captureSoon();
  };

  const pickShape = (shape: ShapeId) => {
    const fc = fcRef.current;
    if (!fc || !selected) return;
    applyShape(fc, selected, shape);
    refresh();
    captureSoon();
  };

  const deletePhoto = () => {
    const fc = fcRef.current;
    if (!fc || !selected) return;
    removeBorderOf(fc, selected);
    fc.remove(selected);
    fc.discardActiveObject();
    setSelected(null);
    setEmpty(!fc.getObjects().some((o) => metaOf(o)));
    fc.requestRenderAll();
    captureSoon();
  };

  const doUndo = async () => {
    const fc = fcRef.current;
    if (!fc) return;
    if (cropRef.current) exitCrop();
    await histRef.current.undo(fc);
    setSelected(null);
    setEmpty(!fc.getObjects().some((o) => metaOf(o)));
    refresh();
  };
  const doRedo = async () => {
    const fc = fcRef.current;
    if (!fc) return;
    await histRef.current.redo(fc);
    setSelected(null);
    setEmpty(!fc.getObjects().some((o) => metaOf(o)));
    refresh();
  };

  const doExport = () => {
    const fc = fcRef.current;
    if (!fc) return;
    if (!fc.getObjects().some((o) => metaOf(o))) { showToast('⚠ Add at least one photo first'); return; }
    setExporting(true);
    window.setTimeout(() => {
      try {
        const url = exportPng(fc, 3000);
        downloadDataUrl(url, `drucka-collage-${presetRef.current.id}.png`);
        showToast('High-resolution PNG exported ✓');
      } catch (err) {
        showToast(`⚠ Export failed: ${(err as Error).message}`);
      } finally {
        setExporting(false);
      }
    }, 60);
  };

  const changePreset = (id: string) => {
    presetRef.current = CANVAS_PRESETS.find((c) => c.id === id) ?? CANVAS_PRESETS[0];
    setPresetId(id);
    fitCanvas();
  };

  const meta = selected ? metaOf(selected) : null;
  const locked = selected ? isLocked(selected) : false;

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#141021]" role="dialog" aria-modal="true" aria-label="Pro collage editor">
      <EditorToolbar
        onClose={onClose}
        onBackToGrid={onBackToGrid}
        onUpload={handleUpload}
        canUndo={histRef.current.canUndo} canRedo={histRef.current.canRedo}
        onUndo={doUndo} onRedo={doRedo}
        presetId={presetId} onPreset={changePreset}
        hasSelection={!!selected} locked={locked}
        cropMode={cropMode} cropPossible={!!selected && !!selected.clipPath && !locked}
        onToggleCrop={() => {
          const fc = fcRef.current;
          if (!fc || !selected) return;
          if (cropRef.current) { exitCrop(); return; }
          cropRef.current = true;
          setCropMode(true);
          selected.set({ hasControls: false });
          lastPosRef.current = { x: selected.left ?? 0, y: selected.top ?? 0 };
          fc.requestRenderAll();
        }}
        onLayer={(op) => { if (selected && fcRef.current) { layerOp(fcRef.current, selected, op); captureSoon(); } }}
        onDuplicate={async () => {
          if (selected && fcRef.current) {
            const copy = await duplicatePhoto(fcRef.current, selected);
            applyEffects(fcRef.current, copy);
            setSelected(copy);
            captureSoon();
          }
        }}
        onDelete={deletePhoto}
        onLock={() => {
          if (!selected) return;
          setLocked(selected, !locked);
          fcRef.current?.requestRenderAll();
          refresh();
          showToast(locked ? 'Photo unlocked' : 'Photo locked 🔒');
        }}
        exporting={exporting} onExport={doExport}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* canvas stage */}
        <div ref={hostRef} className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-3">
          <div className="rounded shadow-2xl">
            <canvas ref={elRef} />
          </div>
          {empty && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/5 px-6 py-4 text-center text-sm font-semibold text-white/45">
                Click <span className="text-gold">Add photos</span> to start your collage<br />
                <span className="text-[11px] font-medium text-white/30">Drag · resize · rotate · shape-crop · effects · export</span>
              </p>
            </div>
          )}
          {cropMode && (
            <div className="absolute inset-x-0 top-2 z-10 flex justify-center">
              <button onClick={exitCrop}
                className="rounded-full bg-gold px-4 py-2 text-[11px] font-bold text-white shadow-xl">
                Crop mode — drag the photo inside its shape · tap to finish ✓
              </button>
            </div>
          )}
        </div>

        {/* right panel (desktop) / bottom panel (mobile) */}
        {selected && meta && (
          <aside className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-white/10 bg-[#1a1429] p-4 scroll-thin lg:max-h-none lg:w-[270px] lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <ShapeCropMenu value={meta.shape} onChange={pickShape} />
              <ImageEffectsPanel meta={meta} onEffect={patchEffects} onStyle={patchStyle} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
