import MockImage from "./MockImage";

// A premium product mockup collage for the hero — three product cards with
// small "design" accents on top. Uses existing product images with emoji
// fallback. Purely presentational, no client state (hydration-safe).
const TILES = [
  { src: "/assets/tshirt-mockup.png", emoji: "👕", label: "T-Shirt", grad: "from-brand-mint to-white", accent: "❤️" },
  { src: "/assets/mug-mockup.png", emoji: "☕", label: "Photo Mug", grad: "from-brand-goldSoft to-white", accent: "📷" },
  { src: "/assets/frame-mockup.png", emoji: "🖼️", label: "Framed Print", grad: "from-brand-mint to-white", accent: "🎨" },
];

export default function HeroMockupCollage() {
  return (
    <div className="relative bg-white/85 border border-brand-border rounded-premium shadow-premium backdrop-blur p-5">
      <div className="bg-brand-mint rounded-2xl p-5">
        <div className="grid grid-cols-3 gap-3">
          {TILES.map((t) => (
            <div
              key={t.label}
              className="relative bg-white border border-brand-border rounded-[16px] p-3 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-premium hover:border-brand-gold/45"
            >
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-goldSoft border border-brand-gold/40 flex items-center justify-center text-[0.8rem] shadow-soft" aria-hidden>
                {t.accent}
              </span>
              <div className={`h-[96px] max-[420px]:h-[72px] rounded-[10px] overflow-hidden flex items-center justify-center mb-2 bg-gradient-to-br ${t.grad}`}>
                <MockImage
                  src={t.src}
                  alt={t.label}
                  emoji={t.emoji}
                  className="w-full h-full object-contain p-2"
                  emojiClassName="text-[2.4rem]"
                />
              </div>
              <p className="text-[0.78rem] font-bold text-brand-ink">{t.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white border border-brand-border rounded-[12px] p-[12px_14px] flex items-center justify-between">
          <span className="text-[0.85rem] font-bold text-brand-ink">Live mockup preview</span>
          <span className="badge badge-green">Ready to customize</span>
        </div>
      </div>

      {/* floating stat chips */}
      <div className="absolute -bottom-4 -left-3 bg-white border border-brand-border rounded-[14px] shadow-premium px-4 py-2 hidden min-[420px]:block">
        <div className="font-heading text-[1.1rem] font-extrabold text-brand-primary leading-none">4.9★</div>
        <div className="text-[0.68rem] text-brand-muted">Avg rating</div>
      </div>
      <div className="absolute -top-4 -right-3 bg-white border border-brand-border rounded-[14px] shadow-premium px-4 py-2 hidden min-[420px]:block">
        <div className="font-heading text-[1.1rem] font-extrabold text-brand-primary leading-none">50k+</div>
        <div className="text-[0.68rem] text-brand-muted">Gifts delivered</div>
      </div>
    </div>
  );
}
