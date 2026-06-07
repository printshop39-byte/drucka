"use client";

import MockImage from "./MockImage";
import type { CartLine } from "./CartContext";

interface Props {
  line: CartLine;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}

export default function CartItem({ line, onInc, onDec, onRemove }: Props) {
  return (
    <div className="flex gap-4 py-[18px] border-b border-brand-border last:border-b-0">
      <div className="relative w-[86px] h-[86px] shrink-0 rounded-[14px] bg-brand-mint flex items-center justify-center text-[2.4rem] overflow-hidden">
        {/* product mockup as base */}
        <MockImage
          src={line.image}
          alt={line.name}
          emoji={line.fallbackEmoji}
          className="w-full h-full object-contain p-2"
        />
        {/* uploaded custom design overlaid on top (if present) */}
        {line.designImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={line.designImage}
            alt={`${line.name} custom design`}
            className="absolute max-w-[60%] max-h-[60%] object-contain rounded-[3px] pointer-events-none"
            style={{ transform: `rotate(${line.rotation ?? 0}deg)` }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-[10px]">
          <div>
            <div className="font-bold text-[1.02rem]">{line.name}</div>
            <div className="text-brand-muted text-[0.82rem] mt-[2px]">
              {[line.size && `Size ${line.size}`, line.meta].filter(Boolean).join(" · ")}
            </div>
          </div>
          <button onClick={onRemove} className="bg-none border-none cursor-pointer text-brand-muted text-[0.82rem] font-semibold hover:text-red-600 px-1" aria-label={`Remove ${line.name}`}>
            ✕ Remove
          </button>
        </div>
        <div className="flex items-center justify-between mt-[14px] gap-[10px] flex-wrap">
          <span className="inline-flex items-center border border-brand-border rounded-full overflow-hidden">
            <button onClick={onDec} className="w-8 h-8 border-none bg-white cursor-pointer text-[1.1rem] text-brand-primary font-bold hover:bg-brand-mint" aria-label={`Decrease ${line.name} quantity`}>−</button>
            <span className="min-w-[34px] text-center font-bold text-[0.9rem]" aria-live="polite">{line.qty}</span>
            <button onClick={onInc} className="w-8 h-8 border-none bg-white cursor-pointer text-[1.1rem] text-brand-primary font-bold hover:bg-brand-mint" aria-label={`Increase ${line.name} quantity`}>+</button>
          </span>
          <span className="font-bold text-brand-primary text-[1.05rem]">₹{(line.price * line.qty).toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
