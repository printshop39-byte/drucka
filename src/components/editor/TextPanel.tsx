import { Textbox } from 'fabric';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { TEXT_FONTS } from '../../lib/editor/fabricHelpers';

/* ── typography controls for the selected Textbox ── */

interface Props {
  text: Textbox;
  onPatch: (props: Partial<Record<string, unknown>>) => void;
}

const TEXT_SWATCHES = ['#211c17', '#ffffff', '#c19a3d', '#6e1423', '#1e3a8a', '#5b21b6'];

export default function TextPanel({ text, onPatch }: Props) {
  const bold = `${text.fontWeight}` === '700' || text.fontWeight === 'bold';
  const italic = text.fontStyle === 'italic';
  return (
    <div className="space-y-3">
      <select value={(TEXT_FONTS.find((f) => `${text.fontFamily}`.includes(f.id))?.id) ?? 'Inter'}
        onChange={(e) => onPatch({ fontFamily: TEXT_FONTS.find((f) => f.id === e.target.value)!.stack })}
        className="w-full rounded-lg border border-white/15 bg-[#221c33] px-2 py-2 text-xs font-bold text-white outline-none focus:border-gold">
        {TEXT_FONTS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-white/35">Size</span>
          <input type="number" min={10} max={400} value={Math.round(text.fontSize ?? 60)}
            onChange={(e) => onPatch({ fontSize: Math.min(400, Math.max(10, +e.target.value || 10)) })}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-gold" />
        </label>
        <div>
          <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-white/35">Style</span>
          <div className="flex gap-1">
            <button title="Bold" onClick={() => onPatch({ fontWeight: bold ? 400 : 700 })}
              className={`h-8 w-8 rounded-lg border-2 text-xs font-black ${bold ? 'border-gold bg-gold text-white' : 'border-white/15 text-white/60'}`}>B</button>
            <button title="Italic" onClick={() => onPatch({ fontStyle: italic ? 'normal' : 'italic' })}
              className={`h-8 w-8 rounded-lg border-2 text-xs italic ${italic ? 'border-gold bg-gold text-white' : 'border-white/15 text-white/60'}`}>I</button>
            <button title="Underline" onClick={() => onPatch({ underline: !text.underline })}
              className={`h-8 w-8 rounded-lg border-2 text-xs font-bold underline ${text.underline ? 'border-gold bg-gold text-white' : 'border-white/15 text-white/60'}`}>U</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/35">Align</span>
        <div className="flex gap-1">
          {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Ic]) => (
            <button key={a} title={`Align ${a}`} onClick={() => onPatch({ textAlign: a })}
              className={`grid h-8 w-8 place-items-center rounded-lg border-2 ${text.textAlign === a ? 'border-gold bg-gold text-white' : 'border-white/15 text-white/60'}`}>
              <Ic size={13} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[9px] font-bold uppercase tracking-wide text-white/35">Color</span>
        {TEXT_SWATCHES.map((c) => (
          <button key={c} title={c} onClick={() => onPatch({ fill: c })}
            className={`h-6 w-6 rounded-full border-2 ${text.fill === c ? 'border-gold ring-2 ring-gold/40' : 'border-white/20'}`}
            style={{ backgroundColor: c }} />
        ))}
        <input type="color" value={typeof text.fill === 'string' ? text.fill : '#211c17'}
          onChange={(e) => onPatch({ fill: e.target.value })}
          className="h-6 w-6 cursor-pointer rounded-full border border-white/20 bg-transparent" />
      </div>

      <label className="block">
        <span className="mb-0.5 flex justify-between text-[9px] font-bold uppercase tracking-wide text-white/35">
          Letter spacing <span className="text-white/70">{Math.round((text.charSpacing ?? 0) / 10)}</span>
        </span>
        <input type="range" min={-50} max={800} value={text.charSpacing ?? 0}
          onChange={(e) => onPatch({ charSpacing: +e.target.value })} className="w-full accent-gold" />
      </label>
      <label className="block">
        <span className="mb-0.5 flex justify-between text-[9px] font-bold uppercase tracking-wide text-white/35">
          Line height <span className="text-white/70">{(text.lineHeight ?? 1.16).toFixed(2)}</span>
        </span>
        <input type="range" min={0.7} max={2.5} step={0.02} value={text.lineHeight ?? 1.16}
          onChange={(e) => onPatch({ lineHeight: +e.target.value })} className="w-full accent-gold" />
      </label>
      <p className="text-[9px] text-white/35">Double-click the text on canvas to edit the words.</p>
    </div>
  );
}
