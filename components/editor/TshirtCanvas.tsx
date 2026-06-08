"use client";

import MockImage from "@/components/MockImage";
import { COLORS, VIEW_TRANSFORM, type EditorArea, type EditorLayer, type TshirtColor, type ViewMode } from "./types";

const TSHIRT_SRC = "/assets/tshirt-mockup.png";

export default function TshirtCanvas({
  area,
  color,
  view,
  layers,
  selectedId,
  preview,
  onSelectLayer,
}: {
  area: EditorArea;
  color: TshirtColor;
  view: ViewMode;
  layers: EditorLayer[];       // layers for the current area only
  selectedId: string | null;
  preview: boolean;
  onSelectLayer: (id: string) => void;
}) {
  const colorDef = COLORS.find((c) => c.id === color);
  const tintFilter = colorDef?.filter ?? "none";
  const tintHex = colorDef?.hex ?? "#FFFFFF";
  const isFront = area === "front";
  // Front area shows the design; back/orbit views hide the printable design layers
  // (the back/orbit of the garment isn't where the front print goes).
  const showDesign = isFront && view === "front";

  return (
    <div className="relative bg-brand-mint rounded-2xl h-[460px] max-[680px]:h-[360px] flex items-center justify-center overflow-hidden" style={{ perspective: "1100px" }}>
      {/* 3D rotating stage */}
      <div
        className="relative w-[78%] h-[88%] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transformStyle: "preserve-3d", transform: VIEW_TRANSFORM[view] }}
      >
        {/* T-shirt mockup, color-tinted via CSS filter */}
        <div className="relative w-full h-full flex items-center justify-center" style={{ filter: tintFilter }}>
          <MockImage
            src={TSHIRT_SRC}
            alt="T-shirt mockup"
            emoji="👕"
            className="max-w-full max-h-full object-contain drop-shadow-[0_18px_30px_rgba(6,56,47,0.22)]"
            emojiClassName="text-[12rem] max-[680px]:text-[8rem] leading-none"
          />
        </div>

        {/* Printable dashed area (chest) — only on the front view */}
        {showDesign && (
          <div
            className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[40%] ${preview ? "" : "border-2 border-dashed border-brand-primary/45 rounded-[6px]"}`}
            style={{ transform: "translateZ(2px)" }}
          >
            {layers.filter((l) => l.visible).map((l) => {
              const selected = l.id === selectedId;
              return (
                <div
                  key={l.id}
                  onClick={(e) => { e.stopPropagation(); onSelectLayer(l.id); }}
                  className={`absolute cursor-pointer ${!preview && selected ? "outline outline-2 outline-brand-gold outline-offset-2" : ""}`}
                  style={{
                    left: `${l.x}%`,
                    top: `${l.y}%`,
                    transform: `translate(-50%,-50%) rotate(${l.rotation}deg) scale(${l.scale / 100})`,
                    maxWidth: "90%",
                  }}
                >
                  {l.type === "image" && l.src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={l.src} alt={l.name} className="max-w-[120px] max-h-[120px] object-contain" />
                  ) : (
                    <span className="font-body font-bold text-[1rem] whitespace-nowrap" style={{ color: tintHex === "#FFFFFF" ? "#12211C" : "#FFFFFF" }}>
                      {l.text}
                    </span>
                  )}
                </div>
              );
            })}

            {!preview && layers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-[0.74rem] text-brand-primary/70 font-semibold px-2">
                Printable area — add your design
              </div>
            )}
          </div>
        )}
      </div>

      {/* View label */}
      <div className="absolute top-3 left-3 text-[0.7rem] font-bold uppercase tracking-wide text-brand-muted bg-white/85 backdrop-blur px-2.5 py-1 rounded-full">
        {view === "orbit" ? "3D Orbit" : view === "back" ? "Back View" : "Front View"}
      </div>

      {/* Non-front area note */}
      {!isFront && (
        <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 text-[0.78rem] text-brand-muted bg-white/85 px-3 py-[6px] rounded-full">
          Area preview coming soon
        </div>
      )}
    </div>
  );
}
