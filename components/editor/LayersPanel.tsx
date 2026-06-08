"use client";

import type { EditorLayer } from "./types";

export default function LayersPanel({
  layers,
  selectedId,
  onSelect,
  onToggleVisible,
  onDelete,
  onDuplicate,
}: {
  layers: EditorLayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  if (layers.length === 0) {
    return (
      <p className="text-brand-muted text-[0.84rem] py-3">
        No layers yet on this area. Upload an image or add text to start.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {layers.map((l) => {
        const selected = l.id === selectedId;
        return (
          <div
            key={l.id}
            className={`flex items-center gap-2 rounded-[0.7rem] border p-2 transition cursor-pointer ${
              selected ? "border-brand-gold bg-brand-goldSoft/40 shadow-glow" : "border-brand-border bg-white hover:border-brand-gold/40"
            }`}
            onClick={() => onSelect(l.id)}
          >
            {/* thumb / icon */}
            <span className="w-9 h-9 shrink-0 rounded-[0.5rem] bg-brand-mint border border-brand-border flex items-center justify-center overflow-hidden">
              {l.type === "image" && l.src ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={l.src} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-[1rem]">{l.type === "image" ? "🖼️" : "🔤"}</span>
              )}
            </span>

            <span className={`flex-1 min-w-0 truncate text-[0.84rem] font-semibold ${l.visible ? "text-brand-ink" : "text-brand-muted line-through"}`}>
              {l.name}
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisible(l.id); }}
              aria-label={l.visible ? "Hide layer" : "Show layer"}
              className="w-7 h-7 rounded-[0.4rem] hover:bg-white text-[0.95rem]"
            >
              {l.visible ? "👁️" : "🚫"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(l.id); }}
              aria-label="Duplicate layer"
              className="w-7 h-7 rounded-[0.4rem] hover:bg-white text-brand-muted hover:text-brand-primary text-[0.85rem]"
            >
              ⧉
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(l.id); }}
              aria-label="Delete layer"
              className="w-7 h-7 rounded-[0.4rem] hover:bg-white text-brand-muted hover:text-red-600 text-[0.9rem]"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
