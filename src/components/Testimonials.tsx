import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    text: 'A frame for every piece of art. Drucka\'s rich collection and personal guidance make choosing the right one genuinely satisfying — every project leaves my studio looking complete.',
    author: 'Amit Deshpande',
    title: 'Architect',
    image: '/images/testimonials/amit.webp',
    rating: 5,
  },
  {
    text: 'I specify Drucka for every home I style. The print clarity and frame finish elevate a space instantly, and my clients always ask where the art came from.',
    author: 'Priya Sharma',
    title: 'Interior Designer',
    image: '/images/testimonials/priya.webp',
    rating: 5,
  },
  {
    text: 'I framed my family\'s favourite memories with Drucka and they turned out beautifully. Gorgeous quality, caring service, and prints that feel like they\'ll last forever.',
    author: 'Sneha Iyer',
    title: 'Teacher',
    image: '/images/testimonials/sneha.webp',
    rating: 5,
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  const active = testimonials[current];

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Framed gallery-wall background */}
      <div className="absolute inset-0">
        <img
          src="/images/gallery/grand-gallery.jpg"
          alt=""
          aria-hidden="true"
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Trusted by Thousands
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
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? 'bg-gold w-6' : 'bg-charcoal/20'
                  }`}
                />
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
