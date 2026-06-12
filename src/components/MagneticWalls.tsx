const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

const magneticSizes = [
  { name: '2×2 Feet', price: '₹3,999' },
  { name: '2×3 Feet', price: '₹5,499' },
  { name: '3×3 Feet', price: '₹7,999' },
  { name: '3×4 Feet', price: '₹9,499' },
  { name: '4×4 Feet', price: '₹11,999' },
  { name: '4×5 Feet', price: '₹14,499' },
  { name: '5×5 Feet', price: '₹17,999' },
];

export default function MagneticWalls() {
  return (
    <section id="magnetic" className="py-20 lg:py-28 bg-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            Easy to Rearrange
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-4">
            Magnetic Gallery Walls
          </h2>
          <p className="text-charcoal/60 max-w-xl mx-auto">
            Rearrange your photos anytime with our innovative magnetic mounting system. No nails, no damage — just pure creativity.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {magneticSizes.map((size, index) => (
            <a
              key={index}
              href={wa(`Hi Drucka! I'm interested in a ${size.name} magnetic gallery wall (${size.price}).`)}
              target="_blank" rel="noopener noreferrer"
              className="block bg-white rounded-xl p-6 text-center group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-stone/30"
            >
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-gold/30 group-hover:border-gold rounded-lg flex items-center justify-center transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gold">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="font-serif font-semibold text-charcoal mb-1">{size.name}</h3>
              <p className="text-charcoal/60 font-medium text-sm">{size.price}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
