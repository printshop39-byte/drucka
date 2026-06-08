"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";
import { uploadDesignImage } from "@/lib/uploadDesign";

import EditorShell from "@/components/editor/EditorShell";
import ToolRail, { type ToolId } from "@/components/editor/ToolRail";
import TshirtCanvas from "@/components/editor/TshirtCanvas";
import ProductAreaTabs from "@/components/editor/ProductAreaTabs";
import VariantSelector from "@/components/editor/VariantSelector";
import LayersPanel from "@/components/editor/LayersPanel";
import {
  AREAS, COLORS, newLayerId,
  type EditorArea, type EditorLayer, type TshirtColor, type TshirtSize,
} from "@/components/editor/types";

const TSHIRT = { id: "tshirt", name: "Premium T-Shirt", price: 599, image: "/assets/tshirt-mockup.png", fallbackEmoji: "👕" };

export default function TshirtEditorPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Editor state ----
  const [tool, setTool] = useState<ToolId>("upload");
  const [area, setArea] = useState<EditorArea>("front");
  const [color, setColor] = useState<TshirtColor>("white");
  const [size, setSize] = useState<TshirtSize>("M");
  const [layers, setLayers] = useState<EditorLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [adding, setAdding] = useState(false);

  // ---- Derived ----
  const areaLayers = useMemo(() => layers.filter((l) => l.area === area), [layers, area]);
  const selected = useMemo(() => layers.find((l) => l.id === selectedId) ?? null, [layers, selectedId]);
  const layerCounts = useMemo(() => {
    const counts = { front: 0, back: 0, sleeveLeft: 0, sleeveRight: 0, neckInner: 0 } as Record<EditorArea, number>;
    layers.forEach((l) => { counts[l.area]++; });
    return counts;
  }, [layers]);

  // ---- Layer ops ----
  function addImageLayer(src: string, name: string) {
    const id = newLayerId();
    setLayers((ls) => [...ls, { id, type: "image", name, area, src, x: 50, y: 50, scale: 100, rotation: 0, visible: true }]);
    setSelectedId(id);
  }
  function addTextLayer(text: string) {
    const id = newLayerId();
    setLayers((ls) => [...ls, { id, type: "text", name: text.slice(0, 20) || "Text", area, text, x: 50, y: 50, scale: 100, rotation: 0, visible: true }]);
    setSelectedId(id);
  }
  function updateSelected(patch: Partial<EditorLayer>) {
    if (!selectedId) return;
    setLayers((ls) => ls.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  }
  function deleteLayer(id: string) {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }
  function toggleVisible(id: string) {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  }

  // ---- Upload ----
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => addImageLayer(e.target?.result as string, file.name);
    reader.readAsDataURL(file);
  }

  // ---- Tool actions ----
  function onTool(t: ToolId) {
    setTool(t);
    if (t === "upload") fileRef.current?.click();
  }

  // ---- Add to Cart ----
  // Uploads the first image layer to Cloudinary (reusing the existing helper),
  // builds a cart line with color/size/area + meta, then redirects to /cart.
  async function addToCart() {
    setAdding(true);
    const firstImage = layers.find((l) => l.type === "image" && l.src);
    const textLayers = layers.filter((l) => l.type === "text" && l.text?.trim());

    let designImageUrl: string | null = null;
    if (firstImage?.src) {
      try {
        const res = await uploadDesignImage(firstImage.src);
        designImageUrl = res.uploaded ? res.url : null;
      } catch {
        designImageUrl = null;
      }
    }

    const metaParts = [
      `Color ${COLORS.find((c) => c.id === color)?.label ?? color}`,
      firstImage ? "Custom image" : null,
      textLayers.length ? `Text: ${textLayers.map((t) => `“${t.text}”`).join(", ")}` : null,
      "Area: Front",
    ].filter(Boolean);

    addItem(
      {
        id: TSHIRT.id,
        name: TSHIRT.name,
        price: TSHIRT.price,
        image: TSHIRT.image,
        fallbackEmoji: TSHIRT.fallbackEmoji,
        size,
        meta: metaParts.join(" · "),
        designImage: firstImage?.src ?? null,
        designImageUrl,
        rotation: firstImage?.rotation ?? 0,
        designSize: firstImage?.scale ?? 100,
        position: "c",
        text: textLayers.map((t) => t.text).join(" ") || undefined,
      },
      1
    );
    setTimeout(() => router.push("/cart"), 700);
  }

  return (
    <>
      <Navbar active="products" />

      <EditorShell
        topBar={
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/catalog" className="btn-ghost !px-[0.9rem] !py-[0.45rem] !text-[0.82rem]">← Back to Catalog</Link>
              <button className="btn-ghost !px-[0.9rem] !py-[0.45rem] !text-[0.82rem]" title="Coming soon" disabled>Apply to all areas</button>
              <button className="btn-ghost !px-[0.9rem] !py-[0.45rem] !text-[0.82rem]" title="Coming soon" disabled>Save as template</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPreview((p) => !p)} className="btn-ghost !px-[1rem] !py-[0.5rem] !text-[0.82rem]">
                {preview ? "✎ Edit" : "👁 Preview"}
              </button>
              <button onClick={addToCart} disabled={adding} className="btn-primary !px-[1.2rem] !py-[0.55rem] !text-[0.86rem] disabled:opacity-100" style={adding ? { background: "linear-gradient(135deg,#08483B,#06382F)" } : undefined}>
                {adding ? "✓ Added" : "Add to Cart →"}
              </button>
            </div>
          </div>
        }
        toolRail={!preview ? <ToolRail active={tool} onSelect={onTool} /> : <div />}
        canvas={
          <>
            <TshirtCanvas
              area={area}
              color={color}
              layers={areaLayers}
              selectedId={selectedId}
              preview={preview}
              onSelectLayer={setSelectedId}
            />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </>
        }
        areaTabs={<ProductAreaTabs active={area} onSelect={setArea} layerCounts={layerCounts} />}
        rightPanel={
          preview ? (
            <div className="text-center py-6">
              <div className="text-[2rem]">👕</div>
              <p className="text-brand-muted text-[0.86rem] mt-2">Preview mode — editor handles hidden.</p>
              <button onClick={() => setPreview(false)} className="btn-ghost mt-4 !text-[0.84rem]">✎ Back to editing</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Variants */}
              <div>
                <div className="eyebrow mb-3">Variants</div>
                <VariantSelector color={color} size={size} onColor={setColor} onSize={setSize} />
              </div>

              {/* Quick add tools */}
              <div className="border-t border-brand-border pt-4">
                <div className="eyebrow mb-3">Add to {AREAS.find((a) => a.id === area)?.label}</div>
                <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full mb-2 !text-[0.84rem]">⬆️ Upload Image</button>
                <div className="flex gap-2">
                  <input className="input-premium flex-1 !py-[0.5rem] !text-[0.84rem]" placeholder="Add text…" value={textInput} maxLength={40} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && textInput.trim()) { addTextLayer(textInput.trim()); setTextInput(""); } }} />
                  <button onClick={() => { if (textInput.trim()) { addTextLayer(textInput.trim()); setTextInput(""); } }} className="btn-mini">Add</button>
                </div>
              </div>

              {/* Selected layer controls */}
              {selected && (
                <div className="border-t border-brand-border pt-4">
                  <div className="eyebrow mb-3">Selected Layer</div>
                  {selected.type === "text" && (
                    <div className="mb-3">
                      <label className="block text-[0.78rem] font-bold mb-1">Text</label>
                      <input className="input-premium !py-[0.5rem] !text-[0.84rem]" value={selected.text ?? ""} maxLength={40} onChange={(e) => updateSelected({ text: e.target.value, name: e.target.value.slice(0, 20) || "Text" })} />
                    </div>
                  )}
                  <SliderRow label="Design Size" value={selected.scale} min={40} max={200} suffix="%" onChange={(v) => updateSelected({ scale: v })} />
                  <SliderRow label="Rotation" value={selected.rotation} min={-180} max={180} suffix="°" onChange={(v) => updateSelected({ rotation: v })} />
                  <SliderRow label="Horizontal" value={selected.x} min={0} max={100} suffix="%" onChange={(v) => updateSelected({ x: v })} />
                  <SliderRow label="Vertical" value={selected.y} min={0} max={100} suffix="%" onChange={(v) => updateSelected({ y: v })} />
                  <button onClick={() => deleteLayer(selected.id)} className="btn-ghost w-full mt-2 !text-[0.84rem] !text-red-600 hover:!border-red-300">🗑 Delete Selected Layer</button>
                </div>
              )}

              {/* Layers list */}
              <div className="border-t border-brand-border pt-4">
                <div className="eyebrow mb-3">Layers</div>
                <LayersPanel
                  layers={areaLayers}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onToggleVisible={toggleVisible}
                  onDelete={deleteLayer}
                />
              </div>
            </div>
          )
        }
      />

      <Footer />
    </>
  );
}

function SliderRow({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-3">
      <label className="block text-[0.78rem] font-bold mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1 accent-brand-primary" aria-label={label} />
        <span className="min-w-[42px] text-right text-[0.78rem] font-bold text-brand-muted tabular-nums">{value}{suffix}</span>
      </div>
    </div>
  );
}
