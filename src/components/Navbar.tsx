import { useState } from 'react';
import { Menu, X, ShoppingBag, ChevronDown } from 'lucide-react';

interface NavbarProps {
  topOffset: boolean;
  cartCount: number;
  onCartOpen: () => void;
  onCollage: () => void;
  onMini?: () => void;
  onPickFrame?: (id: string) => void;
}

export default function Navbar({ topOffset, cartCount, onCartOpen, onCollage, onMini, onPickFrame }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navLinks = [
    { name: 'Prints & Frames', href: '#photo-frames' },
    { name: 'Frames', href: '#photo-frames', dropdown: [
      { name: 'Classic Black', id: 'classic-black' },
      { name: 'Premium Golden', id: 'premium-golden' },
      { name: 'Wooden Brown', id: 'wooden-brown' },
      { name: 'White Minimal', id: 'white-minimal' },
      { name: 'Designer Black Gold', id: 'designer-black-gold' },
      { name: 'Traditional Ornate', id: 'traditional-ornate' },
    ] },
    { name: 'Gallery Walls', href: '#gallery-walls' },
    { name: 'Statement Collection', href: '#statement' },
    { name: 'Mini Prints', href: '#mini-prints' },
    { name: 'Gifting', href: '#phone-cases' },
  ];

  return (
    <nav
      className="fixed left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone/50 transition-all duration-300"
      style={{ top: topOffset ? '36px' : '0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2 text-charcoal"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <a href="#top" className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-8 h-8 border-2 border-charcoal flex items-center justify-center">
                <div className="w-5 h-5 border border-gold"></div>
              </div>
              <span className="ml-3 text-xl lg:text-2xl font-serif font-bold tracking-wide text-charcoal">
                DRUCKA
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.href}
                  onClick={link.action === 'mini' ? (e) => { e.preventDefault(); onMini?.(); } : undefined}
                  className="flex items-center gap-1 text-sm font-medium text-charcoal/80 hover:text-charcoal transition-colors tracking-wide uppercase"
                >
                  {link.name}
                  {link.dropdown && <ChevronDown size={14} />}
                </a>
                {link.dropdown && activeDropdown === link.name && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="bg-white shadow-xl rounded-lg border border-stone/50 py-2 min-w-[200px]">
                      {link.dropdown.map((item) => (
                        <a
                          key={item.id}
                          href="#photo-frames"
                          onClick={() => { setActiveDropdown(null); onPickFrame?.(item.id); }}
                          className="block px-4 py-2 text-sm text-charcoal/70 hover:text-charcoal hover:bg-cream transition-colors"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={onCollage}
              className="text-sm font-medium text-gold-dark hover:text-charcoal transition-colors tracking-wide uppercase"
            >
              Collage Maker
            </button>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCartOpen}
              className="p-2 text-charcoal/70 hover:text-charcoal transition-colors relative"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-stone/30">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-sm font-medium text-charcoal/80 uppercase tracking-wide"
                onClick={(e) => { if (link.action === 'mini') { e.preventDefault(); onMini?.(); } setMobileOpen(false); }}
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => { setMobileOpen(false); onCollage(); }}
              className="block w-full py-2 text-left text-sm font-medium text-gold-dark uppercase tracking-wide"
            >
              Collage Maker
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
