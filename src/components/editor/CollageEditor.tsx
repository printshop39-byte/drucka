import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActiveSelection, Canvas, FabricImage, FabricObject, Group, PencilBrush, Point, Textbox, util,
} from 'fabric';
import {
  AlignOp, BgState, CANVAS_PRESETS, HistoryManager, ImageMeta, ShapeId,
  addPhoto, addText, alignObject, applyBackground, applyEffects, applyShape,
  designDims, duplicateObject, downloadDataUrl, eid, exportImage, groupSelection,
  isLocked, kindOf, layerOp, mergeSelection, metaOf, placeBorder, removeBorderOf,
  setLocked, syncBorder, ungroupSelection,
} from '../../lib/editor/fabricHelpers';
import EditorToolbar from './EditorToolbar';
import Section from './Section';
import ShapeCropMenu from './ShapeCropMenu';
import ImageEffectsPanel from './ImageEffectsPanel';
import BackgroundPanel from './BackgroundPanel';
import BlendPanel from './BlendPanel';
import DrawingPanel from './DrawingPanel';
import TextPanel from './TextPanel';
import LayoutPanel from './LayoutPanel';

/* ── Drucka Pro Collage Editor — free-form Fabric.js canvas ──
   Lives inside the existing Collage Maker entry as its "Pro" mode.
   Photos stay in the browser; export renders a high-res PNG/JPEG. */

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
  const snapRef = useRef(true);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const captureTimer = useRef<number | undefined>(undefined);
  const bgRef = useRef<BgState>({ type: 'solid', color: '#ffffff' });

  const [presetId, setPresetId] = useState('square');
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [penMode, setPenMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#c19a3d');
  const [brushSize, setBrushSize] = useState(8);
  const [bg, setBg] = useState<BgState>({ type: 'solid', color: '#ffffff' });
  const [grid, setGrid] = useState(false);
  const [snap, setSnap] = useState(true);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
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
    if (bgRef.current.type === 'gradient') applyBackground(fc, bgRef.current); // gradient coords track size
    fc.requestRenderAll();
    refresh();
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
    if (import.meta.env.DEV) (window as any).__fc = fc; // dev-only test hook
    fitCanvas();
    histRef.current.capture(fc);

    const exitCropNow = () => { cropRef.current = false; setCropMode(false); };
    const syncSelection = () => {
      const obj = fc.getActiveObject() ?? null;
      setSelected(obj);
      if (cropRef.current) exitCropNow();
      refresh();
    };
    fc.on('selection:created', syncSelection);
    fc.on('selection:updated', syncSelection);
    fc.on('selection:cleared', () => {
      setSelected(null);
      setGuides({ v: null, h: null });
      if (cropRef.current) exitCropNow();
      refresh();
    });

    fc.on('object:moving', (e) => {
      const obj = e.target as FabricObject;
      if ((obj as any).dru?.kind === 'border') return;
      const meta = metaOf(obj);
      if (cropRef.current && meta && obj === fc.getActiveObject() && (obj as FabricImage).clipPath) {
        /* crop mode: photo slides, mask stays put — compensate the clip offset */
        const img = obj as FabricImage;
        const last = lastPosRef.current ?? { x: img.left ?? 0, y: img.top ?? 0 };
        const d = new Point((img.left ?? 0) - last.x, (img.top ?? 0) - last.y)
          .rotate(-util.degreesToRadians(img.angle ?? 0));
        const clip = img.clipPath as FabricObject;
        const lim = Math.min(img.width!, img.height!) / 2;
        clip.left = Math.max(-lim, Math.min(lim, (clip.left ?? 0) - d.x / (img.scaleX || 1)));
        clip.top = Math.max(-lim, Math.min(lim, (clip.top ?? 0) - d.y / (img.scaleY || 1)));
        img.set('dirty', true);
      } else if (snapRef.current) {
        /* snap to canvas center + edges with gold guides */
        const { dw, dh } = designDims(fc);
        const th = 10;
        const br = obj.getBoundingRect();
        let gv: number | null = null, gh: number | null = null;
        const cx = br.left + br.width / 2, cy = br.top + br.height / 2;
        if (Math.abs(cx - dw / 2) < th) { obj.left = (obj.left ?? 0) + dw / 2 - cx; gv = dw / 2; }
        else if (Math.abs(br.left) < th) { obj.left = (obj.left ?? 0) - br.left; gv = 0; }
        else if (Math.abs(br.left + br.width - dw) < th) { obj.left = (obj.left ?? 0) + dw - br.left - br.width; gv = dw; }
        if (Math.abs(cy - dh / 2) < th) { obj.top = (obj.top ?? 0) + dh / 2 - cy; gh = dh / 2; }
        else if (Math.abs(br.top) < th) { obj.top = (obj.top ?? 0) - br.top; gh = 0; }
        else if (Math.abs(br.top + br.height - dh) < th) { obj.top = (obj.top ?? 0) + dh - br.top - br.height; gh = dh; }
        obj.setCoords();
        setGuides((g) => (g.v !== gv || g.h !== gh ? { v: gv, h: gh } : g));
      }
      lastPosRef.current = { x: obj.left ?? 0, y: obj.top ?? 0 };
      if (meta) placeBorder(fc, obj as FabricImage);
    });
    fc.on('object:scaling', (e) => { const o = e.target as FabricObject; if (metaOf(o)) placeBorder(fc, o as FabricImage); });
    fc.on('object:rotating', (e) => { const o = e.target as FabricObject; if (metaOf(o)) placeBorder(fc, o as FabricImage); });
    fc.on('object:modified', (e) => {
      const o = e.target as FabricObject;
      lastPosRef.current = null;
      setGuides({ v: null, h: null });
      if (metaOf(o)) placeBorder(fc, o as FabricImage);
      captureSoon();
    });
    fc.on('mouse:down', (e) => {
      const o = e.target as FabricObject | undefined;
      if (o && !((o as any).dru?.kind === 'border')) lastPosRef.current = { x: o.left ?? 0, y: o.top ?? 0 };
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
    /* drawn paths become tagged, selectable layers */
    fc.on('path:created', (e: any) => {
      const p = e.path as FabricObject;
      (p as any).dru = { kind: 'draw', id: eid() };
      p.set({
        cornerColor: '#c19a3d', cornerStrokeColor: '#fff', borderColor: '#c19a3d',
        cornerSize: 11, transparentCorners: false,
      });
      setEmpty(false);
      captureSoon();
    });
    fc.on('text:editing:exited', () => captureSoon());

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
      if ((fc.getActiveObject() as any)?.isEditing) return; // typing inside a Textbox
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); doRedo(); }
      if (e.key === 'Escape' && cropRef.current) exitCrop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── derived selection info ── */
  const fc = fcRef.current;
  const selMeta = metaOf(selected);
  const selKind = kindOf(selected);
  const isMulti = selected instanceof ActiveSelection;
  const isGroup = !isMulti && selected instanceof Group;
  const isText = selected instanceof Textbox;
  const locked = selected ? isLocked(selected) : false;
  const blend = (selected?.globalCompositeOperation as string) ?? 'source-over';
  const hasDrawings = !!fc?.getObjects().some((o) => (o as any).dru?.kind === 'draw');
  const zoom = fc?.getZoom() ?? 1;

  const recountEmpty = (c: Canvas) =>
    setEmpty(!c.getObjects().some((o) => (o as any).dru?.kind !== 'border'));

  /* ── actions ── */
  const handleUpload = async (files: FileList | null) => {
    const c = fcRef.current;
    if (!c || !files?.length) return;
    let added = 0;
    for (const f of [...files]) {
      try {
        const url = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onerror = () => rej(new Error('read failed'));
          r.onload = () => res(r.result as string);
          r.readAsDataURL(f);
        });
        await addPhoto(c, url, c.getObjects().filter((o) => metaOf(o)).length);
        added++;
      } catch {
        showToast(`⚠ ${f.name}: could not load`);
      }
    }
    if (added) { setEmpty(false); captureSoon(); showToast(`${added} photo${added > 1 ? 's' : ''} added ✓`); }
  };

  const changeBg = (next: BgState) => {
    const c = fcRef.current;
    if (!c) return;
    bgRef.current = next;
    setBg(next);
    applyBackground(c, next);
    captureSoon();
  };

  const togglePen = () => {
    const c = fcRef.current;
    if (!c) return;
    const next = !penMode;
    setPenMode(next);
    c.isDrawingMode = next;
    if (next) {
      if (cropRef.current) exitCrop();
      c.discardActiveObject();
      setSelected(null);
      if (!c.freeDrawingBrush) c.freeDrawingBrush = new PencilBrush(c);
      c.freeDrawingBrush.color = brushColor;
      c.freeDrawingBrush.width = brushSize;
    }
    c.requestRenderAll();
  };
  const setBrush = (color: string, size: number) => {
    setBrushColor(color);
    setBrushSize(size);
    const b = fcRef.current?.freeDrawingBrush;
    if (b) { b.color = color; b.width = size; }
  };
  const clearDrawings = () => {
    const c = fcRef.current;
    if (!c) return;
    c.getObjects().filter((o) => (o as any).dru?.kind === 'draw').forEach((o) => c.remove(o));
    recountEmpty(c);
    c.requestRenderAll();
    captureSoon();
    showToast('Drawings cleared');
  };

  const handleAddText = () => {
    const c = fcRef.current;
    if (!c) return;
    if (penMode) togglePen();
    addText(c);
    setEmpty(false);
    captureSoon();
  };
  const patchText = (props: Partial<Record<string, unknown>>) => {
    const c = fcRef.current;
    if (!c || !isText) return;
    (selected as Textbox).set(props as any);
    (selected as Textbox).setCoords();
    c.requestRenderAll();
    refresh();
    captureSoon();
  };

  const patchEffects = (patch: Partial<ImageMeta['effects']>) => {
    const c = fcRef.current;
    if (!c || !selMeta) return;
    Object.assign(selMeta.effects, patch);
    applyEffects(c, selected as FabricImage);
    refresh();
    captureSoon();
  };
  const patchStyle = (patch: { radius?: number; shadow?: number; borderWidth?: number; borderColor?: string; borderStyle?: ImageMeta['border']['style'] }) => {
    const c = fcRef.current;
    if (!c || !selMeta) return;
    const img = selected as FabricImage;
    if (patch.radius !== undefined) {
      selMeta.radius = patch.radius;
      if (selMeta.shape === 'rounded' || selMeta.shape === 'none') applyShape(c, img, selMeta.shape);
    }
    if (patch.shadow !== undefined) { selMeta.shadow = patch.shadow; applyEffects(c, img); }
    if (patch.borderWidth !== undefined) selMeta.border.width = patch.borderWidth;
    if (patch.borderColor !== undefined) selMeta.border.color = patch.borderColor;
    if (patch.borderStyle !== undefined) selMeta.border.style = patch.borderStyle;
    if (patch.borderWidth !== undefined || patch.borderColor !== undefined || patch.borderStyle !== undefined) syncBorder(c, img);
    refresh();
    captureSoon();
  };
  const pickShape = (shape: ShapeId) => {
    const c = fcRef.current;
    if (!c || !selMeta) return;
    applyShape(c, selected as FabricImage, shape);
    refresh();
    captureSoon();
  };

  const setBlend = (mode: string) => {
    const c = fcRef.current;
    if (!c || !selected) return;
    selected.set({ globalCompositeOperation: mode });
    selected.set('dirty', true);
    c.requestRenderAll();
    refresh();
    captureSoon();
  };

  const doMerge = async () => {
    const c = fcRef.current;
    if (!c) return;
    const merged = await mergeSelection(c);
    if (merged) { setSelected(merged); captureSoon(); showToast('Merged into one image ✓ — you can now shape-crop it'); }
  };
  const doGroup = () => {
    const c = fcRef.current;
    if (!c) return;
    const g = groupSelection(c);
    if (g) { setSelected(g); captureSoon(); showToast('Grouped ✓ (photo borders removed)'); }
  };
  const doUngroup = () => {
    const c = fcRef.current;
    if (!c) return;
    if (ungroupSelection(c)) { setSelected(c.getActiveObject() ?? null); captureSoon(); showToast('Ungrouped ✓'); }
  };

  const deleteSelected = () => {
    const c = fcRef.current;
    if (!c || !selected) return;
    const items = isMulti ? [...(selected as ActiveSelection).getObjects()] : [selected];
    c.discardActiveObject();
    items.forEach((o) => {
      if (metaOf(o)) removeBorderOf(c, o as FabricImage);
      c.remove(o);
    });
    setSelected(null);
    recountEmpty(c);
    c.requestRenderAll();
    captureSoon();
  };

  const doUndo = async () => {
    const c = fcRef.current;
    if (!c) return;
    if (cropRef.current) exitCrop();
    await histRef.current.undo(c);
    setSelected(null);
    recountEmpty(c);
    syncBgFromCanvas(c);
    refresh();
  };
  const doRedo = async () => {
    const c = fcRef.current;
    if (!c) return;
    await histRef.current.redo(c);
    setSelected(null);
    recountEmpty(c);
    syncBgFromCanvas(c);
    refresh();
  };
  const syncBgFromCanvas = (c: Canvas) => {
    const b = c.backgroundColor as unknown;
    const next: BgState = !b ? { type: 'transparent' }
      : typeof b === 'string' ? { type: 'solid', color: b }
      : { type: 'gradient', presetId: bgRef.current.type === 'gradient' ? bgRef.current.presetId : 'gold' };
    bgRef.current = next;
    setBg(next);
  };

  const doExport = (fmt: 'png' | 'png-hd' | 'jpeg') => {
    const c = fcRef.current;
    if (!c) return;
    if (!c.getObjects().some((o) => (o as any).dru?.kind !== 'border')) { showToast('⚠ Add something to the canvas first'); return; }
    setExporting(true);
    window.setTimeout(() => {
      try {
        const url = fmt === 'jpeg'
          ? exportImage(c, 'jpeg', 3000)
          : exportImage(c, 'png', fmt === 'png-hd' ? 3000 : 1500);
        downloadDataUrl(url, `drucka-collage-${presetRef.current.id}.${fmt === 'jpeg' ? 'jpg' : 'png'}`);
        showToast(`${fmt === 'jpeg' ? 'JPEG' : fmt === 'png-hd' ? 'High-res PNG' : 'PNG'} exported ✓`);
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

  const { dw, dh } = fc ? designDims(fc) : { dw: 1080, dh: 1080 };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#141021]" role="dialog" aria-modal="true" aria-label="Pro collage editor">
      <EditorToolbar
        onClose={onClose}
        onBackToGrid={onBackToGrid}
        onUpload={handleUpload}
        onAddText={handleAddText}
        penMode={penMode} onTogglePen={togglePen}
        canUndo={histRef.current.canUndo} canRedo={histRef.current.canRedo}
        onUndo={doUndo} onRedo={doRedo}
        presetId={presetId} onPreset={changePreset}
        hasSelection={!!selected} locked={locked}
        cropMode={cropMode}
        cropPossible={!!selMeta && !!(selected as FabricImage)?.clipPath && !locked}
        onToggleCrop={() => {
          const c = fcRef.current;
          if (!c || !selMeta) return;
          if (cropRef.current) { exitCrop(); return; }
          cropRef.current = true;
          setCropMode(true);
          selected!.set({ hasControls: false });
          lastPosRef.current = { x: selected!.left ?? 0, y: selected!.top ?? 0 };
          c.requestRenderAll();
        }}
        onLayer={(op) => { if (selected && fcRef.current) { layerOp(fcRef.current, selected, op); captureSoon(); } }}
        onDuplicate={async () => {
          if (selected && fcRef.current && !isMulti) {
            const copy = await duplicateObject(fcRef.current, selected);
            if (metaOf(copy)) applyEffects(fcRef.current, copy as FabricImage);
            setSelected(copy);
            captureSoon();
          }
        }}
        onDelete={deleteSelected}
        onLock={() => {
          if (!selected) return;
          setLocked(selected, !locked);
          fcRef.current?.requestRenderAll();
          refresh();
          showToast(locked ? 'Unlocked' : 'Locked 🔒');
        }}
        exporting={exporting} onExport={doExport}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* canvas stage */}
        <div ref={hostRef} className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-3">
          <div className={`relative rounded shadow-2xl ${bg.type === 'transparent' ? 'checker' : ''}`}>
            <canvas ref={elRef} />
            {/* grid overlay (visual aid only — never exports) */}
            {grid && (
              <div className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(to right, rgba(193,154,61,.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(193,154,61,.22) 1px, transparent 1px)',
                  backgroundSize: `${(dw * zoom) / 12}px ${(dh * zoom) / 12}px`,
                }} />
            )}
            {/* snap guides */}
            {guides.v !== null && (
              <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-gold shadow-[0_0_4px_rgba(193,154,61,.8)]" style={{ left: guides.v * zoom }} />
            )}
            {guides.h !== null && (
              <div className="pointer-events-none absolute left-0 right-0 h-px bg-gold shadow-[0_0_4px_rgba(193,154,61,.8)]" style={{ top: guides.h * zoom }} />
            )}
          </div>
          {empty && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/5 px-6 py-4 text-center text-sm font-semibold text-white/45">
                Click <span className="text-gold">Photos</span> to start — or add <span className="text-gold">text</span> &amp; <span className="text-gold">drawings</span><br />
                <span className="text-[11px] font-medium text-white/30">Shape crops · blend modes · borders · snap guides · high-res export</span>
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
          {penMode && (
            <div className="absolute inset-x-0 top-2 z-10 flex justify-center">
              <button onClick={togglePen}
                className="rounded-full bg-gold px-4 py-2 text-[11px] font-bold text-white shadow-xl">
                Drawing mode · {brushSize}px — tap to finish ✓
              </button>
            </div>
          )}
        </div>

        {/* right panel (desktop) / bottom panel (mobile) */}
        <aside className="max-h-[42vh] shrink-0 space-y-2 overflow-y-auto border-t border-white/10 bg-[#1a1429] p-3 scroll-thin lg:max-h-none lg:w-[280px] lg:border-l lg:border-t-0">
          {penMode && (
            <Section title="Drawing" defaultOpen>
              <DrawingPanel color={brushColor} onColor={(c) => setBrush(c, brushSize)}
                size={brushSize} onSize={(s) => setBrush(brushColor, s)}
                onClear={clearDrawings} hasDrawings={hasDrawings} />
            </Section>
          )}
          {isText && (
            <Section title="Text" defaultOpen>
              <TextPanel text={selected as Textbox} onPatch={patchText} />
            </Section>
          )}
          {selMeta && (
            <>
              <Section title="Shape Crop" defaultOpen>
                <ShapeCropMenu value={selMeta.shape} onChange={pickShape} />
              </Section>
              <Section title="Effects · Border · Shadow" defaultOpen>
                <ImageEffectsPanel meta={selMeta} onEffect={patchEffects} onStyle={patchStyle} />
              </Section>
            </>
          )}
          {selected && !penMode && (
            <Section title="Blend & Merge" defaultOpen={isMulti}>
              <BlendPanel blend={blend} onBlend={setBlend}
                isMulti={isMulti} isGroup={isGroup}
                onMerge={doMerge} onGroup={doGroup} onUngroup={doUngroup} />
            </Section>
          )}
          <Section title="Background" defaultOpen={!selected && !penMode}>
            <BackgroundPanel bg={bg} onChange={changeBg} />
          </Section>
          <Section title="Layout & Snap">
            <LayoutPanel hasSelection={!!selected}
              onAlign={(op: AlignOp) => {
                if (selected && fcRef.current) { alignObject(fcRef.current, selected, op); captureSoon(); }
              }}
              onCenterBoth={() => {
                if (selected && fcRef.current) {
                  alignObject(fcRef.current, selected, 'centerH');
                  alignObject(fcRef.current, selected, 'middle');
                  captureSoon();
                }
              }}
              grid={grid} onGrid={setGrid}
              snap={snap} onSnap={(v) => { setSnap(v); snapRef.current = v; }} />
          </Section>
        </aside>
      </div>
    </div>
  );
}
