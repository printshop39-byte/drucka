import { Truck, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

export default function StoreLocations() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            100% Online
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Order Online, Delivered Across India
          </h2>
          <p className="mt-4 text-charcoal/60 max-w-xl mx-auto">
            No store visit needed — design online, pay online, and we deliver to your doorstep anywhere in India.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Made in our studio — origin / quality */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/6732227/pexels-photo-6732227.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=700"
                alt="Custom printing made at the Drucka studio in Kolhapur, India"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 lg:p-8">
              <h3 className="font-serif font-bold text-xl text-charcoal mb-4">Made in Our Studio</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-charcoal/70">
                  <Sparkles size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <span className="text-sm leading-relaxed">
                    Every order is printed &amp; hand-finished at our Kolhapur studio, then shipped straight to you.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-charcoal/70">
                  <ShieldCheck size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <span className="text-sm leading-relaxed">
                    Quality-checked before dispatch · COD &amp; UPI accepted
                  </span>
                </div>
              </div>
              <a
                href={wa("Hi Drucka! I'd like to place a custom order online for delivery.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-charcoal hover:bg-charcoal/90 text-white text-sm font-medium tracking-wide uppercase rounded-sm transition-colors"
              >
                <MessageCircle size={14} />
                Start Your Order
              </a>
            </div>
          </div>

          {/* Online — ships everywhere */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=700"
                alt="Drucka delivers custom prints, frames & gifts across India"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 lg:p-8">
              <h3 className="font-serif font-bold text-xl text-charcoal mb-4">Delivered Anywhere in India</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-charcoal/70">
                  <Truck size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <span className="text-sm leading-relaxed">
                    Pan-India delivery in 2–4 days — prints, frames, apparel &amp; gifts, carefully packed.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-charcoal/70">
                  <Sparkles size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <span className="text-sm leading-relaxed">
                    Order online 24×7 — design, preview &amp; checkout from your phone.
                  </span>
                </div>
              </div>
              <a
                href={wa("Hi Drucka! I'd like to place an order for delivery.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gold hover:bg-gold-dark text-white text-sm font-medium tracking-wide uppercase rounded-sm transition-colors"
              >
                <MessageCircle size={14} />
                Order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
