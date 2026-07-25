import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, ExternalLink } from 'lucide-react';

/* ⚠ SOCIAL PROOF — VERIFICATION GATE ────────────────────────────────
   These three testimonials are named individuals with photos and 5-star
   ratings. Their authenticity could not be verified from the codebase, and
   unverifiable endorsements are a real exposure under India's consumer
   protection rules on misleading advertising.

   So this section now FAILS SAFE: a testimonial renders only if it carries
   a `sourceUrl` pointing at the publicly checkable review (Google Business
   review permalink, Instagram post, etc.). With no proof URLs the whole
   section renders nothing rather than making an unbacked claim.

   TO PUT THEM BACK: paste the review permalink into `sourceUrl`. Each one
   restored gets a "Verified review" link out to the source.
   If a testimonial is not real, delete its entry outright.              */
const testimonials: Array<{
  text: string; author: string; title: string; image: string; rating: number; sourceUrl: string | null;
}> = [
  {
    text: 'A frame for every piece of art. Drucka\'s rich collection and personal guidance make choosing the right one genuinely satisfying — every project leaves my studio looking complete.',
    author: 'Amit Deshpande',
    title: 'Architect',
    image: '/images/testimonials/amit.webp',
    rating: 5,
    sourceUrl: null, // ← paste the public review permalink here to publish this one
  },
  {
    text: 'I specify Drucka for every home I style. The print clarity and frame finish elevate a space instantly, and my clients always ask where the art came from.',
    author: 'Priya Sharma',
    title: 'Interior Designer',
    image: '/images/testimonials/priya.webp',
    rating: 5,
    sourceUrl: null, // ← paste the public review permalink here to publish this one
  },
  {
    text: 'I framed my family\'s favourite memories with Drucka and they turned out beautifully. Gorgeous quality, caring service, and prints that feel like they\'ll last forever.',
    author: 'Sneha Iyer',
    title: 'Teacher',
    image: '/images/testimonials/sneha.webp',
    rating: 5,
    sourceUrl: null, // ← paste the public review permalink here to publish this one
  },
];

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
