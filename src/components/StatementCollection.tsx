const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

const statements = [
  {
    name: 'Oslo',
    image: 'https://images.pexels.com/photos/5137775/pexels-photo-5137775.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Portland',
    image: 'https://images.pexels.com/photos/18684949/pexels-photo-18684949.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Fuji',
    image: 'https://images.pexels.com/photos/13130043/pexels-photo-13130043.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Naples',
    image: 'https://images.pexels.com/photos/709604/pexels-photo-709604.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Shibuya',
    image: 'https://images.pexels.com/photos/5137949/pexels-photo-5137949.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Monaco',
    image: 'https://images.pexels.com/photos/3863791/pexels-photo-3863791.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Burano',
    image: 'https://images.pexels.com/photos/4588842/pexels-photo-4588842.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
  {
    name: 'Sariska',
    image: 'https://images.pexels.com/photos/15685873/pexels-photo-15685873.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=400',
  },
];

export default function StatementCollection() {
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
          {statements.map((item, index) => (
            <a
              key={index}
              href={wa(`Hi Drucka! I'd like to know more about the ${item.name} statement frame.`)}
              target="_blank" rel="noopener noreferrer"
              className="group cursor-pointer"
            >
              <div className="relative aspect-square bg-warm rounded-lg overflow-hidden mb-3">
                <img
                  src={item.image}
                  alt={`${item.name} — statement photo frame & wall art online | Drucka`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white font-serif text-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                    View
                  </span>
                </div>
              </div>
              <h3 className="font-serif font-semibold text-charcoal text-center">{item.name}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
