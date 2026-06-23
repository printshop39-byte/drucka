import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

const HERO_SLIDES = [
  { src: '/images/hero/hero-1.jpg', alt: 'Family admiring their framed photo wall at home — custom photo frames by Drucka' },
  { src: '/images/hero/hero-2.jpg', alt: 'Luxury interior gallery wall of framed prints — Drucka photo framing' },
  { src: '/images/hero/hero-3.jpg', alt: 'Premium photo printing studio craft — Drucka archival prints' },
  { src: '/images/hero/hero-4.jpg', alt: 'Hands holding a fan of mini photo prints — Drucka prints & gifting' },
];
const ROTATE_MS = 5000;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) setCurrent((c) => (c + 1) % HERO_SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="group relative min-h-screen flex items-center overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <style>{`
        @keyframes heroKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        @keyframes heroBounce { 0%, 100% { transform: translateY(0); opacity: 0.55; } 50% { transform: translateY(6px); opacity: 1; } }
        .hero-kb { animation: heroKenBurns 8s ease-out forwards; }
        .hero-bounce { animation: heroBounce 1.8s ease-in-out infinite; }
        .hero-cta-gold { background: #C9A84C; transition: background 0.3s ease; }
        .hero-cta-gold:hover { background: #a8863a; }
        .hero-cta-gold svg { transition: transform 0.3s ease; }
        .hero-cta-gold:hover svg { transform: translateX(4px); }
        @media (prefers-reduced-motion: reduce) {
          .hero-kb, .hero-bounce { animation: none; }
        }
      `}</style>

      {/* Rotating slider background — active slide gets a slow Ken Burns zoom */}
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover will-change-transform transition-opacity duration-[1300ms] ease-out
              ${i === current ? 'opacity-100 hero-kb' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/60 to-charcoal/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-2xl">
          <p
            className="font-medium uppercase text-sm mb-6 animate-fade-in"
            style={{ color: '#C9A84C', letterSpacing: '3px' }}
          >
            Museum Quality &amp; Sustainable
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-normal text-white leading-tight mb-6">
            Frame Your
            <span className="block italic" style={{ color: '#C9A84C' }}> Precious</span>
            Memories
          </h1>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
            India's finest online photo printing &amp; framing company. Handcrafted with 100% solid wood, metal &amp; archival materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#photo-frames"
              className="hero-cta-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold tracking-wide text-sm uppercase rounded-sm"
            >
              Start Framing
              <ArrowRight size={18} />
            </a>
            <a
              href="#statement"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-[1.5px] border-white/70 hover:border-white text-white font-medium tracking-wide text-sm uppercase transition-colors duration-300 rounded-sm"
            >
              Explore Collection
            </a>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-6 sm:right-10 z-10 flex gap-2.5">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current ? 'w-8 bg-gold' : 'w-3 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator — animated bounce arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-1.5 text-white/55">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown size={18} className="hero-bounce" />
        </div>
      </div>
    </section>
  );
}
