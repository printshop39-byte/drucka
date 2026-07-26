import type { MouseEvent } from 'react';
import { Home, LayoutGrid, Upload, ShoppingBag, MessageCircle } from 'lucide-react';

/* ── Mobile sticky bottom nav ──
   App-style tab bar (mobile + tablet only; desktop uses the navbar).
   Five conversion-first destinations: Home · Products · Upload · Cart ·
   WhatsApp. The middle "Upload" is raised + gold as the primary action. */

interface Props {
  cartCount: number;
  onUpload: () => void;
  onCart: () => void;
  whatsappUrl: string;
  /* Same reason as the navbar: this bar renders on every route, including the
     SEO landings and policy pages where the homepage sections do not exist.
     Bare `#top` / `#photo-frames` were inert on exactly those pages. */
  onNavigate?: (path: string) => void;
}

export default function MobileActionBar({ cartCount, onUpload, onCart, whatsappUrl, onNavigate }: Props) {
  const itemCls =
    'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-charcoal/70 transition active:scale-95';

  const navigate = (e: MouseEvent, href: string) => {
    if (!onNavigate) return;
    e.preventDefault();
    onNavigate(href);
  };

  return (
    <nav
      aria-label="Quick actions"
      className="lg:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-stone/40 bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        <a href="/#top" onClick={(e) => navigate(e, '/#top')} className={itemCls}>
          <Home size={20} />
          Home
        </a>
        <a href="/#catalog" onClick={(e) => navigate(e, '/#catalog')} className={itemCls}>
          <LayoutGrid size={20} />
          Products
        </a>

        {/* primary — raised gold upload */}
        <button onClick={onUpload} className="flex flex-1 flex-col items-center justify-end gap-1 py-1.5" aria-label="Upload your design">
          <span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-gold text-white shadow-lg ring-4 ring-white transition active:scale-95">
            <Upload size={20} />
          </span>
          <span className="text-[10px] font-bold text-charcoal">Upload</span>
        </button>

        <button onClick={onCart} aria-label={`Open cart, ${cartCount} items`} className={`relative ${itemCls}`}>
          <span className="relative">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </span>
          Cart
        </button>

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={itemCls} style={{ color: '#1ba34e' }}>
          <MessageCircle size={20} />
          WhatsApp
        </a>
      </div>
    </nav>
  );
}
