"use client";

import MockImage from "./MockImage";
import type { Product } from "@/data/products";

export interface PreviewState {
  uploadedImage: string | null; // data URL
  text: string;
  imgScale: number;             // %
  textSize: number;             // px
  pos: string;                  // one of POS keys
  rotation: number;             // degrees, -180..180
}

export const POS_MAP: Record<string, [string, string]> = {
  tl: ["20%", "22%"], tc: ["20%", "50%"], tr: ["20%", "78%"],
  ml: ["50%", "22%"], c: ["50%", "50%"], mr: ["50%", "78%"],
  bl: ["80%", "22%"], bc: ["80%", "50%"], br: ["80%", "78%"],
};

export default function CustomizePreview({
  product,
  state,
}: {
  product: Product;
  state: PreviewState;
}) {
  const [top, left] = POS_MAP[state.pos] ?? POS_MAP.c;
  const overlaySize = Math.round((140 * state.imgScale) / 110);
  const hasContent = state.uploadedImage || state.text.trim();

  return (
    <div className="relative bg-brand-mint rounded-2xl h-[420px] max-[680px]:h-[320px] flex items-center justify-center overflow-hidden">
      {/* product mockup (re-mounts per product so fallback resets) */}
      <MockImage
        key={product.id}
        src={product.image}
        alt={`${product.name} mockup`}
        emoji={product.fallbackEmoji}
        className="max-w-[88%] max-h-[88%] object-contain drop-shadow-[0_12px_24px_rgba(6,56,47,0.18)]"
        emojiClassName="text-[11rem] max-[680px]:text-[8rem] leading-none drop-shadow-[0_12px_24px_rgba(6,56,47,0.18)]"
      />

      {/* design overlay */}
      <div
        className="absolute flex flex-col items-center gap-1 pointer-events-none max-w-[60%] text-center"
        style={{ top, left, transform: "translate(-50%,-50%)" }}
      >
        {state.uploadedImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={state.uploadedImage}
            alt="Your uploaded design"
            className="rounded-lg object-contain"
            style={{
              maxWidth: overlaySize,
              maxHeight: overlaySize,
              transform: `rotate(${state.rotation}deg)`,
            }}
          />
        )}
        {state.text && (
          <div
            className="font-body font-bold text-white break-words"
            style={{ fontSize: state.textSize, textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
          >
            {state.text}
          </div>
        )}
      </div>

      {!hasContent && (
        <div className="absolute bottom-[14px] left-1/2 -translate-x-1/2 text-[0.8rem] text-brand-muted bg-white/80 px-3 py-[5px] rounded-full">
          Upload a design or add text to see it here
        </div>
      )}
    </div>
  );
}
