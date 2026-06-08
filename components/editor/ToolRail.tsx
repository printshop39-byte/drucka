"use client";

export type ToolId = "upload" | "text" | "graphics" | "mydesigns" | "templates";

const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: "upload", label: "Upload", icon: "⬆️" },
  { id: "text", label: "Add Text", icon: "🔤" },
  { id: "graphics", label: "Graphics", icon: "✨" },
  { id: "mydesigns", label: "My Designs", icon: "🖼️" },
  { id: "templates", label: "Templates", icon: "🧩" },
];

export default function ToolRail({
  active,
  onSelect,
}: {
  active: ToolId;
  onSelect: (t: ToolId) => void;
}) {
  return (
    <div className="bg-white border border-brand-border rounded-premium shadow-soft p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`flex md:flex-col items-center gap-2 md:gap-1 rounded-[0.7rem] px-3 py-2 md:py-3 text-[0.72rem] font-semibold whitespace-nowrap transition shrink-0 ${
            active === t.id ? "bg-brand-primary text-white" : "text-brand-muted hover:bg-brand-mint hover:text-brand-primary"
          }`}
        >
          <span className="text-[1.2rem]">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
