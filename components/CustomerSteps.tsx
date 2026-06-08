// A small numbered steps strip (Cart → Delivery → … or Choose Product → …).
// Presentational only — `current` (1-based) highlights the active step.
export default function CustomerSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.74rem] font-bold ${
                done ? "bg-brand-primary text-white"
                : active ? "bg-brand-gold text-brand-dark"
                : "bg-brand-mint text-brand-muted"
              }`}>{done ? "✓" : n}</span>
              <span className={`text-[0.82rem] font-semibold whitespace-nowrap ${active ? "text-brand-ink" : "text-brand-muted"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <span className="text-brand-border">—</span>}
          </div>
        );
      })}
    </div>
  );
}
