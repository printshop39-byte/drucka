const miniPrints = [
  { size: '2×3 inch', name: 'Wallet & Gift Inserts', image: '/images/mini/mini-2x3.jpg', desc: 'Pocket-size prints for wallets, cards & gift tags' },
  { size: '3×3 inch', name: 'Instagram Square Prints', image: '/images/mini/mini-3x3.jpg', desc: 'Perfect square prints of your favourite feed photos' },
  { size: '4×3 inch', name: 'Memory & Scrapbook Prints', image: '/images/mini/mini-4x3.jpg', desc: 'Classic mini prints for albums & scrapbooks' },
];

export default function MiniPhotoPrints({ onOrder }: { onOrder?: () => void }) {
  const open = () => onOrder?.();

  return (
    <section id="mini-prints" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            Small Prints, Big Memories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Mini Photo Prints
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">
            Premium mini prints in handy sizes — perfect for gifting, journaling and sharing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {miniPrints.map((item) => (
            <button
              key={item.size}
              type="button"
              onClick={open}
              aria-label={`Create ${item.size} mini prints`}
              className="group cursor-pointer text-left"
            >
              <div className="relative aspect-square bg-warm rounded-lg overflow-hidden mb-4">
                <img
                  src={item.image}
                  alt={`${item.size} mini photo prints — ${item.name} | Drucka`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 rounded-full bg-charcoal/85 px-3 py-1 text-xs font-bold text-white">
                  {item.size}
                </span>
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="rounded-full bg-white/95 px-5 py-2 text-charcoal font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Create now →
                  </span>
                </div>
              </div>
              <h3 className="font-serif font-semibold text-lg text-charcoal">{item.name}</h3>
              <p className="text-sm text-charcoal/55">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-2 rounded-full bg-charcoal px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-charcoal/90"
          >
            Create your mini prints →
          </button>
          <p className="mt-3 text-xs text-charcoal/50">Upload photos, pick a size &amp; order in minutes · from ₹19/print</p>
        </div>
      </div>
    </section>
  );
}
