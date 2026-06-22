import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

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

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const item = active !== null ? statements[active] : null;

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

      {/* Zoom / lightbox view */}
      {item && (
        <div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-charcoal/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
          >
            <X size={20} />
          </button>
          <img
            src={item.image}
            alt={`${item.name} statement frame — zoomed view | Drucka`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
          />
          <div className="mt-4 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-semibold text-white">{item.name}</h3>
            <a
              href={wa(`Hi Drucka! I'd like to know more about the ${item.name} statement frame.`)}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-gold-dark transition"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
