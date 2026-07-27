/* ── colour + its shades ──
   A fixed row of swatches only ever offers those exact colours, so anyone
   wanting a softer pink or a deeper navy had to reach for the OS colour
   picker and guess. This keeps the base colours and adds a live ramp under
   them: pick a colour, get five tints and shades of it to choose from.

   Used by the brush, by text fill and by text outline, so the same idea
   behaves the same way wherever a colour is chosen. */

const hex2rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgb2hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

/* mix towards white for a tint, towards black for a shade. t runs -1…1. */
export const shadeOf = (hex: string, t: number) => {
  const { r, g, b } = hex2rgb(hex);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  return rgb2hex(r + (to - r) * k, g + (to - g) * k, b + (to - b) * k);
};

const STEPS = [0.55, 0.28, 0, -0.25, -0.5];

interface Props {
  value: string;
  onChange: (c: string) => void;
  base: readonly string[];
  label?: string;
  /* white first — it is the outline colour people reach for most */
  compact?: boolean;
}

export default function ColorShades({ value, onChange, base, label, compact = false }: Props) {
  const dot = compact ? 'h-6 w-6' : 'h-7 w-7';
  return (
    <div className="space-y-1.5">
      {label && <span className="block text-[9px] font-bold uppercase tracking-wide text-white/35">{label}</span>}
      <div className="flex flex-wrap items-center gap-1.5">
        {base.map((c) => (
          <button key={c} title={c} onClick={() => onChange(c)}
            className={`${dot} rounded-full border-2 transition ${value.toLowerCase() === c.toLowerCase() ? 'border-gold ring-2 ring-gold/40' : 'border-white/20'}`}
            style={{ backgroundColor: c }} />
        ))}
        <input type="color" value={value} title="Custom colour"
          onChange={(e) => onChange(e.target.value)}
          className={`${dot} cursor-pointer rounded-full border border-white/20 bg-transparent`} />
      </div>
      {/* shades of whatever is currently chosen */}
      <div className="flex items-center gap-1">
        <span className="mr-0.5 text-[8px] font-bold uppercase tracking-wide text-white/25">Shades</span>
        {STEPS.map((t) => {
          const c = shadeOf(value, t);
          return (
            <button key={t} title={c} onClick={() => onChange(c)}
              className="h-5 flex-1 rounded border border-white/15 transition hover:border-gold"
              style={{ backgroundColor: c }} />
          );
        })}
      </div>
    </div>
  );
}
