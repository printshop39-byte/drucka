"use client";

import { useRef } from "react";
import MockImage from "@/components/MockImage";
import { COLORS, VIEW_TRANSFORM, type EditorArea, type EditorLayer, type TshirtColor, type ViewMode } from "./types";

const TSHIRT_SRC = "/assets/tshirt-mockup.png";

// Areas that have a usable printable region in the editor canvas.
const PRINTABLE_AREAS: EditorArea[] = ["front", "back"];

export default function TshirtCanvas({
  area,
  color,
  view,
  layers,
  selectedId,
  preview,
  onSelectLayer,
  onMoveLayer,
}: {
  area: EditorArea;
  color: TshirtColor;
  view: ViewMode;
  layers: EditorLayer[];       // layers for the current area only
  selectedId: string | null;
  preview: boolean;
  onSelectLayer: (id: string) => void;
  onMoveLayer: (id: string, x: number, y: number) => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  const colorDef = COLORS.find((c) => c.id === color);
  const tintFilter = colorDef?.filter ?? "none";
  const tintHex = colorDef?.hex ?? "#FFFFFF";
  const printable = PRINTABLE_AREAS.includes(area);
  // Show the design on the matching flat view of the current printable area.
  const showDesign = printable && ((area === "front" && view === "front") || (area === "back" && view === "back"));

  // ---- Drag handling (pointer events; clamps to 0..100% of printable area) ----
  function pointerToPercent(clientX: number, clientY: number) {
    const box = printRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return null;
    const x = ((clientX - box.left) / box.width) * 100;
    const y = ((clientY - box.top) / box.height) * 100;
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
  }
  function onLayerPointerDown(e: React.PointerEvent, id: string) {
    if (preview) return;
    e.stopPropagation();
    onSelectLayer(id);
    dragId.current = id;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragId.current) return;
    const p = pointerToPercent(e.clientX, e.clientY);
    if (p) onMoveLayer(dragId.current, Math.round(p.x), Math.round(p.y));
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragId.current) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      dragId.current = null;
    }
  }

  return (
    <div className="relative bg-brand-mint rounded-2xl h-[460px] max-[680px]:h-[360px] flex items-center justify-center overflow-hidden" style={{ perspective: "1100px" }}>
      <div
        className="relative w-[78%] h-[88%] flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transformStyle: "preserve-3d", transform: VIEW_TRANSFORM[view] }}
      >
        {/* Color-tinted mockup */}
        <div className="relative w-full h-full flex items-center justify-center" style={{ filter: tintFilter }}>
          <MockImage
            src={TSHIRT_SRC}
            alt="T-shirt mockup"
            emoji="👕"
            className="max-w-full max-h-full object-contain drop-shadow-[0_18px_30px_rgba(6,56,47,0.22)]"
            emojiClassName="text-[12rem] max-[680px]:text-[8rem] leading-none"
          />
        </div>

        {/* Printable area + draggable layers */}
        {showDesign && (
          <div
            ref={printRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[40%] ${preview ? "" : "border-2 border-dashed border-brand-primary/45 rounded-[6px]"}`}
            style={{ transform: "translateZ(2px)" }}
          >
            {layers.filter((l) => l.visible).map((l) => {
              const selected = l.id === selectedId;
              return (
                <div
                  key={l.id}
                  onPointerDown={(e) => onLayerPointerDown(e, l.id)}
                  className={`absolute select-none ${preview ? "" : "cursor-move"} ${!preview && selected ? "outline outline-2 outline-brand-gold outline-offset-2" : ""}`}
                  style={{
                    left: `${l.x}%`,
                    top: `${l.y}%`,
                    transform: `translate(-50%,-50%) rotate(${l.rotation}deg) scale(${l.scale / 100})`,
                    maxWidth: "90%",
                    touchAction: "none",
                  }}
                >
                  {l.type === "image" && l.src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={l.src} alt={l.name} className="max-w-[120px] max-h-[120px] object-contain pointer-events-none" draggable={false} />
                  ) : (
                    <span className="font-body font-bold text-[1rem] whitespace-nowrap pointer-events-none" style={{ color: tintHex === "#FFFFFF" ? "#12211C" : "#FFFFFF" }}>
                      {l.text}
                    </span>
                  )}
                </div>
              );
            })}

            {!preview && layers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-[0.74rem] text-brand-primary/70 font-semibold px-2 pointer-events-none">
                {area === "back" ? "Back print area — add your design" : "Printable area — add your design"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View label */}
      <div className="absolute top-3 left-3 text-[0.7rem] font-bold uppercase tracking-wide text-brand-muted bg-white/85 backdrop-blur px-2.5 py-1 rounded-full">
        {view === "orbit" ? "3D Orbit" : view === "back" ? "Back View" : "Front View"}
      </div>

      {/* Non-printable area note */}
      {!printable && (
        <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 text-[0.78rem] text-brand-muted bg-white/85 px-3 py-[6px] rounded-full">
          Area preview coming soon
        </div>
      )}

      {/* Hint to switch view if design exists but isn't visible on this view */}
      {printable && !showDesign && (
        <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 text-[0.76rem] text-brand-muted bg-white/85 px-3 py-[6px] rounded-full">
          {area === "back" ? "Switch to Back View to edit the back print" : "Switch to Front View to edit the front print"}
        </div>
      )}
    </div>
  );
}
