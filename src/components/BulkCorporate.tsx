import { Building2, MessageCircle, Check } from 'lucide-react';

/* Bulk / Corporate orders — single premium panel, gold primary CTA. */
const WA = 'https://wa.me/917083811355?text=' + encodeURIComponent(
  "Hi Drucka! I'd like a bulk / corporate gifting quote. Here are my details:"
);

const perks = [
  'Weddings, return gifts & events',
  'Office & employee gifting',
  'Volume pricing on 25+ pieces',
  'Branded / personalised at scale',
];

export default function BulkCorporate() {
  return (
    <section className="py-8 lg:py-16" style={{ backgroundColor: '#FBFAF8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-3xl bg-white p-7 sm:p-10 lg:p-12"
          style={{ border: '1px solid rgba(26,18,8,0.08)', boxShadow: '0 6px 28px rgba(26,18,8,0.06)' }}
        >
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#a8863a' }}>
                <Building2 size={22} />
              </span>
              <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">Bulk &amp; Corporate</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal">
                Order in Bulk, Save More
              </h2>
              <p className="mt-4 max-w-md text-charcoal/55">
                Personalised prints, frames, mugs & gifts for weddings, events and offices — with volume pricing and a dedicated point of contact.
              </p>
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gold-dark"
              >
                <MessageCircle size={18} /> Get a bulk quote
              </a>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-medium text-charcoal/75" style={{ backgroundColor: '#FBFAF8' }}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#a8863a' }}>
                    <Check size={14} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
