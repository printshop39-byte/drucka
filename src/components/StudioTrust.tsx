import { BadgeCheck, Star, MessageCircle, Truck, Store, Lock } from 'lucide-react';

/* ── Trust / "real studio" block ──
   Custom-order shoppers look for proof before they pay. This bundles the
   trust signals: a real studio photo, an experience badge, a verified-looking
   WhatsApp contact, a Google-reviews link, sample print closeups, delivery /
   pickup options and the privacy promise.

   ⚠ OWNER: confirm/replace the placeholders below with your real values. */
const EST_YEAR = 1996;                 // ← set your real founding year (or remove the badge)
const GOOGLE_REVIEWS_URL = '#';        // ← paste your Google Business "write a review" / profile link
const GOOGLE_RATING = '4.9';           // ← your real Google rating
const GOOGLE_COUNT = '500+';           // ← number of Google reviews
const WA = 'https://wa.me/917083811355?text=' + encodeURIComponent("Hi Drucka! I'd like to place a custom order.");
const PHONE_DISPLAY = '+91 70838 11355';

/* Real studio image; sample closeups use existing product shots for now —
   ⚠ OWNER: drop real macro/quality photos at these paths to replace. */
const STUDIO_PHOTO = '/images/studio/made-in-studio.webp';
const SAMPLES = [
  { src: '/images/frames/premium-golden-live.jpg', label: 'Framed prints' },
  { src: '/images/mini/mini-3x3.jpg', label: 'Mini prints' },
  { src: '/images/prints/print-1.jpg', label: 'Photo prints' },
  { src: '/images/mug.jpg', label: 'Photo mugs' },
];

const card: React.CSSProperties = { border: '1px solid rgba(26,18,8,0.08)', boxShadow: '0 2px 14px rgba(26,18,8,0.05)' };
const goldTint: React.CSSProperties = { backgroundColor: 'rgba(201,168,76,0.12)', color: '#a8863a' };

export default function StudioTrust() {
  const years = new Date().getFullYear() - EST_YEAR;
  return (
    <section className="py-8 lg:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">A real studio you can talk to</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">Trusted by thousands, printed by people</h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">No faceless app — a real Kolhapur print studio you can message before you order.</p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          {/* Studio photo + experience badge */}
          <div className="relative overflow-hidden rounded-2xl bg-white" style={card}>
            <img src={STUDIO_PHOTO} alt="Custom printing at the Drucka studio in Kolhapur" loading="lazy" decoding="async" className="h-full max-h-[420px] w-full object-cover" />
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {EST_YEAR > 0 && (
                <span className="rounded-full bg-charcoal/85 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                  Since {EST_YEAR} · {years}+ yrs
                </span>
              )}
              <span className="rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-white">10,000+ orders delivered</span>
            </div>
          </div>

          {/* Verified contact + reviews + quick trust */}
          <div className="flex flex-col gap-4">
            {/* WhatsApp verified-looking block */}
            <div className="rounded-2xl bg-white p-5" style={card}>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ backgroundColor: 'rgba(27,163,78,0.12)', color: '#1ba34e' }}>
                  <MessageCircle size={22} />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold text-charcoal">
                    {PHONE_DISPLAY}
                    <BadgeCheck size={16} style={{ color: '#1ba34e' }} aria-label="Verified business" />
                  </p>
                  <p className="text-xs text-charcoal/55">Business WhatsApp · usually replies in minutes</p>
                </div>
                <a href={WA} target="_blank" rel="noopener noreferrer"
                  className="ml-auto shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
                  style={{ background: '#1ba34e' }}>
                  Chat to Order
                </a>
              </div>
            </div>

            {/* Google reviews */}
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white p-5 transition hover:bg-[#FBFAF8]" style={card}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={goldTint}><Star size={22} /></span>
              <div>
                <p className="flex items-center gap-1.5 font-bold text-charcoal">
                  {GOOGLE_RATING}
                  <span className="text-gold">★★★★★</span>
                </p>
                <p className="text-xs text-charcoal/55">{GOOGLE_COUNT} Google reviews · read what customers say →</p>
              </div>
            </a>

            {/* Delivery / pickup + privacy */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl bg-white p-4" style={card}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={goldTint}><Truck size={18} /></span>
                <div><p className="text-sm font-bold text-charcoal">Delivery across India</p><p className="text-xs text-charcoal/55">Carefully packed, 2–4 days</p></div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-white p-4" style={card}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={goldTint}><Store size={18} /></span>
                <div><p className="text-sm font-bold text-charcoal">Studio pickup</p><p className="text-xs text-charcoal/55">Collect from our Kolhapur studio</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample print closeups */}
        <div className="mt-10">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-charcoal/45">Real prints, real quality</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAMPLES.map((s) => (
              <figure key={s.label} className="overflow-hidden rounded-2xl bg-white" style={card}>
                <img src={s.src} alt={`${s.label} quality sample by Drucka`} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                <figcaption className="px-3 py-2 text-center text-xs font-medium text-charcoal/60">{s.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Privacy promise */}
        <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-center text-sm text-charcoal/60">
          <Lock size={15} style={{ color: '#a8863a' }} />
          Uploaded photos are used only for your order — never shared or sold.
        </p>
      </div>
    </section>
  );
}
