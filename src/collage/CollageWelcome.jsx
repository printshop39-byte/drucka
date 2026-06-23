import { LAYOUTS, OCCASIONS } from "./collageData";
import { LayoutGrid, Wand2, Crown, ArrowRight, X } from "lucide-react";

/* ── Collage Maker welcome / start screen ──
   First thing a new user sees: a looping animated demo of the tools,
   ready-made templates, and a clear choice between the Simple (Grid)
   and Advanced (Pro) editors. Light theme, matches the storefront. */

/* a small self-contained ~5s CSS demo: photos drop into a 2×2 grid,
   a gold frame draws in, then a caption — then it loops. */
function ToolsDemo() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px] select-none">
      <style>{`
        @keyframes druDrop { 0%{opacity:0;transform:translateY(-18px) scale(.8)} 12%,70%{opacity:1;transform:none} 82%,100%{opacity:0;transform:scale(.96)} }
        @keyframes druFrame { 0%,30%{opacity:0} 42%,70%{opacity:1} 82%,100%{opacity:0} }
        @keyframes druCap { 0%,52%{opacity:0;transform:translateY(8px)} 62%,72%{opacity:1;transform:none} 82%,100%{opacity:0} }
        @keyframes druFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .dru-cell{animation:druDrop 5s ease-in-out infinite}
        .dru-frame{animation:druFrame 5s ease-in-out infinite}
        .dru-cap{animation:druCap 5s ease-in-out infinite}
      `}</style>
      <div className="absolute inset-0 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5" style={{ animation: "druFloat 5s ease-in-out infinite" }}>
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2">
          {[
            "linear-gradient(135deg,#f6c177,#e0843a)",
            "linear-gradient(135deg,#8fb8de,#3f6fa3)",
            "linear-gradient(135deg,#c9a8e6,#7c3aed)",
            "linear-gradient(135deg,#9bd6b4,#2f8f5b)",
          ].map((bg, i) => (
            <div key={i} className="dru-cell rounded-lg" style={{ background: bg, animationDelay: `${i * 0.35}s` }} />
          ))}
        </div>
        {/* gold frame draw-in */}
        <div className="dru-frame pointer-events-none absolute inset-2 rounded-lg" style={{ boxShadow: "inset 0 0 0 4px #c19a3d" }} />
        {/* caption chip */}
        <div className="dru-cap absolute inset-x-0 bottom-3 flex justify-center">
          <span className="rounded-full bg-charcoal/85 px-3 py-1 font-serif text-[11px] font-semibold text-white">Happy Birthday ✦</span>
        </div>
      </div>
    </div>
  );
}

export default function CollageWelcome({ onClose, onStartGrid, onStartPro }) {
  const templates = OCCASIONS.slice(0, 6);
  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-[#eceef1] text-charcoal" role="dialog" aria-modal="true" aria-label="Collage Maker">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-black/10 bg-white/95 px-4 backdrop-blur">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-gold to-tangerine text-sm font-black text-white">D</span>
        <p className="text-sm font-bold">Drucka Collage Maker</p>
        <button onClick={onClose} aria-label="Close" className="ml-auto grid h-9 w-9 place-items-center rounded-full text-charcoal/55 hover:bg-black/5 hover:text-charcoal">
          <X size={18} />
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* hero: copy + animated demo */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Make it in minutes</span>
            <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-charcoal sm:text-4xl">
              Turn your photos into a print-ready collage
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-charcoal/60">
              Pick a layout, drop in your photos, add frames, text &amp; effects — then download or order a print delivered across India.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => onStartGrid()}
                className="inline-flex items-center gap-2 rounded-full bg-tangerine px-6 py-3 text-sm font-bold text-white shadow-lg shadow-tangerine/25 transition hover:brightness-110">
                Start a collage <ArrowRight size={16} />
              </button>
              <button onClick={() => onStartGrid()}
                className="inline-flex items-center gap-2 rounded-full border-2 border-black/15 px-6 py-3 text-sm font-bold text-charcoal transition hover:border-charcoal">
                Start blank
              </button>
            </div>
          </div>
          <ToolsDemo />
        </div>

        {/* templates */}
        <div className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-charcoal">Start from a template</h2>
              <p className="text-xs text-charcoal/50">Tap one — we'll set the layout &amp; style, you add the photos.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {templates.map((o) => {
              const layout = LAYOUTS.find((l) => l.id === o.layout) ?? LAYOUTS[5];
              return (
                <button key={o.id} onClick={() => onStartGrid({ occasion: o.id })}
                  className="group overflow-hidden rounded-xl border border-black/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-tangerine hover:shadow-lg">
                  <span className="relative block" style={{ aspectRatio: "1", backgroundColor: o.bg }}>
                    {layout.cells.map((c, i) => (
                      <span key={i} className="absolute rounded-[2px] bg-black/15"
                        style={{ left: `${c.x * 100 + 6}%`, top: `${c.y * 100 + 6}%`, width: `${c.w * 100 - 12}%`, height: `${c.h * 100 - 12}%` }} />
                    ))}
                  </span>
                  <span className="block px-2.5 py-2 text-[11px] font-bold text-charcoal/80">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* editor choice */}
        <div className="mt-12">
          <h2 className="mb-4 font-serif text-xl font-bold text-charcoal">Or choose your editor</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button onClick={() => onStartGrid()}
              className="group rounded-2xl border-2 border-black/10 bg-white p-5 text-left transition hover:border-tangerine hover:shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-tangerine/10 text-tangerine"><LayoutGrid size={20} /></span>
                <div>
                  <p className="text-sm font-bold text-charcoal">Grid Editor <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">Easy</span></p>
                  <p className="text-[11px] text-charcoal/50">Best for quick collages</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-charcoal/60">
                Fixed grid layouts, drag photos into cells, pan/zoom, spacing, frames, text &amp; one-tap print order.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-tangerine">Open Grid Editor <ArrowRight size={13} /></span>
            </button>

            <button onClick={() => onStartPro()}
              className="group rounded-2xl border-2 border-black/10 bg-white p-5 text-left transition hover:border-gold hover:shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold"><Wand2 size={20} /></span>
                <div>
                  <p className="flex items-center gap-1 text-sm font-bold text-charcoal">Pro Editor <Crown size={12} className="text-gold" /></p>
                  <p className="text-[11px] text-charcoal/50">Freeform, full control</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-charcoal/60">
                Place photos anywhere, shape-crop, decorative frames, tint, blend, shadows, replace image &amp; draw.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-dark">Open Pro Editor <ArrowRight size={13} /></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
