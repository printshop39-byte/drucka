/* ── Fabric.js helpers for the Drucka Pro Collage Editor ──
   Modern fabric (v6/v7) ESM named imports — no `fabric.fabric` legacy
   namespace. All editor metadata lives on `obj.dru` (serialized via
   FabricObject.customProperties) so undo/redo and duplication keep it. */

import {
  ActiveSelection, Canvas, FabricImage, FabricObject, Gradient, Group, Path,
  Point, Polygon, Rect, Circle, Shadow, Textbox, Triangle, filters, util,
} from 'fabric';

/* serialize our metadata with every snapshot/clone */
FabricObject.customProperties = ['dru'];

export type ShapeId = 'none' | 'circle' | 'rounded' | 'square' | 'heart' | 'star' | 'triangle' | 'hexagon';
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'sketch';

export interface ImageMeta {
  kind: 'image';
  id: string;
  shape: ShapeId;
  radius: number;                       // corner radius % (rounded / none border)
  border: { width: number; color: string; style: BorderStyle };
  shadow: number;                       // 0–40 blur px (design space)
  effects: { blur: number; brightness: number; contrast: number; opacity: number; tint: string; tintStrength: number };
}
export interface BorderMeta { kind: 'border'; for: string }
export interface SimpleMeta { kind: 'text' | 'draw' | 'group'; id: string }
export type DruMeta = ImageMeta | BorderMeta | SimpleMeta;

export const eid = () => Math.random().toString(36).slice(2, 9);

export const defaultMeta = (): ImageMeta => ({
  kind: 'image', id: eid(), shape: 'none', radius: 0,
  border: { width: 0, color: '#c19a3d', style: 'solid' },
  shadow: 0,
  effects: { blur: 0, brightness: 100, contrast: 100, opacity: 100, tint: '#c19a3d', tintStrength: 0 },
});

/* decorative frame presets — real photo borders (PicMonkey "Frames") */
export const FRAME_PRESETS: { id: string; label: string; width: number; color: string; style: BorderStyle }[] = [
  { id: 'none', label: 'None', width: 0, color: '#c19a3d', style: 'solid' },
  { id: 'gold', label: 'Gold', width: 28, color: '#c19a3d', style: 'solid' },
  { id: 'black', label: 'Black', width: 22, color: '#211c17', style: 'solid' },
  { id: 'white', label: 'White', width: 30, color: '#ffffff', style: 'solid' },
  { id: 'wooden', label: 'Wooden', width: 30, color: '#8a5a2b', style: 'solid' },
  { id: 'sketch', label: 'Hand-drawn', width: 10, color: '#211c17', style: 'sketch' },
];

export const metaOf = (o: FabricObject | null | undefined): ImageMeta | null =>
  o && (o as any).dru?.kind === 'image' ? ((o as any).dru as ImageMeta) : null;

export const kindOf = (o: FabricObject | null | undefined): DruMeta['kind'] | null =>
  (o as any)?.dru?.kind ?? null;

export const isLocked = (o: FabricObject) => !!o.lockMovementX;

/* design-space dims (canvas.width is DISPLAY px once the fit-zoom is set) */
export const designDims = (canvas: Canvas) => {
  const z = canvas.getZoom() || 1;
  return { dw: canvas.width! / z, dh: canvas.height! / z, z };
};

/* ── canvas size presets (design pixels; export upscales) ── */
export const CANVAS_PRESETS = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'landscape', label: 'Landscape', w: 1350, h: 1080 },
  { id: 'a4', label: 'A4 Print', w: 1240, h: 1754 },
];

/* ── background ── */
export const BG_SWATCHES = ['#ffffff', '#faf7f2', '#211c17', '#000000', '#c19a3d', '#5b21b6', '#fbe3ea', '#dbeafe'];
export const GRADIENT_PRESETS = [
  { id: 'gold', label: 'Gold Dusk', stops: [['#f6e09a', 0], ['#8c5f17', 1]] as [string, number][] },
  { id: 'plum', label: 'Royal Plum', stops: [['#7c3aed', 0], ['#1b1430', 1]] as [string, number][] },
  { id: 'ocean', label: 'Ocean', stops: [['#93c5fd', 0], ['#1e3a8a', 1]] as [string, number][] },
  { id: 'blush', label: 'Blush', stops: [['#f9a8d4', 0], ['#6e1423', 1]] as [string, number][] },
];
export type BgState = { type: 'solid'; color: string } | { type: 'transparent' } | { type: 'gradient'; presetId: string };

