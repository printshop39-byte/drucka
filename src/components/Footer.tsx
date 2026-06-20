import { Mail, Phone, Camera, MessageCircle } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

interface FooterProps {
  onTrack: () => void;
}

export default function Footer({ onTrack }: FooterProps) {
  const shopLinks = [
    { label: 'Photo Prints & Frames', href: '#photo-frames' },
    { label: 'Bestselling Frames', href: '#frames' },
    { label: 'Gallery Walls', href: '#gallery-walls' },
    { label: 'Statement Collection', href: '#statement' },
    { label: 'Magnetic Walls', href: '#magnetic' },
    { label: 'Gifting', href: '#gifting' },
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
                className="w-9 h-9 border border-white/20 hover:border-gold rounded-full flex items-center justify-center transition-colors group"
              >
                <Camera size={16} className="text-white/50 group-hover:text-gold transition-colors" />
              </a>
              <a
                href={wa('Hi Drucka!')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 border border-white/20 hover:border-gold rounded-full flex items-center justify-center transition-colors group"
              >
                <MessageCircle size={16} className="text-white/50 group-hover:text-gold transition-colors" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-white/40 hover:text-white transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={onTrack} className="text-sm text-white/40 hover:text-white transition-colors">
                  Track Order
                </button>
              </li>
              {['Shipping Policy', 'Return Policy', 'Bulk Orders'].map((item) => (
                <li key={item}>
                  <a
                    href={wa(`Hi Drucka! I have a question about: ${item}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/40 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li>
                <a href="#faq" className="text-sm text-white/40 hover:text-white transition-colors">FAQs</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <div className="space-y-3">
              <a href="mailto:printshop39@gmail.com" className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                <Mail size={14} />
                printshop39@gmail.com
              </a>
              <a href="tel:+917083811355" className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                <Phone size={14} />
                +91 70838 11355
              </a>
              <a
                href={wa("Hi Drucka! I'd like to place a custom printing order.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp Order
              </a>
            </div>
            <div className="mt-6">
              <h5 className="text-sm font-medium mb-3">Newsletter</h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 rounded-l-sm focus:outline-none focus:border-gold"
                />
                <a
                  href={wa("Hi Drucka! I'd like to join the newsletter for offers & new designs.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gold hover:bg-gold-dark text-white text-sm font-medium rounded-r-sm transition-colors"
                >
                  Join
                </a>
              </div>
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
