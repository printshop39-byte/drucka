import { useRef, useState } from 'react';
import {
  ArrowLeft, Upload, Undo2, Redo2, Download, ChevronUp, ChevronDown,
  ChevronsUp, ChevronsDown, Copy, Trash2, Lock, Unlock, Crop,
  Type, Pen,
} from 'lucide-react';
import { CANVAS_PRESETS } from '../../lib/editor/fabricHelpers';

/* ── top toolbar of the Pro Collage Editor ── */

interface Props {
  onBack: () => void; // ← Back to Collage Maker (mode switch, state preserved)
  onUpload: (files: FileList | null) => void;
  onAddText: () => void;
  penMode: boolean; onTogglePen: () => void;
  canUndo: boolean; canRedo: boolean;
  onUndo: () => void; onRedo: () => void;
  presetId: string; onPreset: (id: string) => void;
  hasSelection: boolean; locked: boolean;
  cropMode: boolean; cropPossible: boolean; onToggleCrop: () => void;
  onLayer: (op: 'forward' | 'backward' | 'front' | 'back') => void;
  onDuplicate: () => void; onDelete: () => void; onLock: () => void;
  exporting: boolean;
  onExport: (format: 'png' | 'png-hd' | 'jpeg') => void;
}

const Btn = ({ title, onClick, disabled, active, children }: {
  title: string; onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode;
}) => (
  <button title={title} aria-label={title} onClick={onClick} disabled={disabled}
    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
      active ? 'bg-gold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
    } disabled:opacity-25 disabled:pointer-events-none`}>
    {children}
  </button>
);

export default function EditorToolbar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <header className="z-30 flex shrink-0 flex-wrap items-center gap-1 border-b border-white/10 bg-[#1a1429] px-2 py-1.5 sm:px-3">
      <button onClick={p.onBack} title="Back to Collage Maker"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white/75 transition hover:border-gold hover:text-white">
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Back to Collage Maker</span>
        <span className="sm:hidden">Back</span>
      </button>
      <div className="mx-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">Pro Editor</p>
        <p className="hidden text-[9px] text-white/40 sm:block">Drucka Studio · advanced mode</p>
      </div>

      <span className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

      <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { p.onUpload(e.target.files); e.target.value = ''; }} />
      <button onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110">
        <Upload size={13} /> Photos
      </button>
      <Btn title="Add text" onClick={p.onAddText}><Type size={16} /></Btn>
      <Btn title={p.penMode ? 'Finish drawing' : 'Pen / brush tool'} onClick={p.onTogglePen} active={p.penMode}><Pen size={15} /></Btn>

      <select value={p.presetId} onChange={(e) => p.onPreset(e.target.value)}
        aria-label="Canvas size"
        className="rounded-lg border border-white/15 bg-[#221c33] px-2 py-1.5 text-[11px] font-bold text-white/80 outline-none focus:border-gold">
        {CANVAS_PRESETS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>

      <span className="mx-1 h-6 w-px bg-white/10" />
      <Btn title="Undo (Ctrl+Z)" onClick={p.onUndo} disabled={!p.canUndo}><Undo2 size={16} /></Btn>
      <Btn title="Redo (Ctrl+Y)" onClick={p.onRedo} disabled={!p.canRedo}><Redo2 size={16} /></Btn>

      {/* selection tools */}
      <span className="mx-1 h-6 w-px bg-white/10" />
      <Btn title={p.cropMode ? 'Done cropping' : 'Crop — reposition photo inside its shape (or double-click photo)'}
        onClick={p.onToggleCrop} disabled={!p.cropPossible} active={p.cropMode}><Crop size={16} /></Btn>
      <Btn title="Bring forward" onClick={() => p.onLayer('forward')} disabled={!p.hasSelection}><ChevronUp size={16} /></Btn>
      <Btn title="Send backward" onClick={() => p.onLayer('backward')} disabled={!p.hasSelection}><ChevronDown size={16} /></Btn>
      <Btn title="Bring to front" onClick={() => p.onLayer('front')} disabled={!p.hasSelection}><ChevronsUp size={16} /></Btn>
      <Btn title="Send to back" onClick={() => p.onLayer('back')} disabled={!p.hasSelection}><ChevronsDown size={16} /></Btn>
      <Btn title="Duplicate" onClick={p.onDuplicate} disabled={!p.hasSelection}><Copy size={16} /></Btn>
      <Btn title={p.locked ? 'Unlock' : 'Lock'} onClick={p.onLock} disabled={!p.hasSelection} active={p.locked}>
        {p.locked ? <Lock size={15} /> : <Unlock size={15} />}
      </Btn>
      <Btn title="Delete (Del)" onClick={p.onDelete} disabled={!p.hasSelection}><Trash2 size={15} /></Btn>

      {/* export menu */}
      <div className="relative ml-auto">
        <button onClick={() => setExportOpen(!exportOpen)} disabled={p.exporting}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-50">
          <Download size={13} /> {p.exporting ? 'Exporting…' : 'Export'}
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
                  className="block w-full px-3.5 py-2 text-left transition hover:bg-white/8">
                  <span className="block text-[11px] font-bold text-white">{label}</span>
                  <span className="block text-[9px] text-white/40">{hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
