import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

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
      {/* Rotating slider background */}
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover will-change-transform transition-[opacity,transform] duration-[1300ms] ease-out
              ${i === current ? 'opacity-100' : 'opacity-0'}
              ${i === current ? 'group-hover:scale-[1.08]' : ''}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/60 to-charcoal/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-2xl">
          <p className="text-gold font-medium tracking-[0.3em] uppercase text-sm mb-6 animate-fade-in">
            Museum Quality & Sustainable
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
            Frame Your
            <span className="block text-gold-light italic"> Precious</span>
            Memories
          </h1>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
            India's finest online photo printing & framing company. Handcrafted with 100% solid wood, metal & archival materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#photo-frames"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold hover:bg-gold-dark text-white font-semibold tracking-wide text-sm uppercase transition-all duration-300 rounded-sm"
            >
              Start Framing
              <ArrowRight size={18} />
            </a>
            <a
              href="#statement"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 hover:border-white/60 text-white font-medium tracking-wide text-sm uppercase transition-all duration-300 rounded-sm"
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

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/30 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
