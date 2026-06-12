import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

const galleryWalls = [
  {
    name: 'Osaka Trio',
    size: '3 Frames',
    price: '₹5,999',
    image: 'https://images.pexels.com/photos/5137775/pexels-photo-5137775.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=700',
  },
  {
    name: 'Uneven Trio',
    size: 'Metal Frame Set',
    price: '₹6,499',
    image: 'https://images.pexels.com/photos/18684949/pexels-photo-18684949.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=700',
  },
  {
    name: 'Snow Pair',
    size: '2 Frames',
    price: '₹4,299',
    image: 'https://images.pexels.com/photos/13130043/pexels-photo-13130043.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=700',
  },
  {
    name: 'Gallery Wall Set',
    size: 'Set of 7',
    price: '₹12,999',
    image: 'https://images.pexels.com/photos/709604/pexels-photo-709604.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=700',
  },
  {
    name: 'Metallic Quint',
    size: 'Set of 5',
    price: '₹9,999',
    image: 'https://images.pexels.com/photos/5137949/pexels-photo-5137949.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=700',
  },
  {
    name: 'Grand Gallery',
    size: 'Set of 8',
    price: '₹14,999',
    image: 'https://images.pexels.com/photos/383568/pexels-photo-383568.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=700',
  },
];

export default function GalleryWalls() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -420 : 420,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="gallery-walls" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
              Artistic Oasis
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
              Gallery Walls
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
          {galleryWalls.map((wall, index) => (
            <a
              key={index}
              href={wa(`Hi Drucka! I'm interested in the ${wall.name} gallery wall (${wall.size}, ${wall.price}).`)}
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 w-[360px] group cursor-pointer"
            >
              <div className="relative aspect-[7/5] bg-warm rounded-lg overflow-hidden mb-4">
                <img
                  src={wall.image}
                  alt={wall.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-charcoal">{wall.name}</h3>
                  <p className="text-sm text-charcoal/50">{wall.size}</p>
                </div>
                <span className="font-semibold text-charcoal">{wall.price}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
