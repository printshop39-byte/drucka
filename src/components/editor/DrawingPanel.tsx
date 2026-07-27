import { Eraser } from 'lucide-react';
import ColorShades from './ColorShades';
import { BRUSH_TEMPLATES, brushById } from '../../lib/editor/brushes';

/* ── pen/brush controls (shown while drawing mode is active) ── */

const BRUSH_COLORS = ['#211c17', '#ffffff', '#c19a3d', '#6e1423', '#1e3a8a', '#15803d', '#f97316'];

interface Props {
  brush: string; onBrush: (id: string) => void;
  color: string; onColor: (c: string) => void;
  size: number; onSize: (n: number) => void;
  onClear: () => void;
  hasDrawings: boolean;
}

export default function DrawingPanel({ brush, onBrush, color, onColor, size, onSize, onClear, hasDrawings }: Props) {
  const active = brushById(brush);
  return (
    <div className="space-y-3">
      {/* brush templates — the same set the Grid Editor and the product
          designer offer, so a customer learns them once */}
      <div className="space-y-1.5">
        <span className="block text-[9px] font-bold uppercase tracking-wide text-white/35">Brush</span>
        <div className="grid grid-cols-4 gap-1.5">
          {BRUSH_TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => onBrush(t.id)} title={t.hint}
              className={`rounded-lg border-2 px-1 py-1.5 text-[9px] font-bold leading-tight transition ${
                brush === t.id ? 'border-gold bg-gold/15 text-white' : 'border-white/12 text-white/60 hover:border-gold/50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-white/35">{active.hint}</p>
      </div>

      <ColorShades value={color} onChange={onColor} base={BRUSH_COLORS} />

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
