import { Gift, ShoppingBag } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

export default function SignatureGift() {
  return (
    <section id="gifting" className="py-20 lg:py-28 bg-charcoal text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div>
            <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-4">
              Perfect for Every Occasion
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-6 leading-tight">
              The Signature
              <span className="text-gold-light italic block">Gift</span>
            </h2>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">₹2,499</span>
              <span className="text-white/40 line-through text-lg">₹2,999</span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-sm uppercase">Save 17%</span>
            </div>
            <p className="text-white/60 leading-relaxed mb-8 max-w-md">
              Museum-grade photo frame with a gift box & ribbon. Print on Archival Matte Paper with acid-free conservation matboard and premium clear acrylic.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Wedding', 'Anniversary', 'Pet', 'Friends', 'Family'].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 border border-white/20 rounded-full text-sm text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8 flex items-center gap-3">
              <Gift size={20} className="text-gold flex-shrink-0" />
              <span className="text-sm text-white/70">Comes with premium gift box & ribbon — ready to gift!</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={wa('Hi Drucka! I want to order The Signature Gift (₹2,499) with gift box & ribbon. I will share my photo.')}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gold hover:bg-gold-dark text-white font-semibold tracking-wide text-sm uppercase transition-all rounded-sm">
                <ShoppingBag size={18} />
                Order Now
              </a>
              <a href={wa('Hi Drucka! Tell me more about The Signature Gift.')}
                target="_blank" rel="noopener noreferrer"
                className="px-8 py-4 border border-white/30 hover:border-white/60 text-center text-white font-medium tracking-wide text-sm uppercase transition-all rounded-sm">
                Learn More
              </a>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-2xl">
              <img
                src="https://images.pexels.com/photos/7764473/pexels-photo-7764473.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=700"
                alt="The Signature Gift - Photo frame with gift box"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-white text-charcoal rounded-lg p-5 shadow-2xl max-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className="text-gold text-sm">★</span>
                  ))}
                </div>
                <span className="text-xs text-charcoal/50 font-medium">5.0</span>
              </div>
              <p className="text-xs text-charcoal/60 leading-relaxed">
                "The perfect gift for our anniversary. The quality is absolutely stunning!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
