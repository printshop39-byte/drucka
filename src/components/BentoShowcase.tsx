/* ── Bento Box product showcase (Apple-style, dark) ──
   A quick "everything you need" overview right under the hero.
   Pure presentation; cells link to existing sections / flows. */

interface Props {
  onMini?: () => void;
}

export default function BentoShowcase({ onMini }: Props) {
  return (
    <section style={{ background: '#0F0F0E', color: '#FAF9F7' }} className="py-20">
      <style>{`
        .bento-cell { transition: transform 0.3s ease, border-color 0.3s ease; cursor: pointer; }
        @media (hover: hover) and (pointer: fine) {
          .bento-cell:hover { transform: scale(1.02); border-color: rgba(201,168,76,0.4); }
        }
        .bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; grid-auto-rows: 160px; }
        .b1, .b2, .b5 { grid-column: span 2; }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 200px; }
          .b1 { grid-column: span 2; grid-row: span 2; }
          .b2 { grid-column: span 2; }
          .b3, .b4 { grid-column: span 1; }
          .b5 { grid-column: 1 / -1; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="uppercase" style={{ color: '#C9A84C', letterSpacing: '4px', fontSize: '10px', marginBottom: '12px' }}>
          Everything you need
        </p>
        <h2 className="font-display" style={{ fontWeight: 300, fontSize: 'clamp(28px,4vw,48px)', color: '#FAF9F7', marginBottom: '40px', lineHeight: 1.1 }}>
          One Studio. Every Memory.
        </h2>

        <div className="bento-grid">
          {/* CELL 1 — Custom Frames (large 2×2) */}
          <a href="#photo-frames"
            className="bento-cell b1 relative flex flex-col justify-end overflow-hidden"
            style={{ background: '#1A1208', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '28px' }}>
            <img src="/images/frames/premium-golden-live.jpg" alt="" aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.15 }} />
            <div className="relative">
              <span className="kd-mono" style={{ color: '#C9A84C', fontFamily: "'Courier New',monospace", fontSize: '10px', letterSpacing: '1px' }}>BESTSELLER</span>
              <h3 className="font-display" style={{ fontSize: '24px', color: '#FAF9F7', marginTop: '6px' }}>Custom Frames</h3>
              <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '6px', maxWidth: '22ch' }}>Gold, Black, Wood — built around your photo.</p>
              <span style={{ color: '#C9A84C', fontSize: '12px', marginTop: '14px', display: 'inline-block' }}>Explore →</span>
            </div>
          </a>

          {/* CELL 2 — Gallery Walls (wide 2×1) */}
          <a href="#gallery-walls"
            className="bento-cell b2 relative flex flex-col justify-between"
            style={{ background: '#C9A84C', borderRadius: '8px', padding: '24px', border: '0.5px solid transparent' }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px', letterSpacing: '1px' }}>MOST POPULAR</span>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-display" style={{ fontSize: '20px', color: '#1a1208' }}>Gallery Walls</h3>
                <p style={{ fontFamily: "'Courier New',monospace", fontSize: '14px', color: '#1a1208', marginTop: '4px' }}>From ₹4,299</p>
              </div>
              <span className="font-display" style={{ fontSize: '34px', color: '#1a1208', lineHeight: 1 }}>→</span>
            </div>
          </a>

          {/* CELL 3 — Mini Prints (1×1) */}
          <button type="button" onClick={onMini}
            className="bento-cell b3 relative flex flex-col justify-between text-left"
            style={{ background: '#1A1208', border: '0.5px solid #333', borderRadius: '8px', padding: '20px' }}>
            <span style={{ fontSize: '24px' }}>🖨️</span>
            <div>
              <h3 className="font-display" style={{ fontSize: '14px', color: '#FAF9F7' }}>Mini Prints</h3>
              <p style={{ color: '#C9A84C', fontFamily: "'Courier New',monospace", fontSize: '12px', marginTop: '2px' }}>From ₹19</p>
            </div>
          </button>

          {/* CELL 4 — Phone Cases (1×1) */}
          <a href="#phone-cases"
            className="bento-cell b4 relative flex flex-col justify-between"
            style={{ background: '#2A2010', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '8px', padding: '20px' }}>
            <span style={{ fontSize: '24px' }}>📱</span>
            <div>
              <h3 className="font-display" style={{ fontSize: '14px', color: '#FAF9F7' }}>Phone Cases</h3>
              <p style={{ color: '#C9A84C', fontFamily: "'Courier New',monospace", fontSize: '12px', marginTop: '2px' }}>From ₹299</p>
            </div>
          </a>

          {/* CELL 5 — Magnetic Walls (wide, full bottom row) */}
          <a href="#gallery-walls"
            className="bento-cell b5 relative flex flex-col justify-center"
            style={{ background: '#141414', border: '0.5px solid #222', borderRadius: '8px', padding: '24px' }}>
            <span style={{ background: '#C9A84C', color: '#fff', fontSize: '9px', padding: '2px 8px', borderRadius: '3px', alignSelf: 'flex-start', letterSpacing: '1px' }}>NEW</span>
            <h3 className="font-display" style={{ fontSize: '18px', color: '#FAF9F7', marginTop: '10px' }}>Magnetic Walls</h3>
            <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>No nails. No damage.</p>
          </a>
        </div>
      </div>
    </section>
  );
}