export function applyBackground(canvas: Canvas, bg: BgState) {
  if (bg.type === 'transparent') {
    canvas.backgroundColor = '';
  } else if (bg.type === 'solid') {
    canvas.backgroundColor = bg.color;
  } else {
    const p = GRADIENT_PRESETS.find((g) => g.id === bg.presetId) ?? GRADIENT_PRESETS[0];
    const { dw, dh } = designDims(canvas);
    canvas.backgroundColor = new Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: dw, y2: dh },
      colorStops: p.stops.map(([color, offset]) => ({ color, offset })),
    }) as any;
  }
  canvas.requestRenderAll();
}

/* ── blend modes (canvas composite ops — render AND export correctly) ── */
export const BLEND_MODES = [
  { id: 'source-over', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'darken', label: 'Darken' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'soft-light', label: 'Soft Light' },
];

/* ── text ── */
export const TEXT_FONTS = [
  { id: 'Inter', stack: 'Inter, system-ui, sans-serif' },
  { id: 'Playfair Display', stack: '"Playfair Display", Georgia, serif' },
  { id: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { id: 'Georgia', stack: 'Georgia, serif' },
  { id: 'Times New Roman', stack: '"Times New Roman", Times, serif' },
  { id: 'Impact', stack: 'Impact, "Arial Black", sans-serif' },
  { id: 'Courier New', stack: '"Courier New", monospace' },
];

export function addText(canvas: Canvas): Textbox {
  const { dw, dh } = designDims(canvas);
  const t = new Textbox('Double-click to edit', {
    left: dw / 2, top: dh / 2, originX: 'center', originY: 'center',
    width: dw * 0.55,
    fontSize: Math.round(dw * 0.065),
    fontFamily: TEXT_FONTS[0].stack,
    fontWeight: 700,
    fill: '#211c17',
    textAlign: 'center',
    cornerColor: '#c19a3d', cornerStrokeColor: '#fff', borderColor: '#c19a3d',
    cornerSize: 11, transparentCorners: false,
  });
  (t as any).dru = { kind: 'text', id: eid() } satisfies SimpleMeta;
  canvas.add(t);
  canvas.setActiveObject(t);
  canvas.requestRenderAll();
  return t;
}

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

/* perimeter sample points for the hand-drawn ("sketch") border */
function outlinePoints(shape: ShapeId, w: number, h: number): { x: number; y: number }[] | null {
  const m = Math.min(w, h);
  const subdiv = (verts: { x: number; y: number }[], per: number) => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i], b = verts[(i + 1) % verts.length];
      for (let k = 0; k < per; k++) pts.push({ x: a.x + ((b.x - a.x) * k) / per, y: a.y + ((b.y - a.y) * k) / per });
    }
    return pts;
  };
  switch (shape) {
    case 'circle': return polyPoints(44, m / 2);
    case 'square': return subdiv([{ x: -m / 2, y: -m / 2 }, { x: m / 2, y: -m / 2 }, { x: m / 2, y: m / 2 }, { x: -m / 2, y: m / 2 }], 11);
    case 'none':
    case 'rounded': return subdiv([{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }], 11);
    case 'triangle': return subdiv([{ x: 0, y: -m / 2 }, { x: m / 2, y: m / 2 }, { x: -m / 2, y: m / 2 }], 14);
    case 'hexagon': return subdiv(polyPoints(6, m / 2), 7);
    case 'star': return subdiv(starPoints(m / 2, m / 5), 4);
    case 'heart': return null; // falls back to a clean solid outline
  }
}

