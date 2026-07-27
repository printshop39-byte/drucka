import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Grid3x3, Magnet, Crosshair,
} from 'lucide-react';
import { AlignOp } from '../../lib/editor/fabricHelpers';

/* ── alignment, snapping, grid ── */

interface Props {
  hasSelection: boolean;
  onAlign: (op: AlignOp) => void;
  onCenterBoth: () => void;
  grid: boolean; onGrid: (v: boolean) => void;
  snap: boolean; onSnap: (v: boolean) => void;
  /* absolute angle, so the buttons read as "this much tilt" rather than
     nudging further every press */
  angle: number;
  onAngle: (deg: number) => void;
}

const TILTS = [-8, -4, 0, 4, 8];

export default function LayoutPanel({ hasSelection, onAlign, onCenterBoth, grid, onGrid, snap, onSnap, angle, onAngle }: Props) {
  const A = ([op, Ic, label]: readonly [AlignOp, React.ComponentType<{ size?: number }>, string]) => (
    <button key={op} title={label} disabled={!hasSelection} onClick={() => onAlign(op)}
      className="grid h-9 place-items-center rounded-lg border border-white/12 text-white/65 transition hover:border-gold hover:text-gold disabled:opacity-25">
      <Ic size={14} />
    </button>
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-1">
        {([
          ['left', AlignStartVertical, 'Align left'],
          ['centerH', AlignCenterVertical, 'Align center'],
          ['right', AlignEndVertical, 'Align right'],
          ['top', AlignStartHorizontal, 'Align top'],
          ['middle', AlignCenterHorizontal, 'Align middle'],
          ['bottom', AlignEndHorizontal, 'Align bottom'],
        ] as const).map(A)}
      </div>
      <button disabled={!hasSelection} onClick={onCenterBoth}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/8 py-1.5 text-[10px] font-bold text-white/70 transition hover:bg-white/15 disabled:opacity-25">
        <Crosshair size={12} /> Snap to canvas center
      </button>
      {/* Tilt. Dragging the rotate handle to a believable 4° is fiddly, and a
          slight tilt is what stops a collage looking machine-laid. Absolute
          angles, so pressing 4° twice does not end up at 8°. */}
      <div>
        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-white/35">Tilt</span>
        <div className="grid grid-cols-5 gap-1">
          {TILTS.map((d) => {
            const on = Math.abs(((angle + 180) % 360) - 180 - d) < 0.5;
            return (
              <button key={d} disabled={!hasSelection} onClick={() => onAngle(d)}
                title={d === 0 ? 'Straighten' : `${d > 0 ? '+' : ''}${d}°`}
                className={`h-8 rounded-lg border text-[10px] font-bold transition disabled:opacity-25 ${
                  on ? 'border-gold bg-gold/15 text-gold' : 'border-white/12 text-white/60 hover:border-gold/60'}`}>
                {d === 0 ? '0°' : `${d > 0 ? '+' : ''}${d}°`}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => onGrid(!grid)}
          className={`flex items-center justify-center gap-1.5 rounded-full border-2 py-1.5 text-[10px] font-bold transition ${
            grid ? 'border-gold bg-gold/15 text-gold' : 'border-white/12 text-white/55'}`}>
          <Grid3x3 size={12} /> Grid
        </button>
        <button onClick={() => onSnap(!snap)}
          className={`flex items-center justify-center gap-1.5 rounded-full border-2 py-1.5 text-[10px] font-bold transition ${
            snap ? 'border-gold bg-gold/15 text-gold' : 'border-white/12 text-white/55'}`}>
          <Magnet size={12} /> Snap
        </button>
      </div>
      <p className="text-[9px] leading-relaxed text-white/35">Snap pulls layers to the canvas center and edges while dragging; gold guides show when it catches.</p>
    </div>
  );
}
