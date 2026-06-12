/* ── Fabric.js helpers for the Drucka Pro Collage Editor ──
   Modern fabric (v6/v7) ESM named imports — no `fabric.fabric` legacy
   namespace. All editor metadata lives on `obj.dru` (serialized via
   FabricObject.customProperties) so undo/redo and duplication keep it. */

import {
  Canvas, FabricImage, FabricObject, Rect, Circle, Triangle, Polygon, Path,
  Shadow, Point, filters, util,
} from 'fabric';

/* serialize our metadata with every snapshot/clone */
FabricObject.customProperties = ['dru'];

export type ShapeId = 'none' | 'circle' | 'rounded' | 'square' | 'heart' | 'star' | 'triangle' | 'hexagon';

export interface ImageMeta {
  kind: 'image';
  id: string;
  shape: ShapeId;
  radius: number;                       // corner radius % (rounded / none border)
  border: { width: number; color: string };
  shadow: number;                       // 0–40 blur px (design space)
  effects: { blur: number; brightness: number; contrast: number; opacity: number };
}
export interface BorderMeta { kind: 'border'; for: string }
export type DruMeta = ImageMeta | BorderMeta;

export const eid = () => Math.random().toString(36).slice(2, 9);

export const defaultMeta = (): ImageMeta => ({
  kind: 'image', id: eid(), shape: 'none', radius: 0,
  border: { width: 0, color: '#c19a3d' },
  shadow: 0,
  effects: { blur: 0, brightness: 100, contrast: 100, opacity: 100 },
});

export const metaOf = (o: FabricObject | null | undefined): ImageMeta | null =>
  o && (o as any).dru?.kind === 'image' ? ((o as any).dru as ImageMeta) : null;

export const isLocked = (o: FabricObject) => !!o.lockMovementX;

/* ── canvas size presets (design pixels; export upscales) ── */
export const CANVAS_PRESETS = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'landscape', label: 'Landscape', w: 1350, h: 1080 },
  { id: 'a4', label: 'A4 Print', w: 1240, h: 1754 },
];

/* ── shape factory — geometry in the image's LOCAL (unscaled) space,
   centered origin, so it doubles as clipPath and as border outline ── */
export const SHAPES: { id: ShapeId; label: string }[] = [
  { id: 'none', label: 'Original' },
  { id: 'circle', label: 'Circle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'square', label: 'Square' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'hexagon', label: 'Hexagon' },
];

const polyPoints = (n: number, R: number, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => ({
    x: R * Math.cos(rot + (i * 2 * Math.PI) / n),
    y: R * Math.sin(rot + (i * 2 * Math.PI) / n),
  }));

const starPoints = (R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? R : r;
    return { x: rad * Math.cos(a), y: rad * Math.sin(a) };
  });

export function makeShape(shape: ShapeId, w: number, h: number, radiusPct = 0): FabricObject | null {
  const m = Math.min(w, h);
  const common = { originX: 'center', originY: 'center', left: 0, top: 0 } as const;
  switch (shape) {
    case 'circle':
      return new Circle({ ...common, radius: m / 2 });
    case 'square':
      return new Rect({ ...common, width: m, height: m });
    case 'rounded':
      return new Rect({ ...common, width: w, height: h, rx: (m / 2) * (Math.max(8, radiusPct) / 100), ry: (m / 2) * (Math.max(8, radiusPct) / 100) });
    case 'triangle':
      return new Triangle({ ...common, width: m, height: m });
    case 'hexagon':
      return new Polygon(polyPoints(6, m / 2), { ...common });
    case 'star':
      return new Polygon(starPoints(m / 2, m / 5), { ...common });
    case 'heart': {
      const p = new Path('M 0 30 C -38 2 -32 -38 0 -18 C 32 -38 38 2 0 30 Z', { ...common });
      const bw = p.width || 1, bh = p.height || 1;
      p.set({ scaleX: m / bw, scaleY: m / bh });
      return p;
    }
    case 'none':
      return radiusPct > 0
        ? new Rect({ ...common, width: w, height: h, rx: (m / 2) * (radiusPct / 100), ry: (m / 2) * (radiusPct / 100) })
        : null;
    default:
      return null;
  }
}

