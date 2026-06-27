/* ── Bento Box product showcase (Apple-style, dark) ──
   A quick "everything you need" overview right under the hero.
   Pure presentation; cells are anchors to existing sections. */

export default function BentoShowcase() {
  return (
    <section style={{ background: '#0F0F0E', color: '#FAF9F7' }} className="py-20">
      <style>{`
        .bento-cell { transition: transform 0.18s ease, border-color 0.3s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        @media (hover: hover) and (pointer: fine) {
          .bento-cell:hover { transform: scale(1.02); border-color: rgba(201,168,76,0.4); }
        }
        /* tap feedback on touch devices — premium press-in bounce */
        .bento-cell:active { transform: scale(0.96); }
        .bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; grid-auto-rows: 160px; }
        .b1, .b2 { grid-column: span 2; }
        @media (min-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 200px; }
          .b1 { grid-column: span 2; grid-row: span 2; }
          .b2 { grid-column: span 2; }
          .b3, .b4 { grid-column: span 1; }
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
            style={{ background: '#1A1208', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '28px' }}>
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
            style={{ background: '#C9A84C', borderRadius: '14px', padding: '24px', border: '0.5px solid transparent' }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px', letterSpacing: '1px' }}>MOST POPULAR</span>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-display" style={{ fontSize: '20px', color: '#1a1208' }}>Gallery Walls</h3>
                <p style={{ fontFamily: "'Courier New',monospace", fontSize: '15px', fontWeight: 700, color: '#1a1208', marginTop: '4px' }}>From ₹4,299</p>
              </div>
              <span className="font-display" style={{ fontSize: '34px', color: '#1a1208', lineHeight: 1 }}>→</span>
            </div>
          </a>

          {/* CELL 3 — Mini Prints (1×1) — scrolls to the Mini Photo Prints
              showcase section; its CTA then opens the editor */}
          <a href="#mini-prints"
            className="bento-cell b3 relative flex flex-col justify-between text-left"
            style={{ background: '#1A1208', border: '0.5px solid #333', borderRadius: '14px', padding: '20px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E3C887" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9V3h12v6" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            <div>
              <h3 className="font-display" style={{ fontSize: '14px', color: '#FAF9F7' }}>Mini Prints</h3>
              <p style={{ color: '#E3C887', fontFamily: "'Courier New',monospace", fontSize: '13px', fontWeight: 700, marginTop: '3px' }}>From ₹19</p>
            </div>
          </a>

          {/* CELL 4 — Phone Cases (1×1) */}
          <a href="#phone-cases"
            className="bento-cell b4 relative flex flex-col justify-between"
            style={{ background: '#2A2010', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '14px', padding: '20px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E3C887" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2.5" />
              <path d="M12 18h.01" />
            </svg>
            <div>
              <h3 className="font-display" style={{ fontSize: '14px', color: '#FAF9F7' }}>Phone Cases</h3>
              <p style={{ color: '#E3C887', fontFamily: "'Courier New',monospace", fontSize: '13px', fontWeight: 700, marginTop: '3px' }}>From ₹299</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