/* deterministic jitter so undo/redo doesn't reshuffle the sketch line */
function sketchShape(shape: ShapeId, w: number, h: number, seedStr: string): Polygon | null {
  const pts = outlinePoints(shape, w, h);
  if (!pts) return null;
  let seed = [...seedStr].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7) || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const amp = Math.max(2, Math.min(w, h) * 0.014);
  const jittered = pts.map((p) => ({ x: p.x + (rnd() - 0.5) * 2 * amp, y: p.y + (rnd() - 0.5) * 2 * amp }));
  return new Polygon(jittered, { originX: 'center', originY: 'center', left: 0, top: 0 });
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
  if (effects.tintStrength > 0) list.push(new filters.BlendColor({ color: effects.tint, mode: 'tint', alpha: effects.tintStrength / 100 }));
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
  const { width, color, style } = meta.border;
  const geometry =
    (style === 'sketch' ? sketchShape(meta.shape, img.width!, img.height!, meta.id) : null)
    ?? makeShape(meta.shape, img.width!, img.height!, meta.radius)
    ?? new Rect({ originX: 'center', originY: 'center', left: 0, top: 0, width: img.width!, height: img.height! });
  if (border) canvas.remove(border);
  border = geometry;
  border.set({
    fill: 'transparent',
    stroke: color,
    strokeWidth: width,
    strokeUniform: true,
    strokeLineCap: style === 'dotted' ? 'round' : 'butt',
    strokeLineJoin: 'round',
    strokeDashArray:
      style === 'dashed' ? [width * 2.6, width * 1.8]
      : style === 'dotted' ? [0.1, width * 2.1]
      : undefined,
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
  const { dw, dh } = designDims(canvas);
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

/* ── replace a photo's source, keeping its on-canvas box, shape, border & effects ── */
export async function replaceImageSrc(canvas: Canvas, img: FabricImage, dataUrl: string): Promise<void> {
  const meta = metaOf(img);
  const sw = img.getScaledWidth(), sh = img.getScaledHeight();
  await img.setSrc(dataUrl);
  // preserve the same on-canvas footprint regardless of the new image's pixels
  img.set({ scaleX: sw / img.width!, scaleY: sh / img.height! });
  if (meta) {
    applyShape(canvas, img, meta.shape); // clip geometry depends on new dims
    applyEffects(canvas, img);
    syncBorder(canvas, img);
  }
  img.setCoords();
  img.set('dirty', true);
  canvas.requestRenderAll();
}

/* ── undo / redo (JSON snapshots, includes background + drawings + text) ── */
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
export function layerOp(canvas: Canvas, obj: FabricObject, op: 'forward' | 'backward' | 'front' | 'back') {
  if (op === 'forward') canvas.bringObjectForward(obj);
  if (op === 'backward') canvas.sendObjectBackwards(obj);
  if (op === 'front') canvas.bringObjectToFront(obj);
  if (op === 'back') canvas.sendObjectToBack(obj);
  if (metaOf(obj)) placeBorder(canvas, obj as FabricImage);
}

export async function duplicateObject(canvas: Canvas, obj: FabricObject): Promise<FabricObject> {
  const clone = await obj.clone();
  const meta = metaOf(obj);
  if (meta) {
    const m = { ...meta, id: eid(), border: { ...meta.border }, effects: { ...meta.effects } };
    (clone as any).dru = m;
  } else if ((obj as any).dru) {
    (clone as any).dru = { ...(obj as any).dru, id: eid() };
  }
  clone.set({ left: (obj.left ?? 0) + 36, top: (obj.top ?? 0) + 36 });
  canvas.add(clone);
  if (metaOf(clone)) syncBorder(canvas, clone as FabricImage);
  canvas.setActiveObject(clone);
  canvas.requestRenderAll();
  return clone;
}

export function setLocked(obj: FabricObject, locked: boolean) {
  obj.set({
    lockMovementX: locked, lockMovementY: locked,
    lockScalingX: locked, lockScalingY: locked, lockRotation: locked,
    hasControls: !locked,
  });
}

/* ── merge / flatten the current multi-selection into one image ── */
export async function mergeSelection(canvas: Canvas): Promise<FabricImage | null> {
  const sel = canvas.getActiveObject();
  if (!sel || !(sel instanceof ActiveSelection) || sel.getObjects().length < 2) return null;
  const objs = [...sel.getObjects()];
  const rect = sel.getBoundingRect();
  const mult = 2; // render at 2× so the merged bitmap stays print-friendly
  const dataUrl = sel.toDataURL({ format: 'png', multiplier: mult });
  canvas.discardActiveObject();
  objs.forEach((o) => {
    if (metaOf(o)) removeBorderOf(canvas, o as FabricImage);
    canvas.remove(o);
  });
  const img = await FabricImage.fromURL(dataUrl);
  img.set({
    left: rect.left + rect.width / 2, top: rect.top + rect.height / 2,
    originX: 'center', originY: 'center',
    scaleX: 1 / mult, scaleY: 1 / mult,
    cornerColor: '#c19a3d', cornerStrokeColor: '#fff', borderColor: '#c19a3d',
    cornerSize: 11, transparentCorners: false,
  });
  (img as any).dru = defaultMeta();
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

/* ── group / ungroup ── */
export function groupSelection(canvas: Canvas): Group | null {
  const sel = canvas.getActiveObject();
  if (!sel || !(sel instanceof ActiveSelection) || sel.getObjects().length < 2) return null;
  // borders are standalone canvas objects — drop them before grouping
  const objs = [...sel.getObjects()];
  objs.forEach((o) => {
    const m = metaOf(o);
    if (m) { m.border.width = 0; removeBorderOf(canvas, o as FabricImage); }
  });
  canvas.discardActiveObject();
  objs.forEach((o) => canvas.remove(o));
  const group = new Group(objs); // adopts the objects' scene transforms
  (group as any).dru = { kind: 'group', id: eid() } satisfies SimpleMeta;
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
  return group;
}

export function ungroupSelection(canvas: Canvas): FabricObject[] | null {
  const g = canvas.getActiveObject();
  if (!g || !(g instanceof Group) || g instanceof ActiveSelection) return null;
  const objs = g.removeAll();
  canvas.remove(g);
  objs.forEach((o) => canvas.add(o));
  const sel = new ActiveSelection(objs, { canvas });
  canvas.setActiveObject(sel);
  canvas.requestRenderAll();
  return objs as FabricObject[];
}

/* ── alignment (design-space) ── */
export type AlignOp = 'left' | 'centerH' | 'right' | 'top' | 'middle' | 'bottom';
export function alignObject(canvas: Canvas, obj: FabricObject, op: AlignOp) {
  const { dw, dh } = designDims(canvas);
  const br = obj.getBoundingRect();
  let dx = 0, dy = 0;
  if (op === 'left') dx = -br.left;
  if (op === 'centerH') dx = dw / 2 - (br.left + br.width / 2);
  if (op === 'right') dx = dw - (br.left + br.width);
  if (op === 'top') dy = -br.top;
  if (op === 'middle') dy = dh / 2 - (br.top + br.height / 2);
  if (op === 'bottom') dy = dh - (br.top + br.height);
  obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
  obj.setCoords();
  if (metaOf(obj)) placeBorder(canvas, obj as FabricImage);
  canvas.requestRenderAll();
}

/* ── export (background, text, drawings, blends all render through
   fabric's own pipeline; JPEG gets a white backing when transparent) ── */
export function exportImage(canvas: Canvas, format: 'png' | 'jpeg', longEdge: number): string {
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const mult = Math.max(1, longEdge / Math.max(canvas.width!, canvas.height!));
  if (format === 'jpeg') {
    const prev = canvas.backgroundColor;
    if (!prev) canvas.backgroundColor = '#ffffff';
    const url = canvas.toDataURL({ format: 'jpeg', quality: 0.92, multiplier: mult });
    canvas.backgroundColor = prev;
    canvas.requestRenderAll();
    return url;
  }
  return canvas.toDataURL({ format: 'png', multiplier: mult });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
