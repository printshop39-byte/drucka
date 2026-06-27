import { useEffect, useRef, useState } from 'react';
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
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const item: LightboxItem | null = active !== null ? {
    image: galleryWalls[active].image,
    title: galleryWalls[active].name,
    subtitle: galleryWalls[active].size,
    price: galleryWalls[active].price,
    waMessage: `Hi Drucka! I'm interested in the ${galleryWalls[active].name} gallery wall (${galleryWalls[active].size}, ${galleryWalls[active].price}).`,
  } : null;

  /* fade the section in once it scrolls into view */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -420 : 420,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section ref={sectionRef} id="gallery-walls" className="py-20 lg:py-28 bg-white">
      {/* hover lift/zoom only on real hover devices (disabled on touch/mobile) */}
      <style>{`
        @keyframes gwFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        .gw-reveal { opacity: 0; }
        .gw-reveal.gw-in { animation: gwFadeUp 0.6s ease forwards; }
        .gw-img { transition: transform 0.35s cubic-bezier(0.23,1,0.32,1); }
        .gw-arrow { border: 1.5px solid #C9A84C; color: #C9A84C; transition: all 0.25s ease; }
        @media (hover: hover) and (pointer: fine) {
          .gw-card { transition: transform 0.35s cubic-bezier(0.23,1,0.32,1); cursor: pointer; }
          .gw-card:hover { transform: translateY(-6px); }
          .gw-card:hover .gw-img { transform: scale(1.04); }
          .gw-arrow:hover { background: #C9A84C; color: #fff; }
        }
      `}</style>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gw-reveal ${visible ? 'gw-in' : ''}`}>
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
              Artistic Oasis
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-charcoal">
              Design Your Gallery Wall
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="gw-arrow w-11 h-11 rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="gw-arrow w-11 h-11 rounded-full flex items-center justify-center"
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
              className="gw-card flex-shrink-0 w-[360px] group text-left"
            >
              <div className="relative aspect-[7/5] bg-warm rounded-lg overflow-hidden mb-4">
                <img
                  src={wall.image}
                  alt={`${wall.name} gallery wall — custom photo frames online | Drucka`}
                  loading="lazy"
                  decoding="async"
                  className="gw-img w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="font-serif text-lg text-charcoal">{wall.name}</h3>
                  <p className="text-charcoal/50 mt-0.5" style={{ fontSize: '12px' }}>{wall.size}</p>
                </div>
                <span className="font-serif font-semibold" style={{ color: '#C9A84C' }}>{wall.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Lightbox item={item} onClose={() => setActive(null)} />
    </section>
  );
}
