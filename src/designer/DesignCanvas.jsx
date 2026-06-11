import { useRef } from "react";
import { fontStack, mockupSrc, placementOf } from "./data";

/* ── DesignCanvas — mockup photo + printable area + interactive layers ──
   Layer coords are % of the print area: x/y = center, w/h = size as % of
   area width/height. All pointer math goes through the print-area rect, so
   zoom/scroll never break the interactions. Drag uses the hybrid pattern
   (setPointerCapture best-effort + window listeners) proven in App.jsx.
   Text size uses cqh units — the print area is a size container, so text
   scales with the mockup exactly like image layers do.
   Styling: BLUE dotted printable area, ORANGE (tangerine) selection. */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* keep a layer's center inside the printable area for its current size */
export const clampToArea = (l) => {
  const halfW = l.type === "text" ? 0 : Math.min((l.w ?? 30) / 2, 50);
  const halfH = l.type === "text" ? 0 : Math.min((l.h ?? 30) / 2, 50);
  return { ...l, x: clamp(l.x, halfW, 100 - halfW), y: clamp(l.y, halfH, 100 - halfH) };
};

/* shared layer renderer — used by the live canvas and the mini mockups */
export const LayerView = ({ layer }) => {
  if (layer.visible === false) return null;
  const style = {
    position: "absolute",
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: [
      "translate(-50%, -50%)",
      `rotate(${layer.rot ?? 0}deg)`,
      layer.flipH ? "scaleX(-1)" : "",
      layer.flipV ? "scaleY(-1)" : "",
    ].join(" "),
    opacity: layer.opacity ?? 1,
  };
  if (layer.type !== "text") {
    style.width = `${layer.w}%`;
    style.height = `${layer.h}%`;
  }
  return (
    <div style={style} className="pointer-events-none select-none">
      {layer.type === "text" ? (
        <div style={{
          fontFamily: fontStack(layer.font),
          fontSize: `${layer.fontSize ?? 11}cqh`,
          fontWeight: layer.bold ? 800 : 400,
          fontStyle: layer.italic ? "italic" : "normal",
          textDecoration: layer.underline ? "underline" : "none",
          letterSpacing: `${layer.letterSpacing ?? 0}em`,
          lineHeight: layer.lineHeight ?? 1.15,
          color: layer.color,
          whiteSpace: "pre",
          textAlign: "center",
        }}>
          {layer.text}
        </div>
      ) : (
        <img src={layer.src} alt={layer.name} draggable={false}
          className="h-full w-full select-none" style={{ objectFit: "fill" }} />
      )}
    </div>
  );
};

/* mockup photo or neutral placeholder when no photo exists yet */
export const MockupImage = ({ product, color, photo, className = "" }) => {
  const src = mockupSrc(product, color, photo);
  if (src) {
    return <img src={src} alt={`${product.productName} ${photo}`} draggable={false}
      className={`absolute inset-0 h-full w-full select-none object-cover ${className}`} />;
  }
  return (
    <div className={`absolute inset-0 grid place-items-center bg-gradient-to-b from-[#eef0f4] to-[#e2e5ec] ${className}`}>
      <p className="px-6 text-center text-xs font-semibold text-ink/40">
        {product.productName}
        <span className="mt-1 block text-[10px] font-medium text-ink/30">Mockup photo coming soon — design preview is still accurate</span>
      </p>
    </div>
  );
};

