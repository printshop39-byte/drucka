import { useState } from 'react';
import Lightbox, { LightboxItem } from './Lightbox';

const phoneCases = [
  { name: 'Photo Collage Case', image: '/images/phonecases/case-1.jpg', desc: 'Your favourite photos in one custom collage case' },
  { name: 'Polaroid Memory Case', image: '/images/phonecases/case-2.jpg', desc: 'Cherished moments styled like keepsake polaroids' },
  { name: 'Custom Design Cases', image: '/images/phonecases/case-3.jpg', desc: 'Add names, dates & your own photos — fully personalised' },
];

export default function PhoneCases() {
  const [active, setActive] = useState<number | null>(null);
  const lbItem: LightboxItem | null = active !== null ? {
    image: phoneCases[active].image,
    title: phoneCases[active].name,
    subtitle: phoneCases[active].desc,
    waMessage: `Hi Drucka! I'm interested in a Custom Photo Phone Case (${phoneCases[active].name}).`,
  } : null;

  return (
    <section id="phone-cases" className="py-20 lg:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            A Gift They'll Carry Everywhere
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Custom Photo Phone Cases
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">
            Turn your favourite memories into a personalised phone case — the perfect thoughtful gift.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {phoneCases.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View ${item.name}`}
              className="group cursor-pointer text-left"
            >
              <div className="relative aspect-square bg-warm rounded-lg overflow-hidden mb-4">
                <img
                  src={item.image}
                  alt={`${item.name} — custom photo phone case gift | Drucka`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/25 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white font-serif text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    View
                  </span>
                </div>
              </div>
              <h3 className="font-serif font-semibold text-lg text-charcoal">{item.name}</h3>
              <p className="text-sm text-charcoal/55">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Lightbox item={lbItem} onClose={() => setActive(null)} />
    </section>
  );
}
