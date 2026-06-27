import { BadgeCheck, Sparkles, ShieldCheck, Truck, Building2, MessageCircle } from 'lucide-react';

/* Why Drucka — trust grid. White bg, single gold accent, bordered soft-shadow cards. */
const points = [
  { icon: BadgeCheck, title: 'No minimum order', desc: 'Order a single print or hundreds — entirely your call.' },
  { icon: Sparkles, title: 'Premium quality', desc: 'Rich, true-to-photo colours on premium paper & materials.' },
  { icon: ShieldCheck, title: 'Secure & private', desc: 'Your photos are used only for your order — never shared or sold.' },
  { icon: Truck, title: 'Fast India delivery', desc: 'Carefully packed and delivered across India in 2–4 days.' },
  { icon: Building2, title: 'Bulk & corporate', desc: 'Volume pricing for events, weddings & office gifting.' },
  { icon: MessageCircle, title: 'Real WhatsApp support', desc: 'Talk to a human — every order is confirmed before printing.' },
];

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(26,18,8,0.08)',
  boxShadow: '0 2px 14px rgba(26,18,8,0.05)',
};

export default function WhyDrucka() {
  return (
    <section className="py-8 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">Why Drucka</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Premium prints, zero hassle
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">
            Everything you'd expect from a premium gifting studio — and nothing you wouldn't.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="flex items-start gap-4 rounded-2xl bg-white p-6" style={cardStyle}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#a8863a' }}>
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="font-serif font-semibold text-lg text-charcoal">{p.title}</h3>
                  <p className="mt-1 text-sm text-charcoal/55">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
