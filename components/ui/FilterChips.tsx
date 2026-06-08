"use client";

export interface ChipOption<T extends string> {
  key: T;
  label: string;
}

// Standard horizontal chip group with active state + mobile horizontal scroll.
export default function FilterChips<T extends string>({
  options,
  active,
  onChange,
  className = "",
}: {
  options: ChipOption<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`chip ${active === o.key ? "chip-active" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
