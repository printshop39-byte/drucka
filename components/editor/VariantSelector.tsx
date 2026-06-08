"use client";

import { COLORS, SIZES, type TshirtColor, type TshirtSize } from "./types";

export default function VariantSelector({
  color,
  size,
  onColor,
  onSize,
}: {
  color: TshirtColor;
  size: TshirtSize;
  onColor: (c: TshirtColor) => void;
  onSize: (s: TshirtSize) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[0.78rem] font-bold mb-2">Color</div>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onColor(c.id)}
              aria-label={c.label}
              title={c.label}
              className={`w-9 h-9 rounded-full border-2 transition ${color === c.id ? "border-brand-gold shadow-glow" : "border-brand-border"}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[0.78rem] font-bold mb-2">Size</div>
        <div className="flex gap-2 flex-wrap">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onSize(s)}
              className={`w-10 h-10 rounded-[0.6rem] border text-[0.84rem] font-bold transition ${
                size === s ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-brand-ink border-brand-border hover:border-brand-gold/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
