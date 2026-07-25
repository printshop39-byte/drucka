import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, ExternalLink } from 'lucide-react';

/* ── SOCIAL PROOF ─────────────────────────────────────────────────────
   EMPTY ON PURPOSE. Three testimonials used to live here — named people
   ("Amit Deshpande, Architect" etc.) with portraits and 5-star ratings.
   Drucka confirmed on 2026-07-25 that they were NOT real customers, so
   they were deleted outright rather than left hidden. Their portrait
   images moved to assets-src/images/testimonials/ (they are stock photos
   of people who never bought anything and must not go back on the site).

   Publishing invented endorsements is misleading advertising under the
   Consumer Protection Act 2019 and the CCPA's 2022 guidelines on
   endorsements, so this section stays empty until there is real proof.

   TO ADD A REAL ONE: append an entry below. It renders ONLY with a
   `sourceUrl` pointing at a publicly checkable review — a Google Business
   review permalink or an Instagram post — which is surfaced to visitors as
   a "Verified review" link. No proof, no render, and with an empty list
   the whole section disappears from the homepage on its own.          */
const testimonials: Array<{
  text: string; author: string; title: string; image: string; rating: number; sourceUrl: string | null;
}> = [];

/* Only testimonials backed by a public, checkable source are publishable. */
const VERIFIED = testimonials.filter((t) => t.sourceUrl);

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % VERIFIED.length);
  const prev = () => setCurrent((prev) => (prev - 1 + VERIFIED.length) % VERIFIED.length);

  // No proof supplied yet → publish nothing rather than an unbacked claim.
  if (VERIFIED.length === 0) return null;

  const active = VERIFIED[Math.min(current, VERIFIED.length - 1)];

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Framed gallery-wall background */}
      <div className="absolute inset-0">
        <img
          src="/images/gallery/grand-gallery.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/30 to-white" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            What People Say
          </span>
          {/* was "Trusted by Thousands" — an unsubstantiated numeric claim,
              retired along with TrustBar's "10,000+ Happy Customers" */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            In Their Words
          </h2>
        </div>

        <div className="relative">
          <div className="bg-white/80 backdrop-blur-md border border-charcoal/5 shadow-xl rounded-2xl px-8 pt-20 pb-10 sm:px-12 sm:pt-20 sm:pb-12 text-center">
            {/* Framed avatar */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-12">
              <div className="p-1.5 bg-white rounded-full shadow-lg ring-1 ring-gold/40">
                <img
                  src={active.image}
                  alt={active.author}
                  className="w-24 h-24 rounded-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            <Quote size={36} className="mx-auto text-gold/30 mb-6" />
            <p className="text-lg sm:text-xl text-charcoal/80 leading-relaxed mb-8 font-serif italic max-w-2xl mx-auto">
              "{active.text}"
            </p>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(active.rating)].map((_, i) => (
                <span key={i} className="text-gold text-lg">★</span>
              ))}
            </div>
            <h4 className="font-semibold text-charcoal text-lg">{active.author}</h4>
            <p className="text-sm text-charcoal/50 uppercase tracking-wide mt-1">{active.title}</p>
            <a
              href={active.sourceUrl!}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-dark underline-offset-4 hover:underline"
            >
              Verified review
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 bg-white/70 border border-charcoal/20 hover:border-charcoal rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {/* 8px dots were the smallest tap target on the page — the visible
                dot stays small, the hit area is a full 44x44 grid cell */}
            <div className="flex">
              {VERIFIED.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  aria-current={i === current}
                  className="grid h-11 w-11 place-items-center"
                >
                  <span
                    className={`block h-2 rounded-full transition-all ${
                      i === current ? 'w-6 bg-gold' : 'w-2 bg-charcoal/20'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-10 h-10 bg-white/70 border border-charcoal/20 hover:border-charcoal rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
