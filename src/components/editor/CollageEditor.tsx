import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActiveSelection, Canvas, FabricImage, FabricObject, Group, PencilBrush, Point, Textbox, util,
} from 'fabric';
import {
  LayoutGrid, ImagePlus, Palette, Ruler, Type, Sticker, Download, Pen,
  Crop, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Copy, Trash2, Lock, Unlock,
  Settings2, Upload, Wand2, Crown, Repeat2,
} from 'lucide-react';
import {
  AlignOp, BgState, CANVAS_PRESETS, FRAME_PRESETS, HistoryManager, ImageMeta, ShapeId,
  addPhoto, addText, alignObject, applyBackground, applyEffects, applyShape,
  designDims, duplicateObject, downloadDataUrl, eid, exportImage, groupSelection,
  isLocked, layerOp, mergeSelection, metaOf, placeBorder, removeBorderOf,
  replaceImageSrc, setLocked, syncBorder, ungroupSelection,
} from '../../lib/editor/fabricHelpers';
import { GRAPHICS, graphicDataUrl } from '../../designer/data';
import EditorToolbar from './EditorToolbar';
import Section from './Section';
import ShapeCropMenu from './ShapeCropMenu';
import ImageEffectsPanel from './ImageEffectsPanel';
import BackgroundPanel from './BackgroundPanel';
import BlendPanel from './BlendPanel';
import DrawingPanel from './DrawingPanel';
import TextPanel from './TextPanel';
import LayoutPanel from './LayoutPanel';

/* ── Drucka Pro Editor — the Collage Maker's freeform mode ──
   Reuses the Collage Maker SHELL: the same 7-tab left sidebar stays
   visible and drives the Fabric canvas (Photos uploads, Text adds text,
   Style sets the background, Size sets the artboard, Stickers add
   graphics, Export downloads). Advanced controls live on the right. */

interface Props {
  onClose: () => void;
  onBackToGrid: () => void;
  showToast: (msg: string) => void;
}

type TabId = 'layouts' | 'photos' | 'style' | 'size' | 'text' | 'stickers' | 'effects' | 'export';
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'layouts', label: 'Layouts', icon: LayoutGrid },
  { id: 'photos', label: 'Photos', icon: ImagePlus },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'size', label: 'Size', icon: Ruler },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'stickers', label: 'Stickers', icon: Sticker },
  { id: 'effects', label: 'Effects', icon: Wand2 },
  { id: 'export', label: 'Export', icon: Download },
];

