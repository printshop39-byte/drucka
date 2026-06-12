import { BorderStyle, ImageMeta } from '../../lib/editor/fabricHelpers';

/* ── effects + styling controls for the selected photo ── */

interface Props {
  meta: ImageMeta;
  onEffect: (patch: Partial<ImageMeta['effects']>) => void;
  onStyle: (patch: { radius?: number; shadow?: number; borderWidth?: number; borderColor?: string; borderStyle?: BorderStyle }) => void;
}

const BORDER_STYLES: { id: BorderStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'sketch', label: 'Freehand' },
];

const Slider = ({ label, value, min, max, onChange, fmt = (v: number) => `${v}` }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; fmt?: (v: number) => string;
}) => (
  <label className="block">
    <span className="mb-0.5 flex justify-between text-[9.5px] font-bold uppercase tracking-wide text-white/45">
      {label} <span className="text-white/70">{fmt(value)}</span>
    </span>
    <input type="range" min={min} max={max} value={value}
      onChange={(e) => onChange(+e.target.value)} className="w-full accent-gold" />
  </label>
);

export default function ImageEffectsPanel({ meta, onEffect, onStyle }: Props) {
  const e = meta.effects;
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-white/45">Image effects</p>
        <div className="space-y-2.5">
          <Slider label="Blur" value={e.blur} min={0} max={100} onChange={(v) => onEffect({ blur: v })} />
          <Slider label="Brightness" value={e.brightness} min={40} max={160} fmt={(v) => `${v}%`} onChange={(v) => onEffect({ brightness: v })} />
          <Slider label="Contrast" value={e.contrast} min={40} max={160} fmt={(v) => `${v}%`} onChange={(v) => onEffect({ contrast: v })} />
          <Slider label="Opacity" value={e.opacity} min={10} max={100} fmt={(v) => `${v}%`} onChange={(v) => onEffect({ opacity: v })} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-white/45">Style</p>
        <div className="space-y-2.5">
          <Slider label="Border width" value={meta.border.width} min={0} max={60}
            onChange={(v) => onStyle({ borderWidth: v })} />
          <div className="flex flex-wrap gap-1">
            {BORDER_STYLES.map((s) => (
              <button key={s.id} onClick={() => onStyle({ borderStyle: s.id })}
                className={`rounded-full border-2 px-2.5 py-1 text-[9.5px] font-bold transition ${
                  meta.border.style === s.id ? 'border-gold bg-gold text-white' : 'border-white/15 text-white/55'}`}>
                {s.label}
              </button>
            ))}
          </div>
          {meta.border.style === 'sketch' && meta.shape === 'heart' && (
            <p className="text-[9px] text-white/35">Freehand isn't available for hearts — shown solid.</p>
          )}
          <label className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold uppercase tracking-wide text-white/45">Border color</span>
            <span className="flex items-center gap-1.5">
              {['#c19a3d', '#ffffff', '#211c17', '#6e1423', '#22304f'].map((c) => (
                <button key={c} aria-label={`Border ${c}`} onClick={() => onStyle({ borderColor: c })}
                  className={`h-6 w-6 rounded-full border-2 ${meta.border.color === c ? 'border-gold ring-2 ring-gold/40' : 'border-white/25'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={meta.border.color} aria-label="Custom border colour"
                onChange={(ev) => onStyle({ borderColor: ev.target.value })}
                className="h-6 w-6 cursor-pointer rounded-full border border-white/25 bg-transparent" />
            </span>
          </label>
          <Slider label="Shadow" value={meta.shadow} min={0} max={40} onChange={(v) => onStyle({ shadow: v })} />
          <Slider label="Corner radius" value={meta.radius} min={0} max={100} fmt={(v) => `${v}%`}
            onChange={(v) => onStyle({ radius: v })} />
          {meta.shape !== 'none' && meta.shape !== 'rounded' && meta.radius > 0 && (
            <p className="text-[9px] text-white/35">Corner radius applies to Original / Rounded shapes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
