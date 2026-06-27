import { Upload, Eye, MessageCircle, Truck } from 'lucide-react';

/* How it works — 4-step upload-first flow. Premium finish: cream bg,
   single gold accent, subtle bordered cards with a soft shadow. */
const steps = [
  { icon: Upload, title: 'Upload Your Photo', desc: 'Pick a product and upload your photo — no design skills needed.' },
  { icon: Eye, title: 'Preview Your Design', desc: 'See a live preview of exactly how your print will look.' },
  { icon: MessageCircle, title: 'Order on WhatsApp', desc: 'Confirm the details and place your order in a quick chat.' },
  { icon: Truck, title: 'Printed & Delivered', desc: 'Premium printing, delivered across India in 2–4 days.' },
];

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(26,18,8,0.08)',
  boxShadow: '0 2px 14px rgba(26,18,8,0.05)',
};

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-8 lg:py-16" style={{ backgroundColor: '#FBFAF8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <span className="text-gold font-medium tracking-[0.2em] uppercase text-xs block mb-3">How it works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            From your photo to your doorstep
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal/55">
            Four simple steps — upload, preview, order on WhatsApp, and we handle the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="relative rounded-2xl bg-white p-6" style={cardStyle}>
                <span className="absolute right-5 top-4 font-serif text-4xl font-bold" style={{ color: 'rgba(201,168,76,0.18)' }}>
                  {i + 1}
                </span>
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#a8863a' }}>
                  <Icon size={22} />
                </span>
                <h3 className="font-serif font-semibold text-lg text-charcoal">{s.title}</h3>
                <p className="mt-1.5 text-sm text-charcoal/55">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
