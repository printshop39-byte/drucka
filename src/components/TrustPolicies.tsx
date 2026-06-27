import { RefreshCw, ShieldCheck, BadgeCheck } from 'lucide-react';

/* Trust & policy blocks — return/replacement, privacy, quality.
   Privacy trust is critical for a custom-photo print site. */
const items = [
  {
    icon: RefreshCw,
    title: 'Easy Return & Replacement',
    desc: 'Arrived damaged or misprinted? Send us a photo on WhatsApp within 48 hours and we reprint or replace it free — no fuss.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Upload & Privacy',
    desc: 'Your photos are sent over a secure connection, used only to fulfil your order, never sold or shared, and removed from our systems after printing.',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Guarantee',
    desc: 'Premium materials, true-to-photo colour, and a careful quality check on every single order before it ships.',
  },
];

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(26,18,8,0.08)',
  boxShadow: '0 2px 14px rgba(26,18,8,0.05)',
};

export default function TrustPolicies() {
  return (
    <section className="py-8 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">Our promise</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Order with complete confidence
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">
            Your memories and your money are both safe with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="rounded-2xl bg-white p-7" style={cardStyle}>
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#a8863a' }}>
                  <Icon size={22} />
                </span>
                <h3 className="font-serif font-semibold text-lg text-charcoal">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/55">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
