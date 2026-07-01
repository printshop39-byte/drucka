import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, X, ShoppingBag, ChevronDown, Upload, Search } from 'lucide-react';

interface SearchProduct {
  id: string;
  name: string;
  category?: string;
  tag?: string;
  img?: string;
}

interface NavbarProps {
  topOffset: boolean;
  cartCount: number;
  onCartOpen: () => void;
  onCollage: () => void;
  onMini?: () => void;
  onUpload?: () => void;
  onPickFrame?: (id: string) => void;
  searchProducts?: SearchProduct[];
  onSearchSelect?: (id: string) => void;
  onSearch?: (term: string) => void;
}

export default function Navbar({ topOffset, cartCount, onCartOpen, onCollage, onMini, onUpload, onPickFrame, searchProducts = [], onSearchSelect, onSearch }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  /* ── Product search ─────────────────────────────────────────── */
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return searchProducts
      .filter((p) => [p.name, p.category, p.tag].filter(Boolean).some((f) => f!.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [q, searchProducts]);

  /* focus the field when the search panel opens */
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  /* fire Meta Pixel Search once typing settles (debounced) */
  useEffect(() => {
    if (!q) return;
    const t = window.setTimeout(() => onSearch?.(q), 600);
    return () => window.clearTimeout(t);
  }, [q, onSearch]);

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };
  const pickResult = (id: string) => { onSearchSelect?.(id); closeSearch(); };

  const navLinks = [
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
        <div className="flex items-center justify-between h-16">
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
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 text-charcoal/70 hover:text-charcoal transition-colors"
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <button
              onClick={onUpload}
              className="hidden lg:flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-gold-dark"
            >
              <Upload size={15} /> Choose Photo
            </button>
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

        {/* Search panel */}
        {searchOpen && (
          <div className="pb-4">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Enter' && results[0]) pickResult(results[0].id); }}
                placeholder="Search products — t-shirt, mug, frame, canvas…"
                aria-label="Search products"
                className="w-full rounded-full border border-stone/60 bg-white py-3 pl-12 pr-4 text-sm text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </div>

            {q && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-stone/50 bg-white shadow-xl">
                {results.length > 0 ? (
                  results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pickResult(p.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cream"
                    >
                      {p.img && (
                        <img src={p.img} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" loading="lazy" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-charcoal">{p.name}</span>
                        {p.tag && <span className="block truncate text-xs text-charcoal/50">{p.tag}</span>}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-gold-dark">Customize →</span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-4 text-sm text-charcoal/60">No products match &ldquo;<span className="font-semibold text-charcoal">{query}</span>&rdquo;.</p>
                )}
              </div>
            )}
          </div>
        )}
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
            <button
              onClick={() => { setMobileOpen(false); onUpload?.(); }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-sm font-bold uppercase tracking-wide text-white"
            >
              <Upload size={16} /> Choose Photo
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