export default function DesignCanvas({
  product, placement, color, layers, selectedId, onSelect, onPatch, zoom, preview, showToast,
}) {
  const areaRef = useRef(null);
  const warnedRef = useRef(false);
  const p = placementOf(product, placement);

  /* ── drag / resize / rotate ── */
  const startGesture = (e, layer, kind) => {
    if (preview) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(layer.id);
    if (layer.locked) return; // selectable but not editable
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerId = e.pointerId;
    try { e.currentTarget.setPointerCapture(pointerId); } catch { /* best effort */ }

    const start = {
      px: e.clientX, py: e.clientY,
      x: layer.x, y: layer.y, w: layer.w ?? 30, h: layer.h ?? 30,
      fontSize: layer.fontSize ?? 11,
    };
    const center = {
      x: rect.left + (layer.x / 100) * rect.width,
      y: rect.top + (layer.y / 100) * rect.height,
    };
    const startDist = Math.max(8, Math.hypot(e.clientX - center.x, e.clientY - center.y));

    const move = (ev) => {
      if (ev.pointerId !== pointerId) return;
      if (kind === "drag") {
        const nx = start.x + ((ev.clientX - start.px) / rect.width) * 100;
        const ny = start.y + ((ev.clientY - start.py) / rect.height) * 100;
        onPatch(layer.id, clampToArea({ ...layer, x: nx, y: ny }), true);
      } else if (kind === "resize") {
        const factor = Math.hypot(ev.clientX - center.x, ev.clientY - center.y) / startDist;
        if (layer.type === "text") {
          onPatch(layer.id, { fontSize: clamp(start.fontSize * factor, 3, 40) }, true);
        } else {
          const w = clamp(start.w * factor, 4, 140);
          const h = clamp(start.h * factor, 4, 140);
          if ((w > 100 || h > 100) && !warnedRef.current) {
            warnedRef.current = true;
            showToast?.("⚠ Design is larger than the printable area");
          }
          onPatch(layer.id, clampToArea({ ...layer, w, h }), true);
        }
      } else if (kind === "rotate") {
        const ang = (Math.atan2(ev.clientY - center.y, ev.clientX - center.x) * 180) / Math.PI + 90;
        onPatch(layer.id, { rot: Math.round(((ang % 360) + 360) % 360) }, true);
      }
    };
    const up = (ev) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      onPatch(layer.id, {}, false); // commit → history snapshot
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const renderLayer = (layer, i) => {
    if (layer.visible === false) return null;
    const selected = layer.id === selectedId && !preview;
    const box = {
      position: "absolute",
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      transform: [
        "translate(-50%, -50%)",
        `rotate(${layer.rot ?? 0}deg)`,
        layer.flipH ? "scaleX(-1)" : "",
        layer.flipV ? "scaleY(-1)" : "",
      ].join(" "),
      opacity: layer.opacity ?? 1,
      zIndex: i + 1,
      touchAction: "none",
      cursor: preview ? "default" : layer.locked ? "not-allowed" : "move",
    };
    if (layer.type !== "text") {
      box.width = `${layer.w}%`;
      box.height = `${layer.h}%`;
    }

    return (
      <div key={layer.id} style={box} className="touch-none select-none"
        onPointerDown={(e) => startGesture(e, layer, "drag")}>
        {layer.type === "text" ? (
          <div style={{
            fontFamily: fontStack(layer.font),
            fontSize: `${layer.fontSize ?? 11}cqh`,
            fontWeight: layer.bold ? 800 : 400,
            fontStyle: layer.italic ? "italic" : "normal",
            textDecoration: layer.underline ? "underline" : "none",
            letterSpacing: `${layer.letterSpacing ?? 0}em`,
            lineHeight: layer.lineHeight ?? 1.15,
            color: layer.color,
            whiteSpace: "pre",
            textAlign: "center",
          }}>
            {layer.text}
          </div>
        ) : (
          <img src={layer.src} alt={layer.name} draggable={false}
            className="h-full w-full select-none" style={{ objectFit: "fill" }} />
        )}

        {selected && (
          <>
            <div className="pointer-events-none absolute -inset-1 rounded border-2 border-tangerine" />
            {layer.locked ? (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold text-white">🔒 Locked</span>
            ) : (
              <>
                {["-left-1.5 -top-1.5", "-right-1.5 -top-1.5", "-left-1.5 -bottom-1.5", "-right-1.5 -bottom-1.5"].map((pos) => (
                  <div key={pos} onPointerDown={(e) => startGesture(e, layer, "resize")}
                    className={`absolute ${pos} h-4 w-4 cursor-nwse-resize rounded-full border-2 border-tangerine bg-white shadow touch-none`} />
                ))}
                <div onPointerDown={(e) => startGesture(e, layer, "rotate")}
                  className="absolute -top-8 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-tangerine bg-white shadow touch-none">
                  <div className="pointer-events-none absolute left-1/2 top-full h-3 w-px -translate-x-1/2 bg-tangerine/70" />
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-auto p-4">
      {/* mockup canvas — 42:50 like all Drucka mockup crops */}
      <div className="relative shrink-0 overflow-hidden rounded-xl bg-white shadow-lg"
        style={{ height: `${zoom}%`, minHeight: 280, aspectRatio: "42 / 50" }}
        onPointerDown={() => onSelect(null)}>
        <MockupImage product={product} color={color} photo={p.photo} />

        {/* printable area — blue dotted; size container so cqh text tracks it */}
        <div ref={areaRef}
          className={`absolute rounded-sm ${preview ? "overflow-hidden" : "border-2 border-dotted border-sky-500/70"}`}
          style={{
            left: `${p.area.left}%`, top: `${p.area.top}%`,
            width: `${p.area.width}%`, height: `${p.area.height}%`,
            containerType: "size",
          }}>
          {layers.map(renderLayer)}
          {!preview && !layers.length && (
            <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-2 text-center text-[10px] font-semibold text-sky-600/60">
              {p.label} print area
              <span className="block text-[9px] font-medium">{p.inches.w}″ × {p.inches.h}″</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