export default function CollageEditor({ onBackToGrid, showToast }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const fcRef = useRef<Canvas | null>(null);
  const histRef = useRef(new HistoryManager());
  const presetRef = useRef(CANVAS_PRESETS[0]);
  const cropRef = useRef(false);
  const snapRef = useRef(true);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const captureTimer = useRef<number | undefined>(undefined);
  const bgRef = useRef<BgState>({ type: 'solid', color: '#ffffff' });

  const [tab, setTab] = useState<TabId>('photos');
  const [mobilePanel, setMobilePanel] = useState<TabId | 'tools' | null>(null);
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
    if (bgRef.current.type === 'gradient') applyBackground(fc, bgRef.current);
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

  /* ── canvas lifecycle (unchanged engine) ── */
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
      if ((fc.getActiveObject() as any)?.isEditing) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); doRedo(); }
      if (e.key === 'Escape' && cropRef.current) exitCrop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── derived ── */
  const fc = fcRef.current;
  const selMeta = metaOf(selected);
  const isMulti = selected instanceof ActiveSelection;
  const isGroup = !isMulti && selected instanceof Group;
  const isText = selected instanceof Textbox;
  const locked = selected ? isLocked(selected) : false;
  const blend = (selected?.globalCompositeOperation as string) ?? 'source-over';
  const hasDrawings = !!fc?.getObjects().some((o) => (o as any).dru?.kind === 'draw');
  const zoom = fc?.getZoom() ?? 1;
  const recountEmpty = (c: Canvas) =>
    setEmpty(!c.getObjects().some((o) => (o as any).dru?.kind !== 'border'));

  /* ── actions (unchanged engine, new entry points) ── */
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

  const handleReplace = async (files: FileList | null) => {
    const c = fcRef.current;
    const img = selected as FabricImage | null;
    if (!c || !img || !selMeta || !files?.length) return;
    try {
      const url = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onerror = () => rej(new Error('read failed'));
        r.onload = () => res(r.result as string);
        r.readAsDataURL(files[0]);
      });
      await replaceImageSrc(c, img, url);
      refresh();
      captureSoon();
      showToast('Photo replaced ✓');
    } catch {
      showToast('⚠ Could not load that image');
    }
  };
  const applyFrame = (id: string) => {
    const preset = FRAME_PRESETS.find((f) => f.id === id);
    if (!preset) return;
    patchStyle({ borderWidth: preset.width, borderColor: preset.color, borderStyle: preset.style });
    showToast(preset.id === 'none' ? 'Frame removed' : `${preset.label} frame applied ✓`);
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
    setTab('text');
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

  const addSticker = async (svgUrl: string) => {
    const c = fcRef.current;
    if (!c) return;
    const img = await addPhoto(c, svgUrl, c.getObjects().length);
    const { dw } = designDims(c);
    const s = (dw * 0.18) / img.width!;
    img.set({ scaleX: s, scaleY: s });
    img.setCoords();
    c.requestRenderAll();
    setEmpty(false);
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
    if (merged) { setSelected(merged); captureSoon(); showToast('Merged into one image ✓'); }
  };
  const doGroup = () => {
    const c = fcRef.current;
    if (!c) return;
    const g = groupSelection(c);
    if (g) { setSelected(g); captureSoon(); showToast('Grouped ✓'); }
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

  const onToggleCrop = () => {
    const c = fcRef.current;
    if (!c || !selMeta) return;
    if (cropRef.current) { exitCrop(); return; }
    cropRef.current = true;
    setCropMode(true);
    selected!.set({ hasControls: false });
    lastPosRef.current = { x: selected!.left ?? 0, y: selected!.top ?? 0 };
    c.requestRenderAll();
  };

  /* ── LEFT sidebar panels (same tabs as the grid Collage Maker) ── */
  const leftPanel = (id: TabId, mobile = false) => {
    const done = () => { if (mobile) setMobilePanel(null); };
    switch (id) {
      case 'layouts': return (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-white/55">
            <span className="font-bold text-gold">Pro Editor is freeform</span> — place photos anywhere,
            no fixed grid. Grid templates &amp; smart templates live in the Grid Editor.
          </p>
          <button onClick={onBackToGrid}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-2.5 text-[11px] font-bold text-white transition hover:bg-white/15">
            <LayoutGrid size={13} /> Switch to Grid Editor
          </button>
        </div>
      );
      case 'photos': return (
        <div className="space-y-3">
          <button onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-gold/50 bg-gold/8 px-4 py-7 text-gold transition hover:bg-gold/15">
            <Upload size={22} />
            <span className="text-sm font-bold">Add photos</span>
            <span className="text-[10px] text-gold/65">JPG · PNG · WEBP — multiple allowed</span>
          </button>
          <p className="text-[10px] leading-relaxed text-white/40">
            Photos land on the artboard — drag, resize, rotate freely. Select one to crop it into shapes and add effects (right panel).
          </p>
        </div>
      );
      case 'style': return <BackgroundPanel bg={bg} onChange={changeBg} />;
      case 'size': return (
        <div className="space-y-1.5">
          {CANVAS_PRESETS.map((c) => (
            <button key={c.id} onClick={() => { changePreset(c.id); done(); }}
              className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition ${
                presetId === c.id ? 'border-gold bg-gold/10 text-white' : 'border-white/10 text-white/65 hover:border-white/30'}`}>
              {c.label}
              <span className="text-[9px] text-white/35">{c.w}×{c.h}</span>
            </button>
          ))}
        </div>
      );
      case 'text': return (
        <div className="space-y-3">
          <button onClick={() => { handleAddText(); done(); }}
            className="w-full rounded-full bg-gold py-2.5 text-sm font-bold text-white transition hover:brightness-110">
            + Add text
          </button>
          {isText
            ? <TextPanel text={selected as Textbox} onPatch={patchText} />
            : <p className="text-[10px] text-white/40">Select a text layer on the canvas to edit its font, style and spacing.</p>}
        </div>
      );
      case 'stickers': return (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Tap to add</p>
          <div className="grid grid-cols-4 gap-2">
            {GRAPHICS.map((g: any) => (
              <button key={g.id} title={g.label} onClick={() => { addSticker(graphicDataUrl(g)); done(); }}
                className="grid aspect-square place-items-center rounded-xl border border-white/10 bg-white/5 p-2 transition hover:border-gold">
                <img src={graphicDataUrl(g)} alt={g.label} className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>
      );
      case 'effects': return (
        selected ? (
          <div className="space-y-2">
            <p className="text-[10px] leading-relaxed text-white/45">Effects apply to the selected layer. Stack as many as you like.</p>
            {selMeta && (
              <>
                <button onClick={() => replaceRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-2 text-[11px] font-bold text-white transition hover:bg-white/15">
                  <Repeat2 size={13} /> Replace image
                </button>
                <Section title="Shape Crop" defaultOpen>
                  <ShapeCropMenu value={selMeta.shape} onChange={pickShape} />
                </Section>
                <Section title="Decorative Frames" defaultOpen>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FRAME_PRESETS.map((f) => {
                      const on = selMeta.border.width === f.width && selMeta.border.color === f.color && selMeta.border.style === f.style
                        || (f.id === 'none' && selMeta.border.width === 0);
                      return (
                        <button key={f.id} onClick={() => applyFrame(f.id)}
                          className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition ${
                            on ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'}`}>
                          <span className="grid h-8 w-8 place-items-center rounded-sm bg-white/15"
                            style={f.id === 'none' ? undefined : { boxShadow: `inset 0 0 0 ${Math.max(2, f.width / 8)}px ${f.color}` }}>
                            {f.id === 'none' && <span className="text-[8px] font-bold text-white/40">OFF</span>}
                          </span>
                          <span className="text-[8.5px] font-bold text-white/55">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>
                <Section title="Tint Color" pro>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['#c19a3d', '#6e1423', '#22304f', '#1d4a38', '#5b21b6', '#211c17'].map((c) => (
                        <button key={c} aria-label={`Tint ${c}`} onClick={() => patchEffects({ tint: c, tintStrength: selMeta.effects.tintStrength || 40 })}
                          className={`h-6 w-6 rounded-full border-2 ${selMeta.effects.tint === c ? 'border-gold ring-2 ring-gold/40' : 'border-white/25'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={selMeta.effects.tint} aria-label="Custom tint colour"
                        onChange={(e) => patchEffects({ tint: e.target.value, tintStrength: selMeta.effects.tintStrength || 40 })}
                        className="h-6 w-6 cursor-pointer rounded-full border border-white/25 bg-transparent" />
                    </div>
                    <label className="block">
                      <span className="mb-0.5 flex justify-between text-[9.5px] font-bold uppercase tracking-wide text-white/45">
                        Strength <span className="text-white/70">{selMeta.effects.tintStrength}%</span>
                      </span>
                      <input type="range" min={0} max={100} value={selMeta.effects.tintStrength}
                        onChange={(e) => patchEffects({ tintStrength: +e.target.value })} className="w-full accent-gold" />
                    </label>
                  </div>
                </Section>
                <Section title="Pro Effects · Border · Shadow" pro defaultOpen>
                  <ImageEffectsPanel meta={selMeta} onEffect={patchEffects} onStyle={patchStyle} />
                </Section>
              </>
            )}
            <Section title="Fade & Blend" pro defaultOpen={isMulti}>
              <BlendPanel blend={blend} onBlend={setBlend}
                isMulti={isMulti} isGroup={isGroup}
                onMerge={doMerge} onGroup={doGroup} onUngroup={doUngroup} />
            </Section>
            {isText && !selMeta && (
              <p className="text-[10px] leading-relaxed text-white/40">Editing text? Open the <span className="font-bold text-white/70">Text</span> tab for fonts &amp; styles.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/8 px-3 py-2.5 text-[11px] font-bold text-gold">
              <Wand2 size={14} /> Select a photo to unlock effects
            </div>
            <p className="text-[10px] leading-relaxed text-white/45">
              Tap a photo on the artboard, then come back here for shape crops, filters, borders,
              shadows, fade &amp; blend. Pro effects are marked with a <span className="text-gold-light">crown</span>.
            </p>
          </div>
        )
      );
      case 'export': return (
        <div className="space-y-2">
          <button onClick={() => doExport('png')} disabled={exporting}
            className="w-full rounded-full bg-gold py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50">
            Download PNG · standard
          </button>
          <button onClick={() => doExport('png-hd')} disabled={exporting}
            className="w-full rounded-full bg-white/10 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
            Download PNG · high-res 3000px
          </button>
          <button onClick={() => doExport('jpeg')} disabled={exporting}
            className="w-full rounded-full bg-white/10 py-2.5 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50">
            Download JPEG · white background
          </button>
          <p className="pt-1 text-[9px] leading-relaxed text-white/35">
            Want a framed/canvas print of your collage? Switch to the Grid Editor — its Export tab has the order-print flow.
          </p>
        </div>
      );
    }
  };

  /* ── RIGHT advanced panel (contextual) ── */
  const SelBtn = ({ title, onClick, disabled, active, danger, children }: any) => (
    <button title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${
        active ? 'bg-gold text-white' : danger ? 'text-red-300 hover:bg-red-500/15' : 'text-white/70 hover:bg-white/10'
      } disabled:opacity-25 disabled:pointer-events-none`}>
      {children}
    </button>
  );
  const rightPanel = (
    <div className="space-y-2">
      {/* pen toggle always reachable */}
      <button onClick={togglePen}
        className={`flex w-full items-center justify-center gap-2 rounded-full border-2 py-2 text-[11px] font-bold transition ${
          penMode ? 'border-gold bg-gold text-white' : 'border-white/12 text-white/65 hover:border-gold/60'}`}>
        <Pen size={13} /> {penMode ? 'Finish drawing' : 'Pen / brush tool'}
      </button>
      {penMode && (
        <Section title="Drawing" defaultOpen>
          <DrawingPanel color={brushColor} onColor={(c) => setBrush(c, brushSize)}
            size={brushSize} onSize={(s) => setBrush(brushColor, s)}
            onClear={clearDrawings} hasDrawings={hasDrawings} />
        </Section>
      )}

      {selected && !penMode && (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2">
          <p className="mb-1.5 px-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-gold/90">Selected layer</p>
          <div className="flex flex-wrap items-center gap-0.5">
            <SelBtn title={cropMode ? 'Done cropping' : 'Crop inside shape (double-click photo)'}
              onClick={onToggleCrop} disabled={!selMeta || !(selected as FabricImage)?.clipPath || locked} active={cropMode}><Crop size={14} /></SelBtn>
            <SelBtn title="Bring forward" onClick={() => { layerOp(fc!, selected, 'forward'); captureSoon(); }}><ChevronUp size={14} /></SelBtn>
            <SelBtn title="Send backward" onClick={() => { layerOp(fc!, selected, 'backward'); captureSoon(); }}><ChevronDown size={14} /></SelBtn>
            <SelBtn title="Bring to front" onClick={() => { layerOp(fc!, selected, 'front'); captureSoon(); }}><ChevronsUp size={14} /></SelBtn>
            <SelBtn title="Send to back" onClick={() => { layerOp(fc!, selected, 'back'); captureSoon(); }}><ChevronsDown size={14} /></SelBtn>
            <SelBtn title="Duplicate" disabled={isMulti}
              onClick={async () => {
                const copy = await duplicateObject(fc!, selected);
                if (metaOf(copy)) applyEffects(fc!, copy as FabricImage);
                setSelected(copy);
                captureSoon();
              }}><Copy size={14} /></SelBtn>
            <SelBtn title={locked ? 'Unlock' : 'Lock'} active={locked}
              onClick={() => { setLocked(selected, !locked); fc!.requestRenderAll(); refresh(); }}>
              {locked ? <Lock size={13} /> : <Unlock size={13} />}
            </SelBtn>
            <SelBtn title="Delete (Del)" danger onClick={deleteSelected}><Trash2 size={13} /></SelBtn>
          </div>
        </div>
      )}

      {isText && !penMode && (
        <Section title="Text" defaultOpen>
          <TextPanel text={selected as Textbox} onPatch={patchText} />
        </Section>
      )}
      {selected && !penMode && (
        <button onClick={() => { setTab('effects'); setMobilePanel(null); }}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-gold/40 bg-gold/10 py-2 text-[11px] font-bold text-gold transition hover:bg-gold/20">
          <Wand2 size={13} /> Effects, crop &amp; blend
          <Crown size={11} className="text-gold-light" />
        </button>
      )}
      <Section title="Layout & Snap">
        <LayoutPanel hasSelection={!!selected}
          onAlign={(op: AlignOp) => { if (selected && fc) { alignObject(fc, selected, op); captureSoon(); } }}
          onCenterBoth={() => {
            if (selected && fc) {
              alignObject(fc, selected, 'centerH');
              alignObject(fc, selected, 'middle');
              captureSoon();
            }
          }}
          grid={grid} onGrid={setGrid}
          snap={snap} onSnap={(v) => { setSnap(v); snapRef.current = v; }} />
      </Section>
      {!selected && !penMode && (
        <p className="px-1 text-[9px] leading-relaxed text-white/30">
          Select a layer on the artboard to see its shape-crop, effects, border and blend controls here.
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#141021]" role="dialog" aria-modal="true" aria-label="Pro collage editor">
      <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }} />
      <input ref={replaceRef} type="file" hidden accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { handleReplace(e.target.files); e.target.value = ''; }} />

      <EditorToolbar
        onBack={onBackToGrid}
        canUndo={histRef.current.canUndo} canRedo={histRef.current.canRedo}
        onUndo={doUndo} onRedo={doRedo}
        exporting={exporting} onExport={doExport}
      />

      <div className="flex min-h-0 flex-1">
        {/* LEFT — the Collage Maker sidebar, alive in Pro mode (desktop) */}
        <aside className="hidden w-[330px] shrink-0 border-r border-white/8 bg-[#1a1429] lg:flex">
          <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-white/6 py-3">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[9px] font-bold transition ${
                  tab === t.id ? 'bg-gold/15 text-gold' : 'text-white/45 hover:bg-white/5 hover:text-white'}`}>
                <t.icon size={19} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto p-4 scroll-thin">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold/90">{TABS.find((t) => t.id === tab)?.label}</p>
            {leftPanel(tab)}
          </div>
        </aside>

        {/* CENTER — artboard */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div ref={hostRef} className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-3">
            <div className={`relative rounded shadow-2xl ${bg.type === 'transparent' ? 'checker' : ''}`}>
              <canvas ref={elRef} />
              {grid && (
                <div className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(to right, rgba(193,154,61,.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(193,154,61,.22) 1px, transparent 1px)',
                    backgroundSize: `${(dw * zoom) / 12}px ${(dh * zoom) / 12}px`,
                  }} />
              )}
              {guides.v !== null && (
                <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-gold shadow-[0_0_4px_rgba(193,154,61,.8)]" style={{ left: guides.v * zoom }} />
              )}
              {guides.h !== null && (
                <div className="pointer-events-none absolute left-0 right-0 h-px bg-gold shadow-[0_0_4px_rgba(193,154,61,.8)]" style={{ top: guides.h * zoom }} />
              )}
            </div>

            {/* empty state — a solid UI card with real actions (HTML only,
                outside the Fabric canvas, can never export) */}
            {empty && !penMode && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="w-[300px] max-w-[88%] rounded-2xl border border-gold/30 bg-[#1d1830] p-5 text-center shadow-2xl">
                  <p className="text-sm font-bold text-white">Add photos, text, or drawings to start</p>
                  <p className="mt-1 text-[10px] text-white/45">Freeform artboard — everything is draggable, croppable &amp; blendable</p>
                  <div className="mt-4 grid gap-2">
                    <button onClick={() => fileRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-xs font-bold text-white transition hover:brightness-110">
                      <ImagePlus size={14} /> Add Photos
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleAddText}
                        className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 py-2 text-[11px] font-bold text-white transition hover:bg-white/15">
                        <Type size={13} /> Add Text
                      </button>
                      <button onClick={togglePen}
                        className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 py-2 text-[11px] font-bold text-white transition hover:bg-white/15">
                        <Pen size={13} /> Pen Tool
                      </button>
                    </div>
                  </div>
                </div>
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

          {/* mobile: contextual tools entry */}
          {(selected || penMode) && (
            <button onClick={() => setMobilePanel('tools')}
              className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-bold text-white shadow-xl lg:hidden">
              <Settings2 size={14} /> {penMode ? 'Brush settings' : 'Layer tools'}
            </button>
          )}
        </div>

        {/* RIGHT — Pro advanced controls (desktop) */}
        <aside className="hidden w-[280px] shrink-0 space-y-2 overflow-y-auto border-l border-white/10 bg-[#1a1429] p-3 scroll-thin lg:block">
          {rightPanel}
        </aside>
      </div>

      {/* mobile: same Collage Maker tabs as a bottom bar */}
      <nav className="z-30 flex shrink-0 items-stretch justify-around border-t border-white/8 bg-[#1a1429] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMobilePanel(t.id); }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-bold text-white/55">
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </nav>

      {/* mobile slide-up sheet */}
      {mobilePanel && (
        <div className="fixed inset-0 z-[97] lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/55" aria-label="Close panel" onClick={() => setMobilePanel(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-hidden rounded-t-3xl bg-[#1a1429] shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
            <div className="max-h-[calc(70vh-12px)] overflow-y-auto p-4 scroll-thin">
              {mobilePanel === 'tools' ? rightPanel : leftPanel(mobilePanel, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
