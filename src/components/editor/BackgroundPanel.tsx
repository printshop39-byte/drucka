import { BG_SWATCHES, BgState, GRADIENT_PRESETS } from '../../lib/editor/fabricHelpers';

/* ── canvas background: solid · transparent · gradient ── */

export default function BackgroundPanel({ bg, onChange }: { bg: BgState; onChange: (bg: BgState) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {BG_SWATCHES.map((c) => (
          <button key={c} title={c} onClick={() => onChange({ type: 'solid', color: c })}
            className={`h-7 w-7 rounded-full border-2 transition ${
              bg.type === 'solid' && bg.color === c ? 'border-gold ring-2 ring-gold/40' : 'border-white/20'}`}
            style={{ backgroundColor: c }} />
        ))}
        <input type="color" value={bg.type === 'solid' ? bg.color : '#ffffff'} title="Custom colour"
          onChange={(e) => onChange({ type: 'solid', color: e.target.value })}
          className="h-7 w-7 cursor-pointer rounded-full border border-white/20 bg-transparent" />
        {/* transparent toggle — checkerboard chip */}
        <button title="Transparent background (PNG keeps transparency)"
          onClick={() => onChange({ type: 'transparent' })}
          className={`checker h-7 w-7 rounded-full border-2 transition ${
            bg.type === 'transparent' ? 'border-gold ring-2 ring-gold/40' : 'border-white/20'}`} />
      </div>

      <div>
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-white/35">Gradients</p>
        <div className="grid grid-cols-4 gap-1.5">
          {GRADIENT_PRESETS.map((g) => (
            <button key={g.id} title={g.label} onClick={() => onChange({ type: 'gradient', presetId: g.id })}
              className={`h-9 rounded-lg border-2 transition ${
                bg.type === 'gradient' && bg.presetId === g.id ? 'border-gold ring-2 ring-gold/40' : 'border-white/15'}`}
              style={{ background: `linear-gradient(135deg, ${g.stops[0][0]}, ${g.stops[1][0]})` }} />
          ))}
        </div>
      </div>

      <button onClick={() => onChange({ type: 'solid', color: '#ffffff' })}
        className="w-full rounded-full bg-white/8 py-1.5 text-[10px] font-bold text-white/65 transition hover:bg-white/15">
        Reset to white
      </button>
      {bg.type === 'transparent' && (
        <p className="text-[9px] leading-relaxed text-white/35">PNG exports will have a transparent background. JPEG always gets a white backing.</p>
      )}
    </div>
  );
}
