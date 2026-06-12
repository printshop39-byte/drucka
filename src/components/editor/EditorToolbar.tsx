import { useRef } from 'react';
import {
  ArrowLeft, Upload, Undo2, Redo2, Download, ChevronUp, ChevronDown,
  ChevronsUp, ChevronsDown, Copy, Trash2, Lock, Unlock, LayoutGrid, Crop,
} from 'lucide-react';
import { CANVAS_PRESETS } from '../../lib/editor/fabricHelpers';

/* ── top toolbar of the Pro Collage Editor ── */

interface Props {
  onClose: () => void;
  onBackToGrid: () => void;
  onUpload: (files: FileList | null) => void;
  canUndo: boolean; canRedo: boolean;
  onUndo: () => void; onRedo: () => void;
  presetId: string; onPreset: (id: string) => void;
  hasSelection: boolean; locked: boolean;
  cropMode: boolean; cropPossible: boolean; onToggleCrop: () => void;
  onLayer: (op: 'forward' | 'backward' | 'front' | 'back') => void;
  onDuplicate: () => void; onDelete: () => void; onLock: () => void;
  exporting: boolean; onExport: () => void;
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
  return (
    <header className="z-30 flex shrink-0 flex-wrap items-center gap-1 border-b border-white/10 bg-[#1a1429] px-2 py-1.5 sm:px-3">
      <Btn title="Close editor" onClick={p.onClose}><ArrowLeft size={17} /></Btn>
      <div className="mr-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">Pro Collage Editor</p>
        <p className="hidden text-[9px] text-white/40 sm:block">Drucka Studio · Fabric canvas</p>
      </div>

      <button onClick={p.onBackToGrid} title="Switch to grid collage maker"
        className="hidden items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-gold hover:text-white sm:flex">
        <LayoutGrid size={13} /> Grid Maker
      </button>

      <span className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

      <input ref={fileRef} type="file" hidden multiple accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { p.onUpload(e.target.files); e.target.value = ''; }} />
      <button onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110">
        <Upload size={13} /> Add photos
      </button>

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

      <button onClick={p.onExport} disabled={p.exporting}
        className="ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-gold-dark px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-50">
        <Download size={13} /> {p.exporting ? 'Exporting…' : 'Export PNG'}
      </button>
    </header>
  );
}
