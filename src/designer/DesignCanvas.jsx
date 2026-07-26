import { useEffect, useMemo, useRef, useState } from "react";
import { fontStack, placementOf, renderArea } from "./data";
import { Icon, ic } from "./icons";

/* ── DesignCanvas — mockup photo + printable area + interactive layers ──
   Layer coords are % of the print area: x/y = center, w/h = size as % of
   area width/height. All pointer math goes through the print-area rect, so
   zoom/scroll never break the interactions. Drag uses the hybrid pattern
   (setPointerCapture best-effort + window listeners) proven in App.jsx.
   Text size uses cqh units — the print area is a size container, so text
   scales with the mockup exactly like image layers do.
   Styling: BLUE dotted printable area, ORANGE (tangerine) selection. */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Keep a layer's centre inside the printable area for its current size.

   `half` is the layer's half-width/half-height as a % of the area, measured
   from the DOM. It exists because a text layer has no w/h of its own — the
   old fallback of 0 meant text was clamped by its centre point alone, so a
   caption could be dragged until nearly all of it sat outside the print area
   and got cut off in production. Measuring also handles rotation, which the
   w/h numbers do not describe.

   A layer larger than the area on an axis cannot satisfy the clamp, so it is
   centred on that axis rather than pinned to an arbitrary edge. */
export const clampToArea = (l, half = null) => {
  const halfW = half ? half.w : l.type === "text" ? 0 : Math.min((l.w ?? 30) / 2, 50);
  const halfH = half ? half.h : l.type === "text" ? 0 : Math.min((l.h ?? 30) / 2, 50);
  return {
    ...l,
    x: halfW >= 50 ? 50 : clamp(l.x, halfW, 100 - halfW),
    y: halfH >= 50 ? 50 : clamp(l.y, halfH, 100 - halfH),
  };
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

/* mockup photo or neutral placeholder when no photo exists yet.
   Candidate chain: blank mockup (/mockups/{base}-{photo}-{color}) →
   the product's styled `image` → neutral placeholder. Each 404 falls
   through, so wiring a blank mockup filename that isn't uploaded yet
   never breaks the editor — it just keeps showing the current photo. */
export const MockupImage = ({ product, color, photo, className = "" }) => {
  const candidates = useMemo(() => {
    const list = [];
    if (product.mockups) {
      const c = product.mockups.colors.includes(color) ? color : "white";
      list.push(`/mockups/${product.mockups.base}-${photo}-${c}.${product.mockups.ext}`);
    }
    if (product.image) list.push(product.image);
    return list;
  }, [product, color, photo]);
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [candidates]);
  const src = candidates[idx] ?? null;
  if (src) {
    return <img src={src} alt={`${product.productName} ${photo}`} draggable={false}
      onError={() => setIdx((i) => i + 1)}
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
  product, placement, color, layers, selectedId, onSelect, onPatch, onDelete, zoom, preview, showToast,
}) {
  const areaRef = useRef(null);
  const warnedRef = useRef(false);
  const p = placementOf(product, placement);
  /* true-to-inches box, not the raw authored one — see renderArea in data.js.
     Passing the colour matters: some products carry a different box per
     mockup photo. */
  const area = useMemo(() => renderArea(p, product, color), [p, product, color]);

  /* what the selected layer will actually measure on the product */
  const inch = (n) => Math.round(n * 10) / 10;
  const sizeLabel = (l) => (l.type === "text"
    /* text is sized in cqh — 1 unit = 1% of the print height */
    ? `${inch(((l.fontSize ?? 11) / 100) * p.inches.h)}″ tall`
    : `${inch(((l.w ?? 30) / 100) * p.inches.w)}″ × ${inch(((l.h ?? 30) / 100) * p.inches.h)}″`);

  /* Delete / Backspace removes the selected layer, the way every editor
     behaves. Ignored while typing, so the text panel keeps working. */
  useEffect(() => {
    if (preview || !selectedId || !onDelete) return;
    const onKey = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const t = e.target;
      const typing = t instanceof HTMLElement &&
        (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      if (typing) return;
      e.preventDefault();
      onDelete(selectedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, selectedId, onDelete]);

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

    /* The layer's real on-screen half-extents, as a % of the print area — the
       only way to keep a text layer inside, since text carries no w/h. Read
       once per gesture from the element being dragged. */
    const box = kind === "drag" ? e.currentTarget.getBoundingClientRect() : null;
    const half = box
      ? { w: (box.width / rect.width) * 50, h: (box.height / rect.height) * 50 }
      : null;
    /* Oversized text can only be centred, never fitted by dragging — say so.
       Images already warned on resize; text warned nowhere. */
    if (half && (half.w >= 50 || half.h >= 50) && !warnedRef.current) {
      warnedRef.current = true;
      showToast?.("⚠ Design is larger than the printable area");
    }

    const move = (ev) => {
      if (ev.pointerId !== pointerId) return;
      if (kind === "drag") {
        const nx = start.x + ((ev.clientX - start.px) / rect.width) * 100;
        const ny = start.y + ((ev.clientY - start.py) / rect.height) * 100;
        onPatch(layer.id, clampToArea({ ...layer, x: nx, y: ny }, half), true);
      } else if (kind === "resize") {
        const factor = Math.hypot(ev.clientX - center.x, ev.clientY - center.y) / startDist;
        if (layer.type === "text") {
          onPatch(layer.id, { fontSize: clamp(start.fontSize * factor, 3, 40) }, true);
        } else {
          /* Clamp the SCALE, not each side. Clamping width and height
             independently let the wider side stop at 140 while the other kept
             growing, so dragging a wide design past the limit slowly squashed
             it. One factor for both keeps the artwork's proportions. */
          const f = clamp(factor,
            Math.max(4 / start.w, 4 / start.h),
            Math.min(140 / start.w, 140 / start.h));
          const w = start.w * f;
          const h = start.h * f;
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
                {/* delete lives on the selection itself — it used to exist only
                    in the Layers list, so with a layer selected there was no
                    way to remove it from the canvas or the settings panel */}
                {onDelete && (
                  <button title="Delete layer" aria-label={`Delete ${layer.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                    className="absolute -right-2.5 -top-8 grid h-6 w-6 place-items-center rounded-full border-2 border-red-500 bg-white text-red-500 shadow transition hover:bg-red-500 hover:text-white">
                    <Icon d={ic.trash} className="h-3 w-3" />
                  </button>
                )}
                {/* live print size — the number that actually gets printed */}
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/85 px-2 py-0.5 text-[9px] font-bold text-white">
                  {sizeLabel(layer)}
                </span>
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
        {/* No border on this element: box-sizing is border-box, so a 2px
            dotted border shrinks the content box that every layer's % width
            and height resolve against — and it shrinks the two axes by
            different fractions. On the mug's 174×76 box that alone drew
            designs 3% out of proportion. The outline is a sibling overlay
            instead, which takes no layout space at all. */}
        <div ref={areaRef} data-print-area={p.id}
          className={`absolute rounded-sm ${preview ? "overflow-hidden" : ""}`}
          style={{
            left: `${area.left}%`, top: `${area.top}%`,
            width: `${area.width}%`, height: `${area.height}%`,
            containerType: "size",
          }}>
          {!preview && (
            <div className="pointer-events-none absolute inset-0 rounded-sm border-2 border-dotted border-sky-500/70" style={{ margin: -2 }} />
          )}
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