/* apply (or clear) the shape crop, preserving any crop offset */
export function applyShape(canvas: Canvas, img: FabricImage, shape: ShapeId) {
  const meta = metaOf(img)!;
  meta.shape = shape;
  const prev = img.clipPath as FabricObject | undefined;
  const clip = makeShape(shape, img.width!, img.height!, meta.radius);
  if (clip && prev) { clip.left = prev.left; clip.top = prev.top; }
  img.clipPath = clip ?? undefined;
  img.set('dirty', true);
  syncBorder(canvas, img);
  canvas.requestRenderAll();
}

/* ── image effects (filters + opacity + shadow) ── */
export function applyEffects(canvas: Canvas, img: FabricImage) {
  const { effects, shadow } = metaOf(img)!;
  const list: any[] = [];
  if (effects.blur > 0) list.push(new filters.Blur({ blur: effects.blur / 100 }));
  if (effects.brightness !== 100) list.push(new filters.Brightness({ brightness: (effects.brightness - 100) / 150 }));
  if (effects.contrast !== 100) list.push(new filters.Contrast({ contrast: (effects.contrast - 100) / 150 }));
  img.filters = list;
  img.applyFilters();
  img.opacity = effects.opacity / 100;
  img.shadow = shadow > 0
    ? new Shadow({ color: 'rgba(20,16,10,0.45)', blur: shadow, offsetX: 0, offsetY: shadow / 3 })
    : null;
  img.set('dirty', true);
  canvas.requestRenderAll();
}

/* ── shape-following border (separate stroke object kept in sync) ── */
export function syncBorder(canvas: Canvas, img: FabricImage) {
  const meta = metaOf(img)!;
  let border = canvas.getObjects().find((o) => (o as any).dru?.kind === 'border' && ((o as any).dru as BorderMeta).for === meta.id);
  if (!meta.border.width) {
    if (border) canvas.remove(border);
    return;
  }
  const geometry = makeShape(meta.shape, img.width!, img.height!, meta.radius)
    ?? new Rect({ originX: 'center', originY: 'center', left: 0, top: 0, width: img.width!, height: img.height! });
  if (border) canvas.remove(border);
  border = geometry;
  border.set({
    fill: 'transparent',
    stroke: meta.border.color,
    strokeWidth: meta.border.width,
    strokeUniform: true,
    selectable: false,
    evented: false,
    excludeFromExport: false,
  });
  (border as any).dru = { kind: 'border', for: meta.id } satisfies BorderMeta;
  canvas.add(border);
  placeBorder(canvas, img, border);
}

/* position/scale/rotate the border to track its image (incl. crop offset) */
export function placeBorder(canvas: Canvas, img: FabricImage, border?: FabricObject) {
  const meta = metaOf(img);
  if (!meta) return;
  border ??= canvas.getObjects().find((o) => (o as any).dru?.kind === 'border' && ((o as any).dru as BorderMeta).for === meta.id);
  if (!border) return;
  const center = img.getCenterPoint();
  const clip = img.clipPath as FabricObject | undefined;
  const off = new Point((clip?.left ?? 0) * img.scaleX!, (clip?.top ?? 0) * img.scaleY!)
    .rotate(util.degreesToRadians(img.angle ?? 0));
  // heart paths carry their own base scale — multiply, don't overwrite
  const baseSX = (border as any).__baseSX ?? ((border as any).__baseSX = border.scaleX ?? 1);
  const baseSY = (border as any).__baseSY ?? ((border as any).__baseSY = border.scaleY ?? 1);
  border.set({
    left: center.x + off.x,
    top: center.y + off.y,
    originX: 'center', originY: 'center',
    scaleX: baseSX * (img.scaleX ?? 1),
    scaleY: baseSY * (img.scaleY ?? 1),
    angle: img.angle ?? 0,
  });
  border.setCoords();
  const idx = canvas.getObjects().indexOf(img as unknown as FabricObject);
  canvas.moveObjectTo(border, idx + 1); // frame sits on top of its photo
  canvas.requestRenderAll();
}

