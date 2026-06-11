import { useRef, useState } from "react";
import {
  COLOR_PALETTE, FONTS, GRAPHICS, GRAPHIC_CATEGORIES, LIGHT_COLORS, TEXT_COLORS,
  colorById, fontStack, graphicDataUrl, inr, placementOf,
} from "./data";
import { Icon, ic } from "./icons";
import { clampToArea } from "./DesignCanvas";

/* ── shared bits ── */
const PanelShell = ({ title, onClose, children }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between px-4 pb-2 pt-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/45">{title}</p>
      {onClose && (
        <button onClick={onClose} aria-label={`Close ${title} panel`}
          className="grid h-7 w-7 place-items-center rounded-full text-ink/50 hover:bg-ink/5">
          <Icon d={ic.close} className="h-4 w-4" />
        </button>
      )}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink/45">{label}</span>
    {children}
  </label>
);

const NumInput = (props) => (
  <input type="number" {...props}
    className="w-full rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-sm font-semibold text-ink outline-none focus:border-tangerine" />
);

/* smooth open/close accordion (grid-rows trick) */
const Accordion = ({ title, open, onToggle, children }) => (
  <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
    <button onClick={onToggle} aria-expanded={open}
      className="flex w-full items-center justify-between px-3 py-2.5 text-left">
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink/55">{title}</span>
      <Icon d={ic.chev} className={`h-4 w-4 text-ink/40 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
    </button>
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
      <div className="overflow-hidden">
        <div className="px-3 pb-3">{children}</div>
      </div>
    </div>
  </div>
);

/* ── PRODUCT INFORMATION ── */
export function ProductInfoPanel({ product, state, setSel, qty, setQty, onClose }) {
  const [open, setOpen] = useState({ printing: true, colors: true, sizes: true });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const thumb = product.gallery?.[0]?.src;

  return (
    <PanelShell title="Product Information" onClose={onClose}>
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-3">
        {thumb && <img src={thumb} alt="" className="h-14 w-12 rounded-lg object-cover" />}
        <div>
          <p className="text-sm font-bold leading-tight text-ink">{product.productName}</p>
          <p className="text-xs text-ink/50">Base {inr(product.basePrice)}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <Accordion title="Printing Options" open={open.printing} onToggle={() => toggle("printing")}>
          <div className="space-y-2">
            {product.printingOptions.map((m) => (
              <button key={m.id} onClick={() => setSel({ selectedPrintMethod: m.id })}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition ${
                  state.selectedPrintMethod === m.id ? "border-tangerine bg-tangerine/5" : "border-ink/10 bg-white hover:border-ink/25"
                }`}>
                <span>
                  <span className="block text-sm font-extrabold text-ink">{m.label}
                    <span className="ml-1.5 text-[10px] font-semibold text-ink/45">{m.full}</span>
                  </span>
                  <span className="block text-[11px] text-ink/50">{m.note}</span>
                </span>
                {m.price > 0 && <span className="text-xs font-bold text-tangerine">+{inr(m.price)}</span>}
              </button>
            ))}
          </div>
        </Accordion>

        <Accordion title={`Available Colors · ${colorById(state.selectedColor)?.label ?? ""}`}
          open={open.colors} onToggle={() => toggle("colors")}>
          <div className="flex flex-wrap gap-2 pt-1">
            {product.availableColors.map((id) => {
              const c = colorById(id);
              return (
                <button key={id} title={c.label} onClick={() => setSel({ selectedColor: id })}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    state.selectedColor === id ? "border-tangerine ring-2 ring-tangerine/35" : "border-ink/15 hover:border-ink/35"
                  }`}
                  style={{ backgroundColor: c.hex }}>
                  {state.selectedColor === id && (
                    <Icon d={ic.check} className={`mx-auto h-4 w-4 ${LIGHT_COLORS.includes(id) ? "text-ink" : "text-white"}`} />
                  )}
                </button>
              );
            })}
          </div>
          {product.mockups && !product.mockups.colors.includes(state.selectedColor) && (
            <p className="mt-2 text-[11px] text-amber-700">Mockup shown on white — your product prints on {colorById(state.selectedColor)?.label}.</p>
          )}
        </Accordion>

        <Accordion title="Available Sizes" open={open.sizes} onToggle={() => toggle("sizes")}>
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {product.availableSizes.map((s) => (
              <button key={s} onClick={() => setSel({ selectedSize: s })}
                className={`rounded-lg border-2 py-1.5 text-xs font-bold transition ${
                  state.selectedSize === s ? "border-tangerine bg-tangerine text-white" : "border-ink/12 bg-white text-ink/70 hover:border-ink/30"
                }`}>
                {s}
              </button>
            ))}
          </div>
          {product.sizeSurcharge?.[state.selectedSize] > 0 && (
            <p className="mt-1.5 text-[11px] text-ink/50">{state.selectedSize} adds {inr(product.sizeSurcharge[state.selectedSize])}</p>
          )}
        </Accordion>
      </div>

      <div className="mt-3">
        <Field label="Quantity">
          <div className="flex w-fit items-center gap-3 rounded-full border border-ink/15 bg-white px-2 py-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="grid h-7 w-7 place-items-center rounded-full hover:bg-ink/5"><Icon d={ic.minus} className="h-4 w-4" /></button>
            <span className="w-6 text-center text-sm font-extrabold text-ink">{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity" className="grid h-7 w-7 place-items-center rounded-full hover:bg-ink/5"><Icon d={ic.plus} className="h-4 w-4" /></button>
          </div>
        </Field>
      </div>
    </PanelShell>
  );
}

/* ── LAYERS ── */
export function LayersPanel({ layers, selectedId, onSelect, onPatch, onDelete, onDuplicate, onMove, placementLabel, onClose }) {
  const list = [...layers].reverse(); // top-most first, like design tools
  return (
    <PanelShell title={`Layers · ${placementLabel}`} onClose={onClose}>
      {!list.length && <p className="text-sm text-ink/45">No layers yet — upload a design, add text, or pick a graphic.</p>}
      <ul className="space-y-1.5">
        {list.map((l) => {
          const idx = layers.indexOf(l);
          return (
            <li key={l.id}
              className={`rounded-xl border-2 p-2 transition ${l.id === selectedId ? "border-tangerine bg-tangerine/5" : "border-ink/10 bg-white"}`}>
              <div className="flex items-center gap-2">
                <button onClick={() => onSelect(l.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {l.type === "text" ? (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink/5"><Icon d={ic.text} className="h-4 w-4 text-ink/60" /></span>
                  ) : (
                    <img src={l.src} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-ink/5 object-contain" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-ink">{l.name}</span>
                    <span className="block text-[10px] capitalize text-ink/45">{l.type}{l.locked ? " · locked" : ""}</span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <button title="Move up" disabled={idx === layers.length - 1} onClick={() => onMove(l.id, +1)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-20"><Icon d={ic.up} className="h-3.5 w-3.5" /></button>
                  <button title="Move down" disabled={idx === 0} onClick={() => onMove(l.id, -1)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-20"><Icon d={ic.down} className="h-3.5 w-3.5" /></button>
                  <button title="Duplicate" onClick={() => onDuplicate(l.id)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"><Icon d={ic.copy} className="h-3.5 w-3.5" /></button>
                  <button title={l.locked ? "Unlock" : "Lock"} onClick={() => onPatch(l.id, { locked: !l.locked })}
                    className={`grid h-7 w-7 place-items-center rounded-lg hover:bg-ink/5 ${l.locked ? "text-tangerine" : "text-ink/50"}`}>
                    <Icon d={l.locked ? ic.lock : ic.unlock} className="h-3.5 w-3.5" />
                  </button>
                  <button title={l.visible === false ? "Show" : "Hide"} onClick={() => onPatch(l.id, { visible: l.visible === false })}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/50 hover:bg-ink/5">
                    <Icon d={l.visible === false ? ic.eyeOff : ic.eye} className="h-3.5 w-3.5" />
                  </button>
                  <button title="Delete" onClick={() => onDelete(l.id)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-red-400 hover:bg-red-50"><Icon d={ic.trash} className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}

/* ── UPLOADS ── */
export function UploadsPanel({ assets, onUpload, onUse, busy, onClose }) {
  const inputRef = useRef(null);
  return (
    <PanelShell title="Uploads" onClose={onClose}>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" hidden
        onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ""; }} />
      <button onClick={() => inputRef.current?.click()} disabled={busy}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-tangerine/45 bg-tangerine/5 px-4 py-7 text-tangerine transition hover:bg-tangerine/10 disabled:opacity-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files?.[0]); }}>
        <Icon d={ic.upload} className="h-7 w-7" />
        <span className="text-sm font-bold">{busy ? "Processing…" : "Upload PNG / JPG / JPEG / SVG"}</span>
        <span className="text-[11px] text-tangerine/70">or drag & drop here</span>
      </button>

      <ul className="mt-3 space-y-1 text-[11px] text-ink/55">
        <li>• Use a high-resolution image (300 DPI recommended)</li>
        <li>• Transparent PNG works best on garments</li>
        <li>• Keep your design inside the dotted print area</li>
      </ul>

      {assets.length > 0 && (
        <>
          <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wide text-ink/45">Uploaded files</p>
          <ul className="space-y-1.5">
            {assets.map((item) => (
              <li key={item.id}>
                <button title={`Add ${item.name} to canvas`} onClick={() => onUse(item)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-ink/10 bg-white p-2 text-left transition hover:border-tangerine">
                  <img src={item.src} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-ink/4 object-contain" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{item.name}</span>
                  <Icon d={ic.plus} className="h-4 w-4 shrink-0 text-tangerine" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </PanelShell>
  );
}

/* ── TEXT ── */
export function TextPanel({ selected, onAddText, onPatch, onClose }) {
  const [draft, setDraft] = useState("");
  const editing = selected?.type === "text" ? selected : null;

  return (
    <PanelShell title="Text" onClose={onClose}>
      {!editing && (
        <>
          <Field label="New text">
            <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="Type something…"
              className="w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-tangerine" />
          </Field>
          <button onClick={() => { if (draft.trim()) { onAddText(draft.trim()); setDraft(""); } }}
            disabled={!draft.trim()}
            className="mt-2 w-full rounded-full bg-tangerine py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-40">
            Add text to design
          </button>
          <p className="mt-3 text-[11px] text-ink/45">Tip: select a text layer on the canvas to edit its font, style and spacing.</p>
        </>
      )}

      {editing && (
        <div className="space-y-3">
          <Field label="Text">
            <textarea rows={2} value={editing.text}
              onChange={(e) => onPatch(editing.id, { text: e.target.value, name: e.target.value.slice(0, 18) })}
              className="w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-tangerine" />
          </Field>
          <Field label="Font family">
            <select value={editing.font} onChange={(e) => onPatch(editing.id, { font: e.target.value })}
              className="w-full rounded-lg border border-ink/15 bg-white px-2 py-2 text-sm font-semibold text-ink outline-none focus:border-tangerine">
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
            </select>
            <p className="mt-1 truncate text-lg" style={{ fontFamily: fontStack(editing.font) }}>Aa Bb Cc 123</p>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Font size">
              <NumInput min={3} max={40} step={0.5} value={Math.round((editing.fontSize ?? 11) * 10) / 10}
                onChange={(e) => onPatch(editing.id, { fontSize: Math.min(40, Math.max(3, +e.target.value || 3)) })} />
            </Field>
            <Field label="Style">
              <div className="flex gap-1.5">
                <button title="Bold" onClick={() => onPatch(editing.id, { bold: !editing.bold })}
                  className={`h-9 w-9 rounded-lg border-2 text-sm font-black transition ${editing.bold ? "border-tangerine bg-tangerine text-white" : "border-ink/12 text-ink/60"}`}>B</button>
                <button title="Italic" onClick={() => onPatch(editing.id, { italic: !editing.italic })}
                  className={`h-9 w-9 rounded-lg border-2 text-sm italic transition ${editing.italic ? "border-tangerine bg-tangerine text-white" : "border-ink/12 text-ink/60"}`}>I</button>
                <button title="Underline" onClick={() => onPatch(editing.id, { underline: !editing.underline })}
                  className={`h-9 w-9 rounded-lg border-2 text-sm font-bold underline transition ${editing.underline ? "border-tangerine bg-tangerine text-white" : "border-ink/12 text-ink/60"}`}>U</button>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Letter spacing · ${(editing.letterSpacing ?? 0).toFixed(2)}em`}>
              <input type="range" min={-0.05} max={0.5} step={0.01} value={editing.letterSpacing ?? 0}
                onChange={(e) => onPatch(editing.id, { letterSpacing: +e.target.value })} className="w-full accent-tangerine" />
            </Field>
            <Field label={`Line height · ${(editing.lineHeight ?? 1.15).toFixed(2)}`}>
              <input type="range" min={0.8} max={2.5} step={0.05} value={editing.lineHeight ?? 1.15}
                onChange={(e) => onPatch(editing.id, { lineHeight: +e.target.value })} className="w-full accent-tangerine" />
            </Field>
          </div>
          <Field label="Text colour">
            <div className="flex flex-wrap items-center gap-2">
              {TEXT_COLORS.map((c) => (
                <button key={c} onClick={() => onPatch(editing.id, { color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${editing.color === c ? "border-tangerine ring-2 ring-tangerine/35" : "border-ink/15"}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={editing.color} onChange={(e) => onPatch(editing.id, { color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-full border border-ink/15" title="Custom colour" />
            </div>
          </Field>
        </div>
      )}
    </PanelShell>
  );
}

/* ── GRAPHICS ── */
export function GraphicsPanel({ onAddImage, onClose }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const shown = GRAPHICS.filter((g) =>
    (cat === "all" || g.cat === cat) &&
    g.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <PanelShell title="Graphics" onClose={onClose}>
      <div className="relative mb-2">
        <Icon d={ic.search} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search graphics…"
          className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-ink outline-none focus:border-tangerine" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {GRAPHIC_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full border-2 px-3 py-1 text-[11px] font-bold capitalize transition ${
              cat === c ? "border-tangerine bg-tangerine text-white" : "border-ink/12 bg-white text-ink/55"
            }`}>
            {c}
          </button>
        ))}
      </div>
      {!shown.length && <p className="text-sm text-ink/45">No graphics match "{query}".</p>}
      <div className="grid grid-cols-4 gap-2">
        {shown.map((g) => (
          <button key={g.id} title={g.label} onClick={() => onAddImage(graphicDataUrl(g), g.label, 1)}
            className="grid aspect-square place-items-center rounded-xl border border-ink/10 bg-white p-2.5 transition hover:border-tangerine hover:bg-tangerine/5">
            <img src={graphicDataUrl(g)} alt={g.label} className="h-full w-full" />
          </button>
        ))}
      </div>
    </PanelShell>
  );
}

/* ── LAYER SETTINGS (right panel) ──
   W/H/X/Y in inches, mapped through the placement's physical print size.
   Aspect-ratio lock keeps W/H proportional from either input. */
export function LayerSettingsPanel({ layer, product, placement, onPatch, onClose }) {
  const p = placementOf(product, placement);
  const { w: AW, h: AH } = p.inches;
  if (!layer) return null;
  const isText = layer.type === "text";
  const round1 = (n) => Math.round(n * 10) / 10;
  const disabled = layer.locked;

  const set = (patch) => onPatch(layer.id, clampToArea({ ...layer, ...patch }));
  const setW = (wIn) => {
    const w = Math.min(140, Math.max(4, (wIn / AW) * 100));
    if (layer.aspectLock) {
      const factor = w / (layer.w ?? 30);
      set({ w, h: Math.min(140, Math.max(4, (layer.h ?? 30) * factor)) });
    } else set({ w });
  };
  const setH = (hIn) => {
    const h = Math.min(140, Math.max(4, (hIn / AH) * 100));
    if (layer.aspectLock) {
      const factor = h / (layer.h ?? 30);
      set({ h, w: Math.min(140, Math.max(4, (layer.w ?? 30) * factor)) });
    } else set({ h });
  };
  const alignX = { left: isText ? 8 : (layer.w ?? 30) / 2, center: 50, right: isText ? 92 : 100 - (layer.w ?? 30) / 2 };
  const alignY = { top: isText ? 8 : (layer.h ?? 30) / 2, middle: 50, bottom: isText ? 92 : 100 - (layer.h ?? 30) / 2 };

  return (
    <div className={`flex h-full flex-col ${disabled ? "opacity-90" : ""}`}>
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Layer Settings</p>
        {onClose && (
          <button onClick={onClose} aria-label="Close layer settings" className="grid h-7 w-7 place-items-center rounded-full text-ink/50 hover:bg-ink/5">
            <Icon d={ic.close} className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        <p className="flex items-center justify-between rounded-lg bg-ink/4 px-3 py-2 text-xs font-bold text-ink">
          <span className="truncate">{layer.name}</span>
          {disabled && <span className="ml-2 shrink-0 text-[10px] text-tangerine">🔒 locked</span>}
        </p>

        <fieldset disabled={disabled} className="space-y-3 disabled:pointer-events-none disabled:opacity-50">
          {!isText && (
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <Field label="Width (inch)">
                  <NumInput min={0.5} max={AW * 1.4} step={0.1} value={round1(((layer.w ?? 30) / 100) * AW)}
                    onChange={(e) => setW(+e.target.value || 0.5)} />
                </Field>
              </div>
              <button title={layer.aspectLock ? "Aspect ratio locked" : "Aspect ratio free"}
                onClick={() => onPatch(layer.id, { aspectLock: !layer.aspectLock })}
                className={`mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 transition ${
                  layer.aspectLock ? "border-tangerine bg-tangerine/10 text-tangerine" : "border-ink/12 text-ink/45"
                }`}>
                <Icon d={layer.aspectLock ? ic.link : ic.unlink} className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <Field label="Height (inch)">
                  <NumInput min={0.5} max={AH * 1.4} step={0.1} value={round1(((layer.h ?? 30) / 100) * AH)}
                    onChange={(e) => setH(+e.target.value || 0.5)} />
                </Field>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Field label="Position (X)">
              <NumInput step={0.1} value={round1((layer.x / 100) * AW)}
                onChange={(e) => set({ x: ((+e.target.value || 0) / AW) * 100 })} />
            </Field>
            <Field label="Position (Y)">
              <NumInput step={0.1} value={round1((layer.y / 100) * AH)}
                onChange={(e) => set({ y: ((+e.target.value || 0) / AH) * 100 })} />
            </Field>
          </div>

          <Field label="Alignments">
            <div className="grid grid-cols-6 gap-1">
              {[["left", ic.alignL], ["center", ic.alignC], ["right", ic.alignR]].map(([k, d]) => (
                <button key={k} title={`Align ${k}`} onClick={() => set({ x: alignX[k] })}
                  className="grid h-9 place-items-center rounded-lg border border-ink/12 text-ink/60 hover:border-tangerine hover:text-tangerine">
                  <Icon d={d} className="h-4 w-4" />
                </button>
              ))}
              {[["top", ic.alignT], ["middle", ic.alignM], ["bottom", ic.alignB]].map(([k, d]) => (
                <button key={k} title={`Align ${k}`} onClick={() => set({ y: alignY[k] })}
                  className="grid h-9 place-items-center rounded-lg border border-ink/12 text-ink/60 hover:border-tangerine hover:text-tangerine">
                  <Icon d={d} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Flip">
            <div className="flex gap-1.5">
              <button onClick={() => set({ flipH: !layer.flipH })}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 text-xs font-bold transition ${layer.flipH ? "border-tangerine bg-tangerine/5 text-tangerine" : "border-ink/12 text-ink/60"}`}>
                <Icon d={ic.flipH} className="h-4 w-4" /> Horizontal
              </button>
              <button onClick={() => set({ flipV: !layer.flipV })}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 text-xs font-bold transition ${layer.flipV ? "border-tangerine bg-tangerine/5 text-tangerine" : "border-ink/12 text-ink/60"}`}>
                <Icon d={ic.flipV} className="h-4 w-4" /> Vertical
              </button>
            </div>
          </Field>

          <Field label="Rotate">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={359} value={layer.rot ?? 0}
                onChange={(e) => set({ rot: +e.target.value })} className="flex-1 accent-tangerine" />
              <NumInput min={0} max={359} value={layer.rot ?? 0}
                onChange={(e) => set({ rot: Math.min(359, Math.max(0, Math.round(+e.target.value || 0))) })}
                style={{ width: 64 }} />
              <span className="text-xs font-bold text-ink/45">°</span>
            </div>
          </Field>

          <Field label="Layer Opacity">
            <div className="flex items-center gap-2">
              <input type="range" min={10} max={100} value={Math.round((layer.opacity ?? 1) * 100)}
                onChange={(e) => set({ opacity: +e.target.value / 100 })} className="flex-1 accent-tangerine" />
              <NumInput min={10} max={100} value={Math.round((layer.opacity ?? 1) * 100)}
                onChange={(e) => set({ opacity: Math.min(100, Math.max(10, Math.round(+e.target.value || 10))) / 100 })}
                style={{ width: 64 }} />
              <span className="text-xs font-bold text-ink/45">%</span>
            </div>
          </Field>
        </fieldset>
      </div>
    </div>
  );
}
