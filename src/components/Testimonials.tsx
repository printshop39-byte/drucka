import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    text: 'The Drucka team has a perfect blend of knowledge and care in printing and framing. Their attention to detail on every order makes them my go-to print studio.',
    author: 'Rohan Kulkarni',
    title: 'Photographer',
    rating: 5,
  },
  {
    text: 'It was a really good experience. Their frames are good quality and worth every penny. I plan to get more done from them in the coming months.',
    author: 'Priti Noronha',
    title: 'Customer',
    rating: 5,
  },
  {
    text: 'A frame for every piece of art. A rich collection of frames and personal guidance for selecting one makes ordering truly worthwhile and satisfying.',
    author: 'Shailesh Veera',
    title: 'Architect',
    rating: 5,
  },
  {
    text: 'I am a photographer, and frames are very precious to us. What better place to print and frame your pictures? Great work!',
    author: 'Javal Darjee',
    title: 'Photographer',
    rating: 5,
  },
  {
    text: 'Absolutely stunning and professional work. We keep coming back to frame our cherished memories and preserve them forever. Highly recommended.',
    author: 'Manasi Parekh',
    title: 'Customer',
    rating: 5,
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            What People Say
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Trusted by Thousands
          </h2>
        </div>

        <div className="relative">
          <div className="bg-cream rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
            <Quote size={40} className="mx-auto text-gold/30 mb-6" />
            <p className="text-lg sm:text-xl text-charcoal/80 leading-relaxed mb-8 font-serif italic max-w-2xl mx-auto">
              "{testimonials[current].text}"
            </p>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(testimonials[current].rating)].map((_, i) => (
                <span key={i} className="text-gold text-lg">★</span>
              ))}
            </div>
            <h4 className="font-semibold text-charcoal text-lg">{testimonials[current].author}</h4>
            <p className="text-sm text-charcoal/50 uppercase tracking-wide mt-1">{testimonials[current].title}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 border border-charcoal/20 hover:border-charcoal rounded-full flex items-center justify-center transition-colors"
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
              className="w-10 h-10 border border-charcoal/20 hover:border-charcoal rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