export const removeBorderOf = (canvas: Canvas, img: FabricImage) => {
  const meta = metaOf(img);
  if (!meta) return;
  const border = canvas.getObjects().find((o) => (o as any).dru?.kind === 'border' && ((o as any).dru as BorderMeta).for === meta.id);
  if (border) canvas.remove(border);
};

/* ── add an uploaded photo ── */
export async function addPhoto(canvas: Canvas, dataUrl: string, index: number): Promise<FabricImage> {
  const img = await FabricImage.fromURL(dataUrl);
  // design-space dims (canvas.width is DISPLAY px once the fit-zoom is set)
  const z = canvas.getZoom() || 1;
  const dw = canvas.width! / z, dh = canvas.height! / z;
  const scale = Math.min((dw * 0.55) / img.width!, (dh * 0.55) / img.height!, 1);
  img.set({
    scaleX: scale, scaleY: scale,
    left: dw / 2 + (index % 3) * 36 - 36,
    top: dh / 2 + (index % 3) * 36 - 36,
    originX: 'center', originY: 'center',
    cornerColor: '#c19a3d', cornerStrokeColor: '#fff', borderColor: '#c19a3d',
    cornerSize: 11, transparentCorners: false,
  });
  (img as any).dru = defaultMeta();
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

/* ── undo / redo (JSON snapshots) ── */
export class HistoryManager {
  private stack: string[] = [];
  private index = -1;
  suspended = false;

  capture(canvas: Canvas) {
    if (this.suspended) return;
    const json = JSON.stringify(canvas.toObject());
    if (json === this.stack[this.index]) return;
    this.stack = this.stack.slice(0, this.index + 1).slice(-39);
    this.stack.push(json);
    this.index = this.stack.length - 1;
  }
  get canUndo() { return this.index > 0; }
  get canRedo() { return this.index < this.stack.length - 1; }
  private async load(canvas: Canvas, json: string) {
    this.suspended = true;
    await canvas.loadFromJSON(JSON.parse(json));
    canvas.getObjects().forEach((o) => {
      if ((o as any).dru?.kind === 'border') o.set({ selectable: false, evented: false });
    });
    canvas.requestRenderAll();
    this.suspended = false;
  }
  async undo(canvas: Canvas) { if (this.canUndo) await this.load(canvas, this.stack[--this.index]); }
  async redo(canvas: Canvas) { if (this.canRedo) await this.load(canvas, this.stack[++this.index]); }
}

/* ── layer ops (keep a photo's border frame travelling with it) ── */
export function layerOp(canvas: Canvas, img: FabricImage, op: 'forward' | 'backward' | 'front' | 'back') {
  if (op === 'forward') canvas.bringObjectForward(img);
  if (op === 'backward') canvas.sendObjectBackwards(img);
  if (op === 'front') canvas.bringObjectToFront(img);
  if (op === 'back') canvas.sendObjectToBack(img);
  placeBorder(canvas, img);
}

export async function duplicatePhoto(canvas: Canvas, img: FabricImage): Promise<FabricImage> {
  const clone = (await img.clone()) as FabricImage;
  const meta = { ...metaOf(img)!, id: eid() };
  meta.border = { ...meta.border };
  meta.effects = { ...meta.effects };
  (clone as any).dru = meta;
  clone.set({ left: (img.left ?? 0) + 36, top: (img.top ?? 0) + 36 });
  canvas.add(clone);
  syncBorder(canvas, clone);
  canvas.setActiveObject(clone);
  canvas.requestRenderAll();
  return clone;
}

export function setLocked(img: FabricImage, locked: boolean) {
  img.set({
    lockMovementX: locked, lockMovementY: locked,
    lockScalingX: locked, lockScalingY: locked, lockRotation: locked,
    hasControls: !locked,
  });
}

/* ── high-resolution export (print-friendly ~300 DPI on a 10″ edge) ── */
export function exportPng(canvas: Canvas, targetLongEdge = 3000): string {
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const multiplier = targetLongEdge / Math.max(canvas.width!, canvas.height!);
  return canvas.toDataURL({ format: 'png', multiplier: Math.max(1, multiplier) });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
