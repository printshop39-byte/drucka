import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Gift } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

const tabletopImages = [
  'https://images.pexels.com/photos/1367230/pexels-photo-1367230.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/8490229/pexels-photo-8490229.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  'https://images.pexels.com/photos/9451803/pexels-photo-9451803.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
];

export default function FeaturedProduct() {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % tabletopImages.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + tabletopImages.length) % tabletopImages.length);

  return (
    <section id="tabletop" className="py-20 lg:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs">The Most Personalised Gift</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image carousel */}
          <div className="relative group">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-2xl shadow-charcoal/10">
              <img
                src={tabletopImages[currentImage]}
                alt="The Tabletop Frame"
                className="w-full h-full object-cover transition-all duration-500"
              />
            </div>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {tabletopImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentImage ? 'bg-gold w-6' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
            {/* Badge */}
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wide">
              Save 25%
            </div>
          </div>

          {/* Product info */}
          <div className="lg:pl-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-4">
              The Tabletop
            </h2>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-charcoal">₹1,499</span>
              <span className="text-lg text-charcoal/40 line-through">₹1,999</span>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-charcoal/70">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                <span>Photo Size — 5" × 5"</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal/70">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                <span>Frame Size — 8" × 8"</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal/70">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                <span>Fine Art Giclée Print</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal/70">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                <span>Chiba Metal Frame</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal/70">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                <span>Clear Acrylic & Acid-Free Mat</span>
              </div>
              <div className="flex items-center gap-3 text-charcoal/70">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                <span>Table Top Stand Included</span>
              </div>
            </div>
            <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-8 flex items-center gap-3">
              <Gift size={20} className="text-gold flex-shrink-0" />
              <span className="text-sm text-charcoal/80 font-medium">FREE Fine Art Giclée Print included with every order</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={wa('Hi Drucka! I want to order The Tabletop frame (₹1,499). I will share my photo.')}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-charcoal hover:bg-charcoal/90 text-white font-semibold tracking-wide text-sm uppercase transition-all rounded-sm">
                <ShoppingBag size={18} />
                Order Now
              </a>
              <a href={wa('Hi Drucka! I have a question about The Tabletop frame.')}
                target="_blank" rel="noopener noreferrer"
                className="px-8 py-4 border-2 border-charcoal text-center text-charcoal font-semibold tracking-wide text-sm uppercase hover:bg-charcoal hover:text-white transition-all rounded-sm">
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
