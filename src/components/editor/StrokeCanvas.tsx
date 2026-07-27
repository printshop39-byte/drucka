import { useCallback, useEffect, useRef, useState } from 'react';
import { Stroke, drawStrokes } from '../../lib/editor/brushes';

/* ── The drawing surface used outside the Pro Editor ──

   The Pro Editor draws through Fabric. The Grid Editor and the product
   designer are plain DOM — cells, captions and layers positioned in
   percentages — so they get this instead: a transparent canvas that overlays
   whatever it is dropped into, captures strokes in % of its own box, and hands
   them back to the parent to keep in state.

   Storing % rather than pixels is what lets the same stroke be redrawn on a
   600px preview and on a 3600px print without going soft or drifting. */

interface Props {
  strokes: Stroke[];
  /* off → the canvas ignores the pointer entirely, so photos underneath stay
     draggable and the overlay is purely a picture of the strokes */
  active: boolean;
  brush: string;
  color: string;
  /* stroke width as a % of the surface's shorter side */
  size: number;
  onStroke: (s: Stroke) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function StrokeCanvas({ strokes, active, brush, color, size, onStroke, className, style }: Props) {
  const elRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<Stroke | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  /* match the canvas to its box in device pixels — a canvas stretched by CSS
     draws blurry strokes, which on a print preview reads as a broken brush */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const repaint = useCallback(() => {
    const el = elRef.current;
    if (!el || !box.w || !box.h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (el.width !== Math.round(box.w * dpr) || el.height !== Math.round(box.h * dpr)) {
      el.width = Math.round(box.w * dpr);
      el.height = Math.round(box.h * dpr);
    }
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingQuality = 'high';
    drawStrokes(ctx, liveRef.current ? [...strokes, liveRef.current] : strokes, box.w, box.h);
  }, [strokes, box]);

  useEffect(() => { repaint(); }, [repaint]);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active) return;
    const el = elRef.current!;
    /* keep the stroke on this canvas even when the finger leaves the sheet,
       and stop the sheet underneath from treating it as a drag */
    e.stopPropagation();
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const pointerId = e.pointerId;
    try { el.setPointerCapture(pointerId); } catch { /* best effort */ }

    const at = (ev: PointerEvent | React.PointerEvent): [number, number] => [
      ((ev.clientX - rect.left) / rect.width) * 100,
      ((ev.clientY - rect.top) / rect.height) * 100,
    ];
    liveRef.current = { brush, color, size, points: [at(e)] };
    repaint();

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId || !liveRef.current) return;
      const [x, y] = at(ev);
      const pts = liveRef.current.points;
      const last = pts[pts.length - 1];
      /* drop points closer than a whisker apart — fewer, cleaner points make a
         smoother curve and a much smaller stroke to keep in state */
      if (Math.hypot(x - last[0], y - last[1]) < 0.25) return;
      pts.push([x, y]);
      repaint();
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      const done = liveRef.current;
      liveRef.current = null;
      if (done && done.points.length) onStroke(done);
      else repaint();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return (
    <canvas ref={elRef} onPointerDown={start}
      className={`absolute inset-0 h-full w-full ${active ? 'touch-none cursor-crosshair' : 'pointer-events-none'} ${className ?? ''}`}
      style={style} />
  );
}
