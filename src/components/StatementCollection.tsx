import { useEffect, useRef, useState } from 'react';
import Lightbox, { LightboxItem } from './Lightbox';

/* NOTE: prices below are placeholders for the kinetic restyle — confirm/replace. */
const statements = [
  { name: 'Oslo', image: '/images/statement/oslo.jpg', price: '₹2,999', limited: true },
  { name: 'Portland', image: '/images/statement/portland.jpg', price: '₹2,499' },
  { name: 'Fuji', image: '/images/statement/fuji.jpg', price: '₹3,499' },
  { name: 'Naples', image: '/images/statement/naples.jpg', price: '₹2,799' },
  { name: 'Shibuya', image: '/images/statement/shibuya.jpg', price: '₹3,999', limited: true },
  { name: 'Monaco', image: '/images/statement/monaco.jpg', price: '₹3,299' },
  { name: 'Burano', image: '/images/statement/burano.jpg', price: '₹2,699' },
  { name: 'Sariska', image: '/images/statement/sariska.jpg', price: '₹3,199' },
];

const HEADING = 'The Masterpiece Collection';

export default function StatementCollection({ onTryMini }: { onTryMini?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const item: LightboxItem | null = active !== null ? {
    image: statements[active].image,
    title: statements[active].name,
    subtitle: 'Statement frame · museum-quality HD print',
    price: statements[active].price,
    waMessage: `Hi Drucka! I'd like to know more about the ${statements[active].name} statement frame (${statements[active].price}).`,
  } : null;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="statement" className="py-20 lg:py-28 bg-cream">
      <style>{`
        @keyframes stFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes stClip { to { clip-path: inset(0 0 0 0); } }
        .st-label { letter-spacing: 2px; color: #C9A84C; transition: letter-spacing 1.2s ease; }
        .st-on .st-label { letter-spacing: 5px; }
        .st-word { display: inline-block; opacity: 0; transform: translateY(18px); }
        .st-on .st-word { animation: stFadeUp 0.5s ease forwards; }
        .st-desc { clip-path: inset(0 100% 0 0); }
        .st-on .st-desc { animation: stClip 0.8s ease forwards; }
        .st-card { transition: transform 0.4s cubic-bezier(0.23,1,0.32,1); border-bottom: 2px solid transparent; }
        .st-card-img { transition: transform 0.4s cubic-bezier(0.23,1,0.32,1); }
        .st-cta { border: 1.5px solid #C9A84C; color: #C9A84C; transition: all 0.3s ease; }
        .st-cta .st-arrow { transition: transform 0.3s ease; }
        @media (hover: hover) and (pointer: fine) {
          .st-card { cursor: pointer; }
          .st-card:hover { transform: translateY(-8px); border-bottom-color: #C9A84C; }
          .st-card:hover .st-card-img { transform: scale(1.05); }
          .st-cta:hover { background: #C9A84C; color: #fff; }
          .st-cta:hover .st-arrow { transform: translateX(4px); }
        }
        @media (max-width: 640px), (prefers-reduced-motion: reduce) {
          .st-word { opacity: 1 !important; transform: none !important; animation: none !important; }
          .st-desc { clip-path: none !important; animation: none !important; }
          .st-label { letter-spacing: 3px !important; transition: none !important; }
        }
      `}</style>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${visible ? 'st-on' : ''}`}>
        <div className="text-center mb-14">
          <span className="st-label font-medium uppercase text-xs block mb-3">
            Crafted to Perfection
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-charcoal">
            {HEADING.split(' ').map((word, i) => (
              <span key={i} className="st-word" style={{ animationDelay: `${i * 0.1}s` }}>
                {word}{i < HEADING.split(' ').length - 1 ? ' ' : ''}
              </span>
            ))}
          </h2>
          <p className="st-desc mx-auto mt-4 max-w-xl text-charcoal/55">
            Museum-quality HD-printed frames, crafted for the walls that tell your story.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {statements.map((s, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className="st-card group text-left"
              aria-label={`View ${s.name}`}
            >
              <div className="relative aspect-square bg-warm rounded-lg overflow-hidden mb-3">
                <img
                  src={s.image}
                  alt={`${s.name} — statement photo frame & wall art online | Drucka`}
                  loading="lazy"
                  decoding="async"
                  className="st-card-img w-full h-full object-cover"
                />
                {s.limited && (
                  <span
                    className="absolute top-3 left-3 rounded-sm font-bold uppercase"
                    style={{ background: '#1a1208', color: '#C9A84C', fontSize: '10px', padding: '3px 8px', letterSpacing: '1.5px' }}
                  >
                    Limited Edition
                  </span>
                )}
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white font-serif text-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    View
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-semibold text-charcoal">{s.name}</h3>
                <span className="font-serif font-semibold text-sm" style={{ color: '#C9A84C' }}>{s.price}</span>
              </div>
            </button>
          ))}
        </div>

        {onTryMini && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={onTryMini}
              className="st-cta inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-wide"
            >
              Try it now
              <span className="st-arrow">→</span>
            </button>
            <p className="mt-3 text-xs text-charcoal/50">Design your own print in seconds — opens the Mini Print editor</p>
          </div>
        )}
      </div>

      <Lightbox item={item} onClose={() => setActive(null)} />
    </section>
  );
}
