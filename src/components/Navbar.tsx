import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, X, ShoppingBag, ChevronDown, Search } from 'lucide-react';

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

/* Desktop nav is deliberately three items — Products, Gallery Walls,
   Corporate/Bulk — so the primary CTA stays the loudest thing in the bar.
   Everything else lives inside the Products mega-menu. */
const SHOP_LINKS: Array<{ name: string; href: string; action?: 'mini' }> = [
  { name: 'Photo Frames', href: '#photo-frames' },
  { name: 'Photo Prints', href: '#catalog' },
  /* opens the real /mini-prints route rather than just scrolling — the previous
     nav checked `link.action` on items that never had one, so this never fired */
  { name: 'Mini Prints', href: '/mini-prints', action: 'mini' as const },
  { name: 'Statement Collection', href: '#statement' },
  { name: 'Phone Cases & Gifting', href: '#phone-cases' },
];

/* Preserved from the previous nav — these drive the frame-style picker in
   PhotoFramesSection via onPickFrame. Removing them would drop a live feature. */
const FRAME_STYLES = [
  { name: 'Classic Black', id: 'classic-black' },
  { name: 'Premium Golden', id: 'premium-golden' },
  { name: 'Wooden Brown', id: 'wooden-brown' },
  { name: 'White Minimal', id: 'white-minimal' },
  { name: 'Designer Black Gold', id: 'designer-black-gold' },
  { name: 'Traditional Ornate', id: 'traditional-ornate' },
];

