import { Eraser } from 'lucide-react';

/* ── pen/brush controls (shown while drawing mode is active) ── */

const BRUSH_COLORS = ['#211c17', '#ffffff', '#c19a3d', '#6e1423', '#1e3a8a', '#15803d', '#f97316'];

interface Props {
  color: string; onColor: (c: string) => void;
  size: number; onSize: (n: number) => void;
  onClear: () => void;
  hasDrawings: boolean;
}

export default function DrawingPanel({ color, onColor, size, onSize, onClear, hasDrawings }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {BRUSH_COLORS.map((c) => (
          <button key={c} title={c} onClick={() => onColor(c)}
            className={`h-7 w-7 rounded-full border-2 transition ${color === c ? 'border-gold ring-2 ring-gold/40' : 'border-white/20'}`}
            style={{ backgroundColor: c }} />
        ))}
        <input type="color" value={color} title="Custom brush colour"
          onChange={(e) => onColor(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border border-white/20 bg-transparent" />
      </div>

      <label className="block">
        <span className="mb-0.5 flex justify-between text-[9px] font-bold uppercase tracking-wide text-white/35">
          Brush size <span className="text-white/70">{size}px</span>
        </span>
        <input type="range" min={2} max={60} value={size} onChange={(e) => onSize(+e.target.value)} className="w-full accent-gold" />
      </label>

      <button onClick={onClear} disabled={!hasDrawings}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-red-500/15 py-1.5 text-[10px] font-bold text-red-300 transition hover:bg-red-500/25 disabled:opacity-30">
        <Eraser size={12} /> Clear all drawings
      </button>
      <p className="text-[9px] leading-relaxed text-white/35">
        Finish drawing (pen button) to select strokes — then move, blend or delete them like any layer.
      </p>
    </div>
  );
}
