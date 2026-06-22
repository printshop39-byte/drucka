import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Lightbox, { LightboxItem } from './Lightbox';

const galleryWalls = [
  {
    name: 'Osaka Trio',
    size: '3 Frames',
    price: '₹5,999',
    image: '/images/gallery/osaka-trio.jpg',
  },
  {
    name: 'Uneven Trio',
    size: 'Metal Frame Set',
    price: '₹6,499',
    image: '/images/gallery/uneven-trio.jpg',
  },
  {
    name: 'Snow Pair',
    size: '2 Frames',
    price: '₹4,299',
    image: '/images/gallery/snow-pair.jpg',
  },
  {
    name: 'Gallery Wall Set',
    size: 'Set of 7',
    price: '₹12,999',
    image: '/images/gallery/gallery-wall-set.jpg',
  },
  {
    name: 'Metallic Quint',
    size: 'Set of 5',
    price: '₹9,999',
    image: '/images/gallery/metallic-quint.jpg',
  },
  {
    name: 'Grand Gallery',
    size: 'Set of 8',
    price: '₹14,999',
    image: '/images/gallery/grand-gallery.jpg',
  },
];

export default function GalleryWalls() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const item: LightboxItem | null = active !== null ? {
    image: galleryWalls[active].image,
    title: galleryWalls[active].name,
    subtitle: galleryWalls[active].size,
    price: galleryWalls[active].price,
    waMessage: `Hi Drucka! I'm interested in the ${galleryWalls[active].name} gallery wall (${galleryWalls[active].size}, ${galleryWalls[active].price}).`,
  } : null;

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
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View ${wall.name}`}
              className="flex-shrink-0 w-[360px] group cursor-pointer text-left"
            >
              <div className="relative aspect-[7/5] bg-warm rounded-lg overflow-hidden mb-4">
                <img
                  src={wall.image}
                  alt={`${wall.name} gallery wall — custom photo frames online | Drucka`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-charcoal">{wall.name}</h3>
                </div>
                <span className="font-semibold text-charcoal">{wall.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Lightbox item={item} onClose={() => setActive(null)} />
    </section>
  );
}
