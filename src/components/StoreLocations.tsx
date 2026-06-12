import { MapPin, Clock, MessageCircle, Truck } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

export default function StoreLocations() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">
            Visit Us
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Our Studio
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Studio */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/6732227/pexels-photo-6732227.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=700"
                alt="Drucka Print Studio"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 lg:p-8">
              <h3 className="font-serif font-bold text-xl text-charcoal mb-4">Drucka Print Studio</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-charcoal/70">
                  <MapPin size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <span className="text-sm leading-relaxed">
                    Kolhapur, Maharashtra — visits by appointment
                  </span>
                </div>
                <div className="flex items-start gap-3 text-charcoal/70">
                  <Clock size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <div className="text-sm">
                    <p>Mon – Sat: 10:00 am – 8:00 pm</p>
                    <p>Sunday: on WhatsApp</p>
                  </div>
                </div>
              </div>
              <a
                href={wa("Hi Drucka! I'd like to visit the studio — please share the location & a good time.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-charcoal hover:bg-charcoal/90 text-white text-sm font-medium tracking-wide uppercase rounded-sm transition-colors"
              >
                <MessageCircle size={14} />
                Book a Visit
              </a>
            </div>
          </div>

          {/* Online — ships everywhere */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=700"
                alt="Drucka ships across India"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 lg:p-8">
              <h3 className="font-serif font-bold text-xl text-charcoal mb-4">Order from Anywhere</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-charcoal/70">
                  <Truck size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <span className="text-sm leading-relaxed">
                    Pan-India delivery in 2–4 days — prints, frames, apparel & gifts, carefully packed.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-charcoal/70">
                  <Clock size={18} className="flex-shrink-0 mt-0.5 text-gold" />
                  <div className="text-sm">
                    <p>Order online 24×7 · COD &amp; UPI accepted</p>
                  </div>
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
