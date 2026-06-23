import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Upload } from 'lucide-react';

/* ── Mobile sticky action bar ──
   Hybrid mobile nav: the top hamburger menu (Navbar) stays for browsing;
   this fixed bottom bar carries the two conversion actions — the primary
   "Upload & Frame" CTA (opens the frame customizer, upload-first) and the
   cart. Mobile only (lg:hidden); desktop keeps the navbar cart icon.

   It auto-hides while scrolling down (reclaims reading space) and slides
   back up the moment the user scrolls up — intent to act. */

interface Props {
  cartCount: number;
  onUpload: () => void;
  onCart: () => void;
}

export default function MobileActionBar({ cartCount, onUpload, onCart }: Props) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      // ignore tiny jitters; always reveal near the very top of the page
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 140);
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-stone/40 bg-white/95 backdrop-blur-md transition-transform duration-300"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: hidden ? 'translateY(100%)' : 'translateY(0)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={onUpload}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md transition active:scale-[0.97]"
        >
          <Upload size={18} />
          Frame Your Photo
        </button>
        <button
          onClick={onCart}
          aria-label={`Open cart, ${cartCount} items`}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-stone/50 bg-white text-charcoal transition active:scale-95"
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
