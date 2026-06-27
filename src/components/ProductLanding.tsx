import { useEffect } from 'react';
import { ArrowRight, MessageCircle, Check } from 'lucide-react';
import type { Landing } from './landingData';

const ABS = 'https://www.drucka.in';
const card: React.CSSProperties = { border: '1px solid rgba(26,18,8,0.08)', boxShadow: '0 2px 14px rgba(26,18,8,0.05)' };
const goldTint: React.CSSProperties = { backgroundColor: 'rgba(201,168,76,0.12)', color: '#a8863a' };

const goldBtn = 'inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gold-dark';
const waBtn = 'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-110';

/* SEO product/service landing page. Sets a unique title/meta and injects
   Product + FAQPage JSON-LD for rich-result eligibility. Content is English +
   Marathi; the CTA opens the matching editor or WhatsApp. */
export default function ProductLanding({
  data, onPrimary, whatsappUrl,
}: { data: Landing; onPrimary: () => void; whatsappUrl: string }) {
  useEffect(() => {
    document.title = data.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${ABS}/${data.slug}`);

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.setAttribute('data-landing', data.slug);
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: data.schemaName,
          image: ABS + data.image,
          description: data.description,
          brand: { '@type': 'Brand', name: 'Drucka' },
          offers: {
            '@type': 'Offer',
            url: `${ABS}/${data.slug}`,
            priceCurrency: 'INR',
            price: data.fromPrice,
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: 'Drucka' },
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: data.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    });
    document.head.appendChild(ld);
    return () => {
      ld.remove();
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${ABS}/`);
    };
  }, [data]);

  const isWa = data.action === 'whatsapp';

  return (
    <article className="bg-white">
      {/* Hero */}
      <section style={{ backgroundColor: '#FBFAF8' }}>
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
          <div>
            <span className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-gold">{data.eyebrow}</span>
            <h1 className="font-serif text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-5xl">{data.h1}</h1>
            {data.tagline && <p className="mt-2 text-lg font-medium text-charcoal/70 sm:text-xl">{data.tagline}</p>}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5" style={card}>
              <span className="text-lg font-bold text-charcoal">From ₹{data.fromPrice.toLocaleString('en-IN')}</span>
              {data.priceNote && <span className="text-xs text-charcoal/55">· {data.priceNote}</span>}
            </div>
            <p className="mt-5 max-w-md leading-relaxed text-charcoal/65">{data.introEn}</p>
            <p className="mt-3 max-w-md leading-relaxed text-charcoal/55" lang="mr">{data.introMr}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {isWa ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={waBtn} style={{ background: '#1ba34e' }}>
                  <MessageCircle size={18} /> {data.ctaLabel}
                </a>
              ) : (
                <>
                  <button type="button" onClick={onPrimary} className={goldBtn}>
                    {data.ctaLabel} <ArrowRight size={18} />
                  </button>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={waBtn} style={{ background: '#1ba34e' }}>
                    <MessageCircle size={18} /> Order on WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white" style={{ ...card, aspectRatio: '4 / 3' }}>
            <img src={data.image} alt={data.imageAlt} loading="eager" decoding="async" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.highlights.map((h) => (
            <div key={h} className="flex items-center gap-3 rounded-xl bg-white p-4" style={card}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={goldTint}><Check size={16} /></span>
              <span className="text-sm font-medium text-charcoal/80">{h}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — native <details> so the answers are crawlable without JS */}
      <section className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <h2 className="mb-8 text-center font-serif text-2xl font-bold text-charcoal sm:text-3xl">Frequently asked questions</h2>
        <div className="grid gap-3">
          {data.faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white p-5" style={card}>
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-charcoal">
                {f.q}
                <span className="ml-3 text-lg text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/65">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ backgroundColor: '#FBFAF8' }}>
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">Ready to order?</h2>
          <p className="mt-2 text-charcoal/55">Upload your photo and order in minutes — every order is confirmed on WhatsApp.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {!isWa && (
              <button type="button" onClick={onPrimary} className={goldBtn}>
                {data.ctaLabel} <ArrowRight size={18} />
              </button>
            )}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={waBtn} style={{ background: '#1ba34e' }}>
              <MessageCircle size={18} /> Order on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
