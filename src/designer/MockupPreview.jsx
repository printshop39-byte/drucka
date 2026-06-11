import { LayerView, MockupImage } from "./DesignCanvas";

/* ── Mockup view (Preview mode) ──
   Clean mockups with the designs applied — no handles, no dotted area.
   Thumbnail grid switches placements; active thumb gets an orange border. */

/* small reusable mockup with layers applied — also used on the submit page */
export const MiniMockup = ({ product, color, placement, layers, className = "", style }) => (
  <div className={`relative overflow-hidden bg-white ${className}`} style={{ aspectRatio: "42 / 50", ...style }}>
    <MockupImage product={product} color={color} photo={placement.photo} />
    <div className="absolute overflow-hidden"
      style={{
        left: `${placement.area.left}%`, top: `${placement.area.top}%`,
        width: `${placement.area.width}%`, height: `${placement.area.height}%`,
        containerType: "size",
      }}>
      {(layers ?? []).map((l) => <LayerView key={l.id} layer={l} />)}
    </div>
  </div>
);

export default function MockupPreview({ product, color, layersByPlacement, placement, onPlacement, zoom }) {
  const active = product.printAreas.find((p) => p.id === placement) ?? product.printAreas[0];
  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-y-auto px-4 py-3">
      <h2 className="mb-2 shrink-0 font-display text-lg font-bold text-ink">Mockup view</h2>

      {/* main preview */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <MiniMockup product={product} color={color} placement={active}
          layers={layersByPlacement[active.id]}
          className="shrink-0 rounded-xl shadow-lg"
          style={{ height: `${zoom ?? 92}%`, minHeight: 280 }} />
      </div>

      {/* placement thumbnails */}
      <div className="mt-3 flex shrink-0 flex-wrap justify-center gap-2 pb-1">
        {product.printAreas.map((p) => {
          const n = (layersByPlacement[p.id] ?? []).filter((l) => l.visible !== false).length;
          return (
            <button key={p.id} onClick={() => onPlacement(p.id)} title={p.label}
              className={`w-16 overflow-hidden rounded-xl border-2 bg-white transition sm:w-20 ${
                placement === p.id ? "border-tangerine ring-2 ring-tangerine/30" : "border-ink/10 hover:border-ink/30"
              }`}>
              <MiniMockup product={product} color={color} placement={p} layers={layersByPlacement[p.id]} />
              <span className={`block truncate px-1 py-0.5 text-center text-[9px] font-bold ${placement === p.id ? "text-tangerine" : "text-ink/55"}`}>
                {p.label}{n > 0 ? ` · ${n}` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
