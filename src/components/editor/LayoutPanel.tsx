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
}

export default function LayoutPanel({ hasSelection, onAlign, onCenterBoth, grid, onGrid, snap, onSnap }: Props) {
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
