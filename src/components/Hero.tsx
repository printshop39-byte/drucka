import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';

/* Slide 0 is the LCP image: it is the only one preloaded (see index.html) and
   the only one in the DOM on first paint. The remaining slides mount AFTER the
   hero image has loaded, so they never compete with LCP and never eager-load
   as hidden carousel slides. */
const HERO_SLIDES = [
  { src: '/images/hero/hero-1.webp', alt: 'Family admiring their framed photo wall at home — custom photo frames by Drucka' },
  { src: '/images/hero/hero-2.webp', alt: 'Luxury interior gallery wall of framed prints — Drucka photo framing' },
  { src: '/images/hero/hero-3.webp', alt: 'Premium photo printing studio craft — Drucka archival prints' },
  { src: '/images/hero/hero-4.webp', alt: 'Hands holding a fan of mini photo prints — Drucka prints & gifting' },
];
const ROTATE_MS = 5000;

/* Only claims Drucka can actually stand behind (see TRUST-CLAIMS in the audit). */
const TRUST_CHIPS = ['No minimum order', 'Preview before printing', 'Delivery across India'];

const Tick = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor"
    strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export default function Hero({ onUpload, whatsappUrl }: { onUpload?: () => void; whatsappUrl?: string }) {
  const [current, setCurrent] = useState(0);
  /* Which slides exist in the DOM. Starts as slide 0 only — the LCP image. */
  const [mountedCount, setMountedCount] = useState(1);
  const pausedRef = useRef(false);

  /* Bring the rest of the slider in only once the LCP image is done, and only
     if the visitor hasn't asked for reduced motion (then one still image is
     the whole experience — no reason to download three more). */
  const startSlider = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
    idle(() => setMountedCount(HERO_SLIDES.length));
  };

  useEffect(() => {
    if (mountedCount < HERO_SLIDES.length) return; // slider not armed yet
    const id = setInterval(() => {
      if (!pausedRef.current) setCurrent((c) => (c + 1) % HERO_SLIDES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [mountedCount]);

  const sliderReady = mountedCount === HERO_SLIDES.length;

  return (
    <section
      id="top"
      className="group relative flex min-h-[88svh] items-center overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <style>{`
        @keyframes heroKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        .hero-kb { animation: heroKenBurns 8s ease-out forwards; }
        /* Lighten animation on phones — no continuous Ken Burns repaint */
        @media (max-width: 640px) { .hero-kb { animation: none; } }
        @media (prefers-reduced-motion: reduce) { .hero-kb { animation: none; } }
      `}</style>

      <div className="absolute inset-0">
        {HERO_SLIDES.slice(0, mountedCount).map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={i === 0 ? slide.alt : ''}
            aria-hidden={i === 0 ? undefined : true}
            /* slide 0 is the preloaded LCP image; the rest only ever mount post-load */
            loading="eager"
            /* lowercase: React 18 does not recognise the camelCase
               `fetchPriority` prop and drops it before it reaches the DOM */
            {...{ fetchpriority: i === 0 ? 'high' : 'low' }}
            decoding="async"
            onLoad={i === 0 ? startSlider : undefined}
            className={`absolute inset-0 h-full w-full object-cover will-change-transform transition-opacity duration-[1300ms] ease-out
              ${i === current ? 'opacity-100 hero-kb' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/65 to-charcoal/35"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="text-sm font-bold text-gold-light">Starting at ₹19</span>
            <span className="text-white/40">·</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/80">No minimum order</span>
          </div>

          <h1 className="mb-5 font-serif text-4xl font-normal leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Your Memories.
            <span className="block italic text-gold-light">Beautifully Printed.</span>
          </h1>

          <p className="mb-2 max-w-xl text-lg font-light leading-relaxed text-white/90 sm:text-xl">
            Premium photo prints, frames and personalised gifts — printed in our Kolhapur studio.
          </p>
          <p className="mb-7 max-w-xl text-base leading-relaxed text-white/65" lang="mr">
            तुमचे फोटो, डिझाईन आणि आठवणी — आता प्रीमियम प्रिंट्समध्ये.
          </p>

          {/* Primary CTA first, WhatsApp clearly secondary */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-charcoal/20 transition hover:bg-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light"
            >
              Start Customising
              <ArrowRight size={18} />
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust chips */}
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
            {TRUST_CHIPS.map((chip) => (
              <li key={chip} className="flex items-center gap-2 text-sm font-medium text-white/85">
                <span className="text-gold-light"><Tick /></span>
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Slide indicators — 44px tap targets via padded hit area. Left-aligned
          on phones because the bottom-right corner is the WhatsApp FAB. */}
      {sliderReady && (
        <div className="absolute bottom-4 left-1 z-10 flex sm:left-auto sm:right-7">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Show slide ${i + 1} of ${HERO_SLIDES.length}`}
              aria-current={i === current}
              className="grid h-11 w-11 place-items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ${
                  i === current ? 'w-7 bg-gold' : 'w-2.5 bg-white/45'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
