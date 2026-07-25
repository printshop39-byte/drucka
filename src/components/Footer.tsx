import { Mail, Phone, Camera, MessageCircle } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

interface FooterProps {
  onTrack: () => void;
}

export default function Footer({ onTrack }: FooterProps) {
  const shopLinks = [
    { label: 'Mini Photo Prints', href: '/mini-prints' },
    { label: 'Photo Prints', href: '/photo-prints' },
    { label: 'Custom Photo Frames', href: '/photo-frames' },
    { label: 'Custom T-Shirts', href: '/custom-tshirts' },
    { label: 'Custom Mugs', href: '/custom-mugs' },
    { label: 'Corporate Gifting', href: '/corporate-gifting' },
  ];

  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 border-2 border-white flex items-center justify-center">
                <div className="w-4 h-4 border border-gold"></div>
              </div>
              <span className="text-lg font-serif font-bold tracking-wide">DRUCKA</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Premium custom printing & framing studio from Kolhapur, India. Photo prints, frames, apparel & gifts — printed on demand.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/druc.ka"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-gold group"
              >
                <Camera size={16} className="text-white/50 group-hover:text-gold transition-colors" />
              </a>
              <a
                href={wa('Hi Drucka!')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-gold group"
              >
                <MessageCircle size={16} className="text-white/50 group-hover:text-gold transition-colors" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul>
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="flex min-h-[44px] items-center text-sm text-white/40 transition-colors hover:text-white">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Help</h4>
            <ul>
              <li>
                <button onClick={onTrack} className="flex min-h-[44px] items-center text-sm text-white/40 transition-colors hover:text-white">
                  Track Order
                </button>
              </li>
              {/* Real internal policy pages — content in src/seo/policies.js,
                  prerendered to static HTML by scripts/prerender.js */}
              {[
                { label: 'Shipping & Delivery', href: '/shipping-policy' },
                { label: 'Returns & Replacement', href: '/returns-policy' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex min-h-[44px] items-center text-sm text-white/40 transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={wa('Hi Drucka! I have a question about bulk orders.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ask about bulk orders on WhatsApp"
                  className="flex min-h-[44px] items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
                >
                  Bulk orders
                  <MessageCircle size={12} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href="#faq" className="flex min-h-[44px] items-center text-sm text-white/40 transition-colors hover:text-white">FAQs</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <div>
              <a href="mailto:hello@drucka.in" className="flex min-h-[44px] items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
                <Mail size={14} />
                hello@drucka.in
              </a>
              <a href="tel:+917083811355" className="flex min-h-[44px] items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
                <Phone size={14} />
                +91 70838 11355
              </a>
              <a
                href={wa("Hi Drucka! I'd like to place a custom printing order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center gap-2 text-sm text-white/40 transition-colors hover:text-white"
              >
                <MessageCircle size={14} />
                WhatsApp Order
              </a>
            </div>
            {/* Was an email field whose value was discarded — the button next to
                it only ever opened WhatsApp. Now it's honestly a WhatsApp opt-in. */}
            <div className="mt-6">
              <h5 className="mb-2 text-sm font-medium">Offers &amp; new designs</h5>
              <p className="mb-3 text-xs leading-relaxed text-white/40">
                We send occasional offers on WhatsApp — no spam, leave any time.
              </p>
              <a
                href={wa("Hi Drucka! I'd like to get offers & new design updates on WhatsApp.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gold px-5 text-sm font-medium text-white transition-colors hover:bg-gold-dark"
              >
                <MessageCircle size={15} aria-hidden="true" />
                Get updates on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © 2026 Drucka · drucka.in · All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-white/30">UPI</span>
              <span className="text-xs text-white/30">COD</span>
              <span className="text-xs text-white/30">Cards</span>
              <span className="text-xs text-white/30">Net Banking</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
