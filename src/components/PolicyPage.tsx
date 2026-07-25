import { useEffect } from 'react';
import { MessageCircle, Mail } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

interface PolicySection { h: string; p: string }
interface PolicyData {
  slug: string;
  label: string;
  title: string;
  description: string;
  intro: string;
  sections: PolicySection[];
}

/* Static legal/policy page rendered in <main> for /shipping-policy,
   /returns-policy and /privacy-policy. Content comes from
   src/seo/policies.js so the prerender script and the app can't drift. */
export default function PolicyPage({ data, siblings, onNavigate }: {
  data: PolicyData;
  siblings: Array<{ slug: string; label: string }>;
  onNavigate: (slug: string) => void;
}) {
  useEffect(() => { window.scrollTo(0, 0); }, [data.slug]);

  return (
    <article className="bg-white pb-16 pt-28 sm:pt-32">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-charcoal/50">
          <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }} className="transition hover:text-charcoal">
            Home
          </a>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-charcoal/70">{data.label}</span>
        </nav>

        <h1 className="font-serif text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
          {data.label}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-charcoal/70">{data.intro}</p>

        <div className="mt-10 space-y-8">
          {data.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-serif text-xl font-bold text-charcoal sm:text-2xl">{s.h}</h2>
              <p className="mt-2 text-base leading-relaxed text-charcoal/70">{s.p}</p>
            </section>
          ))}
        </div>

        {/* Help CTA */}
        <div className="mt-12 rounded-2xl border border-stone/60 bg-cream p-6 shadow-[0_2px_14px_rgba(26,18,8,0.05)]">
          <h2 className="font-serif text-xl font-bold text-charcoal">Still need help?</h2>
          <p className="mt-2 text-base leading-relaxed text-charcoal/65">
            Message us with your order ID and we&rsquo;ll sort it out.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={wa('Hi Drucka! I have a question about my order.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-gold-dark"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Chat on WhatsApp
            </a>
            <a
              href="mailto:hello@drucka.in"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-stone bg-white px-6 text-sm font-semibold text-charcoal transition hover:border-gold"
            >
              <Mail size={16} aria-hidden="true" />
              hello@drucka.in
            </a>
          </div>
        </div>

        {/* Sibling policies */}
        <div className="mt-10 border-t border-stone/60 pt-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">Other policies</p>
          <div className="flex flex-wrap gap-x-6">
            {siblings.filter((s) => s.slug !== data.slug).map((s) => (
              <a
                key={s.slug}
                href={`/${s.slug}`}
                onClick={(e) => { e.preventDefault(); onNavigate(`/${s.slug}`); }}
                className="flex min-h-[44px] items-center text-sm font-medium text-charcoal/70 underline-offset-4 transition hover:text-charcoal hover:underline"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