export default function Navbar({ topOffset, cartCount, onCartOpen, onCollage, onMini, onUpload, onPickFrame, searchProducts = [], onSearchSelect, onSearch }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  /* True while the menu is open only because the pointer is hovering it.
     Without this, hover opens the menu and the very next click toggles it
     shut — so clicking "Products" on a mouse looked like it did nothing,
     and the Collage Maker entry inside was unreachable that way. */
  const openedByHoverRef = useRef(false);

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

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!q) return;
    const t = window.setTimeout(() => onSearch?.(q), 600);
    return () => window.clearTimeout(t);
  }, [q, onSearch]);

  /* The mega-menu opens on click AND hover, never hover-only — touch users and
     keyboard users get the same access. Escape and outside-click close it. */
  useEffect(() => {
    if (!productsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProductsOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (!productsRef.current?.contains(e.target as Node)) setProductsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [productsOpen]);

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };
  const pickResult = (id: string) => { onSearchSelect?.(id); closeSearch(); };
  const closeAll = () => { setMobileOpen(false); setProductsOpen(false); };

  /* 44×44 minimum tap target for every icon control in the bar */
  const iconBtn = 'grid h-11 w-11 place-items-center rounded-full text-charcoal/70 transition hover:bg-cream hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

  return (
    <nav
      className="fixed left-0 right-0 z-50 border-b border-stone/50 bg-white/95 backdrop-blur-md transition-all duration-300"
      style={{ top: topOffset ? '36px' : '0' }}
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Mobile menu button */}
          <button
            className={`lg:hidden -ml-2 ${iconBtn}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <a href="#top" className="flex items-center" onClick={closeAll}>
            <div className="flex h-8 w-8 items-center justify-center border-2 border-charcoal">
              <div className="h-5 w-5 border border-gold"></div>
            </div>
            <span className="ml-3 font-serif text-xl font-bold tracking-wide text-charcoal lg:text-2xl">
              DRUCKA
            </span>
          </a>

          {/* Desktop Nav — three destinations only */}
          <div className="hidden items-center gap-8 lg:flex">
            <div
              ref={productsRef}
              className="relative"
              onMouseEnter={() => { if (!productsOpen) openedByHoverRef.current = true; setProductsOpen(true); }}
              onMouseLeave={() => { openedByHoverRef.current = false; setProductsOpen(false); }}
            >
              <button
                /* Click-first: if hover already opened the menu, the first
                   click pins it open instead of toggling it shut. A second
                   click then closes it. Touch and keyboard never set the
                   hover flag, so there it behaves as a plain toggle. */
                onClick={() => {
                  if (productsOpen && openedByHoverRef.current) {
                    openedByHoverRef.current = false; // now owned by the click
                    return;
                  }
                  setProductsOpen((v) => !v);
                }}
                aria-expanded={productsOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm font-medium uppercase tracking-wide text-charcoal/80 transition-colors hover:text-charcoal"
              >
                Products
                <ChevronDown size={14} className={productsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {productsOpen && (
                <div
                  /* w-max: an absolutely-positioned box shrink-to-fits against
                     its containing block, which here is only as wide as the
                     "Products" button (~98px). Without it the white card stayed
                     98px while the two 190px columns rendered outside it, on
                     top of the page behind. */
                  className="absolute left-0 top-full w-max pt-2"
                >
                  <div className="grid grid-cols-2 gap-6 rounded-2xl border border-stone/50 bg-white p-6 shadow-xl">
                    <div className="min-w-[190px]">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">Shop</p>
                      {SHOP_LINKS.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          onClick={(e) => { if (item.action === 'mini') { e.preventDefault(); onMini?.(); } setProductsOpen(false); }}
                          className="block rounded-lg px-2 py-2 text-sm text-charcoal/75 transition-colors hover:bg-cream hover:text-charcoal"
                        >
                          {item.name}
                        </a>
                      ))}
                      <button
                        onClick={() => { setProductsOpen(false); onCollage(); }}
                        className="block w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-gold-dark transition-colors hover:bg-cream"
                      >
                        Collage Maker
                      </button>
                    </div>
                    <div className="min-w-[190px]">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">Frame styles</p>
                      {FRAME_STYLES.map((item) => (
                        <a
                          key={item.id}
                          href="#photo-frames"
                          onClick={() => { setProductsOpen(false); onPickFrame?.(item.id); }}
                          className="block rounded-lg px-2 py-2 text-sm text-charcoal/75 transition-colors hover:bg-cream hover:text-charcoal"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="#gallery-walls" className="text-sm font-medium uppercase tracking-wide text-charcoal/80 transition-colors hover:text-charcoal">
              Gallery Walls
            </a>
            <a href="#corporate" className="text-sm font-medium uppercase tracking-wide text-charcoal/80 transition-colors hover:text-charcoal">
              Corporate / Bulk
            </a>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className={iconBtn}
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <button
              onClick={onCartOpen}
              className={`relative ${iconBtn}`}
              aria-label={`Open cart, ${cartCount} items`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={onUpload}
              className="ml-1 hidden min-h-[44px] items-center gap-2 rounded-xl bg-gold px-5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:flex"
            >
              Start Customising
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
                className="w-full rounded-full border border-stone/60 bg-white py-3 pl-12 pr-4 text-base text-charcoal outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/20"
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
                        <img src={p.img} alt="" width={40} height={40} className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" loading="lazy" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-charcoal">{p.name}</span>
                        {p.tag && <span className="block truncate text-xs text-charcoal/50">{p.tag}</span>}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-wide text-gold-dark">Customise →</span>
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
        <div className="max-h-[70vh] overflow-y-auto border-t border-stone/30 bg-white lg:hidden">
          <div className="px-5 py-4">
            <button
              onClick={() => { setMobileOpen(false); onUpload?.(); }}
              className="mb-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold uppercase tracking-wide text-white"
            >
              Start Customising
            </button>

            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">Shop</p>
            {SHOP_LINKS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex min-h-[44px] items-center text-sm font-medium uppercase tracking-wide text-charcoal/80"
                onClick={(e) => { if (item.action === 'mini') { e.preventDefault(); onMini?.(); } setMobileOpen(false); }}
              >
                {item.name}
              </a>
            ))}
            <a
              href="#gallery-walls"
              className="flex min-h-[44px] items-center text-sm font-medium uppercase tracking-wide text-charcoal/80"
              onClick={() => setMobileOpen(false)}
            >
              Gallery Walls
            </a>
            <a
              href="#corporate"
              className="flex min-h-[44px] items-center text-sm font-medium uppercase tracking-wide text-charcoal/80"
              onClick={() => setMobileOpen(false)}
            >
              Corporate / Bulk
            </a>
            <button
              onClick={() => { setMobileOpen(false); onCollage(); }}
              className="flex min-h-[44px] w-full items-center text-left text-sm font-medium uppercase tracking-wide text-gold-dark"
            >
              Collage Maker
            </button>

            <p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-dark">Frame styles</p>
            <div className="grid grid-cols-2 gap-x-3">
              {FRAME_STYLES.map((item) => (
                <a
                  key={item.id}
                  href="#photo-frames"
                  onClick={() => { setMobileOpen(false); onPickFrame?.(item.id); }}
                  className="flex min-h-[44px] items-center text-sm text-charcoal/70"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
