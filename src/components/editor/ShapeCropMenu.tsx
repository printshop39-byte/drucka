import { SHAPES, ShapeId } from '../../lib/editor/fabricHelpers';

/* ── shape-crop picker — tiny CSS previews of each mask shape ── */

const SHAPE_CSS: Record<ShapeId, React.CSSProperties> = {
  none: { borderRadius: 2 },
  circle: { borderRadius: '50%' },
  rounded: { borderRadius: 7 },
  square: { borderRadius: 2 },
  triangle: { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  hexagon: { clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' },
  star: { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  heart: { clipPath: 'polygon(50% 100%, 8% 56%, 2% 30%, 16% 8%, 38% 8%, 50% 24%, 62% 8%, 84% 8%, 98% 30%, 92% 56%)' },
};

export default function ShapeCropMenu({ value, onChange }: { value: ShapeId; onChange: (s: ShapeId) => void }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-white/45">Shape crop</p>
      <div className="grid grid-cols-4 gap-1.5">
        {SHAPES.map((s) => (
          <button key={s.id} title={s.label} onClick={() => onChange(s.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition ${
              value === s.id ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'}`}>
            <span className="block h-7 w-7" style={{ background: value === s.id ? '#c19a3d' : 'rgba(255,255,255,.55)', ...SHAPE_CSS[s.id] }} />
            <span className="text-[8.5px] font-bold text-white/55">{s.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[9px] leading-relaxed text-white/35">
        Tip: double-click a photo (or use the crop tool) to slide it inside its shape.
      </p>
    </div>
  );
}
