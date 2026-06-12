import { Layers, Combine, Group as GroupIcon, Ungroup } from 'lucide-react';
import { BLEND_MODES } from '../../lib/editor/fabricHelpers';

/* ── blend mode + merge/flatten + group controls ── */

interface Props {
  blend: string;                       // current globalCompositeOperation
  onBlend: (mode: string) => void;
  isMulti: boolean;                    // 2+ objects selected
  isGroup: boolean;
  onMerge: () => void;
  onGroup: () => void;
  onUngroup: () => void;
}

export default function BlendPanel({ blend, onBlend, isMulti, isGroup, onMerge, onGroup, onUngroup }: Props) {
  return (
    <div className="space-y-3">
      {!isMulti && (
        <label className="block">
          <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-white/35">Blend mode · how it mixes with layers below</span>
          <select value={blend} onChange={(e) => onBlend(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-[#221c33] px-2 py-2 text-xs font-bold text-white outline-none focus:border-gold">
            {BLEND_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      )}

      {isMulti && (
        <>
          <button onClick={onMerge}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-2 text-[11px] font-bold text-white transition hover:brightness-110">
            <Combine size={13} /> Merge selected into one image
          </button>
          <button onClick={onGroup}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-2 text-[11px] font-bold text-white/80 transition hover:bg-white/15">
            <GroupIcon size={13} /> Group selection
          </button>
          <p className="text-[9px] leading-relaxed text-white/35">
            <Layers size={9} className="mr-1 inline" />
            Merge bakes the selected layers (with their blend modes) into a single photo you can shape-crop. Photo borders are not merged — re-add after.
          </p>
        </>
      )}

      {isGroup && (
        <button onClick={onUngroup}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 py-2 text-[11px] font-bold text-white/80 transition hover:bg-white/15">
          <Ungroup size={13} /> Ungroup
        </button>
      )}
    </div>
  );
}
