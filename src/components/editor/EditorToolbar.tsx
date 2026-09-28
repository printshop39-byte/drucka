import { useState } from 'react';
import { ArrowLeft, Undo2, Redo2, Download, ChevronDown } from 'lucide-react';

/* ── slim header of Pro mode — Back · title · mode toggle · undo/redo · Export.
   All creation tools live in the left Collage Maker sidebar tabs. ── */

interface Props {
  onBack: () => void; // switches back to the Grid (normal) Collage Maker
  canUndo: boolean; canRedo: boolean;
  onUndo: () => void; onRedo: () => void;
  exporting: boolean;
  onExport: (format: 'png' | 'png-hd' | 'jpeg') => void;
}

export default function EditorToolbar(p: Props) {
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <header className="z-30 flex shrink-0 items-center gap-1.5 border-b border-white/10 bg-[#1a1429] px-2 py-1.5 sm:gap-2 sm:px-3">
      <button onClick={p.onBack} title="Back to grid Collage Maker" aria-label="Back to Collage Maker"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
        <ArrowLeft size={17} />
      </button>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="truncate text-sm font-bold leading-tight text-white">Collage Maker</p>
        <p className="hidden text-[9px] text-on-dark-muted sm:block">Drucka Studio</p>
      </div>

      {/* mode toggle — mirrors the one in the grid maker header. Hidden below
          sm: at phone widths the header (back + title + undo/redo + export)
          already fills the viewport, and "Grid Editor" here just duplicates
          what the back arrow does — keeping both clipped the Export button
          off-screen and made it untappable on every mobile width. */}
      <div className="mx-auto hidden shrink-0 rounded-full bg-white/8 p-0.5 text-[10px] font-bold sm:flex">
        <button onClick={p.onBack}
          className="flex min-h-[44px] items-center rounded-full px-3 text-white/55 transition hover:text-white">
          Grid Editor
        </button>
        <span className="flex min-h-[44px] items-center rounded-full bg-gold px-3 text-[#1a1208]">Pro Editor</span>
      </div>

      <button onClick={p.onUndo} disabled={!p.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 disabled:opacity-25">
        <Undo2 size={16} />
      </button>
      <button onClick={p.onRedo} disabled={!p.canRedo} title="Redo (Ctrl+Y)" aria-label="Redo"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white/75 transition hover:bg-white/10 disabled:opacity-25">
        <Redo2 size={16} />
      </button>

      {/* export menu */}
      <div className="relative shrink-0">
        <button onClick={() => setExportOpen(!exportOpen)} disabled={p.exporting} aria-label="Export"
          className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-gold-dark px-3.5 text-[11px] font-bold uppercase tracking-wide text-[#1a1208] shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-50">
          <Download size={13} />
          <span className="hidden sm:inline">{p.exporting ? 'Exporting…' : 'Export'}</span>
          <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
        </button>
        {exportOpen && (
          <>
            <button className="fixed inset-0 z-40 cursor-default" aria-label="Close export menu" onClick={() => setExportOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-white/12 bg-[#221c33] py-1 shadow-2xl">
              {([
                ['png', 'PNG · standard', '1500px · web & sharing'],
                ['png-hd', 'PNG · high resolution', '3000px · print quality'],
                ['jpeg', 'JPEG · white background', '3000px · smaller file'],
              ] as const).map(([id, label, hint]) => (
                <button key={id} onClick={() => { setExportOpen(false); p.onExport(id); }}
                  className="block min-h-[44px] w-full px-3.5 py-2 text-left transition hover:bg-white/8">
                  <span className="block text-[11px] font-bold text-white">{label}</span>
                  <span className="block text-[9px] text-on-dark-muted">{hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
