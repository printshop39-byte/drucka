import { useState } from 'react';
import Lightbox, { LightboxItem } from './Lightbox';

/* NOTE: prices are placeholders for the scrapbook restyle — confirm/replace. */
const phoneCases = [
  { name: 'Photo Collage Case', image: '/images/phonecases/case-1.jpg', desc: 'Your favourite photos in one custom collage case', price: '₹449' },
  { name: 'Polaroid Memory Case', image: '/images/phonecases/case-2.jpg', desc: 'Cherished moments styled like keepsake polaroids', price: '₹499' },
  { name: 'Custom Design Cases', image: '/images/phonecases/case-3.jpg', desc: 'Add names, dates & your own photos — fully personalised', price: '₹549' },
];

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

export default function PhoneCases() {
  const [active, setActive] = useState<number | null>(null);
  const lbItem: LightboxItem | null = active !== null ? {
    image: phoneCases[active].image,
    title: phoneCases[active].name,
    subtitle: phoneCases[active].desc,
    price: phoneCases[active].price,
    waMessage: `Hi Drucka! I'm interested in a Custom Photo Phone Case (${phoneCases[active].name}, ${phoneCases[active].price}).`,
  } : null;

  return (
    <section id="phone-cases" className="sb-section relative py-20 lg:py-28">
      <style>{`
        .sb-section { background-color: #FEF9F0; background-image: radial-gradient(circle, rgba(201,116,76,0.12) 1px, transparent 1px); background-size: 20px 20px; }
        .sb-label { font-family: 'Courier New', monospace; letter-spacing: 3px; color: #C9744C; font-size: 11px; }
        .sb-heading { font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #1a1208; }
        .sb-doodle { font-family: 'Dancing Script', cursive; font-size: 15px; color: rgba(201,116,76,0.45); transform: rotate(-3deg); }
        .sb-card { position: relative; background: #fff; border: none; border-radius: 3px; box-shadow: 2px 3px 0 rgba(201,116,76,0.2), 4px 6px 0 rgba(201,116,76,0.08); transition: all 0.3s ease; transform: rotate(-0.8deg); }
        .sb-card:nth-child(even) { transform: rotate(0.8deg); }
        .sb-card:nth-child(3n) { transform: rotate(-0.4deg); }
        .sb-card::before { content: ''; position: absolute; top: -8px; left: 50%; transform: translateX(-50%) rotate(-2deg); width: 40px; height: 14px; background: rgba(255,230,100,0.55); border-radius: 2px; z-index: 2; }
        .sb-card:hover { transform: rotate(0deg) translateY(-6px); box-shadow: 4px 8px 20px rgba(0,0,0,0.1); }
        .sb-name { font-family: 'Dancing Script', cursive; font-size: 20px; line-height: 1.2; color: #1a1208; }
        .sb-price { color: #C9744C; font-size: 14px; font-weight: 500; }
        .sb-cta { background: #C9744C; color: #fff; border-radius: 3px; font-family: Georgia, serif; font-style: italic; letter-spacing: 0.5px; transition: background 0.3s ease; }
        .sb-cta:hover { background: #a85c38; }
        @media (max-width: 640px) {
          /* keep tilt + tape on mobile (subtle), but ease hover */
        }
      `}</style>

      <span className="sb-doodle pointer-events-none absolute right-6 top-10 hidden sm:block">✦ perfect for gifting ✦</span>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="sb-label uppercase block mb-3">A Gift They'll Carry Everywhere</span>
          <h2 className="sb-heading text-3xl sm:text-4xl lg:text-5xl">
            Custom Photo Phone Cases
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">
            Turn your favourite memories into a personalised phone case — the perfect thoughtful gift.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
          {phoneCases.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View ${item.name}`}
              className="sb-card cursor-pointer p-3 text-left"
            >
              <div className="relative aspect-square bg-warm rounded-[2px] overflow-hidden mb-3">
                <img
                  src={item.image}
                  alt={`${item.name} — custom photo phone case gift | Drucka`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-end justify-between gap-2 px-1">
                <h3 className="sb-name">{item.name}</h3>
                <span className="sb-price shrink-0">{item.price}</span>
              </div>
              <p className="mt-1 px-1 text-sm text-charcoal/55">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-14 text-center">
          <a
            href={wa("Hi Drucka! I'd like to gift a Custom Photo Phone Case. Please help me design one.")}
            target="_blank"
            rel="noopener noreferrer"
            className="sb-cta inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold"
          >
            Gift one now →
          </a>
        </div>
      </div>

      <Lightbox item={lbItem} onClose={() => setActive(null)} />
    </section>
  );
}
