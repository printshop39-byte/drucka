import { useState } from 'react';
import Lightbox, { LightboxItem } from './Lightbox';

const statements = [
  { name: 'Oslo', image: '/images/statement/oslo.jpg' },
  { name: 'Portland', image: '/images/statement/portland.jpg' },
  { name: 'Fuji', image: '/images/statement/fuji.jpg' },
  { name: 'Naples', image: '/images/statement/naples.jpg' },
  { name: 'Shibuya', image: '/images/statement/shibuya.jpg' },
  { name: 'Monaco', image: '/images/statement/monaco.jpg' },
  { name: 'Burano', image: '/images/statement/burano.jpg' },
  { name: 'Sariska', image: '/images/statement/sariska.jpg' },
];

export default function StatementCollection() {
  const [active, setActive] = useState<number | null>(null);
  const item: LightboxItem | null = active !== null ? {
    image: statements[active].image,
    title: statements[active].name,
    subtitle: 'Statement frame · museum-quality giclée print',
    waMessage: `Hi Drucka! I'd like to know more about the ${statements[active].name} statement frame.`,
  } : null;

  return (
    <section id="statement" className="py-20 lg:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            Crafted to Perfection
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            The Statement Collection
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {statements.map((s, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className="group cursor-pointer text-left"
              aria-label={`View ${s.name}`}
            >
              <div className="relative aspect-square bg-warm rounded-lg overflow-hidden mb-3">
                <img
                  src={s.image}
                  alt={`${s.name} — statement photo frame & wall art online | Drucka`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white font-serif text-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    View
                  </span>
                </div>
              </div>
              <h3 className="font-serif font-semibold text-charcoal text-center">{s.name}</h3>
            </button>
          ))}
        </div>
      </div>

      <Lightbox item={item} onClose={() => setActive(null)} />
    </section>
  );
}
