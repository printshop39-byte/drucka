"use client";

import { AREAS, type EditorArea } from "./types";

export default function ProductAreaTabs({
  active,
  onSelect,
  layerCounts,
}: {
  active: EditorArea;
  onSelect: (a: EditorArea) => void;
  layerCounts: Record<EditorArea, number>;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {AREAS.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`shrink-0 rounded-[0.7rem] px-3 py-2 text-[0.8rem] font-semibold border transition whitespace-nowrap ${
            active === a.id
              ? "bg-brand-primary text-white border-brand-primary"
              : "bg-white text-brand-muted border-brand-border hover:border-brand-gold/50 hover:text-brand-primary"
          }`}
        >
          {a.label}
          {layerCounts[a.id] > 0 && (
            <span className={`ml-2 text-[0.68rem] rounded-full px-[6px] py-[1px] ${active === a.id ? "bg-white/25" : "bg-brand-mint text-brand-primary"}`}>
              {layerCounts[a.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
