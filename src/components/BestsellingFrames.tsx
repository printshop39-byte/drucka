import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

const frames = [
  {
    name: 'Osaka Frame',
    type: 'Metal',
    price: '₹2,499',
    image: 'https://images.pexels.com/photos/10322820/pexels-photo-10322820.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'Austin Frame',
    type: 'Solid Wood',
    price: '₹2,999',
    image: 'https://images.pexels.com/photos/29985393/pexels-photo-29985393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'Venice Frame',
    type: 'Solid Wood',
    price: '₹3,499',
    image: 'https://images.pexels.com/photos/14471016/pexels-photo-14471016.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'Kyoto Frame',
    type: 'Metal',
    price: '₹2,299',
    image: 'https://images.pexels.com/photos/14243694/pexels-photo-14243694.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'New York Frame',
    type: 'Solid Wood',
    price: '₹3,199',
    image: 'https://images.pexels.com/photos/5905067/pexels-photo-5905067.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'Chicago Frame',
    type: 'Solid Wood',
    price: '₹2,799',
    image: 'https://images.pexels.com/photos/13909131/pexels-photo-13909131.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'Detroit Frame',
    type: 'Solid Wood',
    price: '₹2,599',
    image: 'https://images.pexels.com/photos/10322820/pexels-photo-10322820.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
  {
    name: 'Philadelphia Frame',
    type: 'Solid Wood',
    price: '₹3,099',
    image: 'https://images.pexels.com/photos/29985393/pexels-photo-29985393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=400',
  },
];

export default function BestsellingFrames() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="frames" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
              Free Premium HD Print
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
              Bestselling Frames
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-11 h-11 border border-charcoal/20 hover:border-charcoal rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-11 h-11 border border-charcoal/20 hover:border-charcoal rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4"
        >
          {frames.map((frame, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[280px] group cursor-pointer"
            >
              <div className="relative aspect-[3/4] bg-warm rounded-lg overflow-hidden mb-4">
                <img
                  src={frame.image}
                  alt={`${frame.name} — ${frame.type} photo frame online | Drucka`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-300"></div>
                <a
                  href={wa(`Hi Drucka! I'm interested in the ${frame.name} (${frame.type}, ${frame.price}). Please share details.`)}
                  target="_blank" rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 right-4 py-3 bg-white/95 text-charcoal text-center text-sm font-semibold tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 rounded-sm"
                >
                  Order on WhatsApp
                </a>
              </div>
              <h3 className="font-serif font-semibold text-lg text-charcoal mb-1">{frame.name}</h3>
              <p className="text-sm text-charcoal/50 mb-2">{frame.type}</p>
              <p className="font-semibold text-charcoal">{frame.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
