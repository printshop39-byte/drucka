import { useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';

const wa = (m: string) => `https://wa.me/917083811355?text=${encodeURIComponent(m)}`;

export interface LightboxItem {
  image: string;
  title: string;
  subtitle?: string;
  price?: string;
  badge?: string;
  waMessage: string;
}

/* Shared zoom / preview lightbox used across the product showcase sections.
   Click a card → view the photo large → then a deliberate "Order on WhatsApp". */
export default function Lightbox({ item, onClose }: { item: LightboxItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-charcoal/90 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition"
      >
        <X size={20} />
      </button>

      <img
        src={item.image}
        alt={`${item.title} — zoomed view | Drucka`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[72vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
      />

      <div className="mt-5 flex flex-col items-center gap-2 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <h3 className="font-serif text-xl font-semibold text-white">{item.title}</h3>
          {item.price && <span className="text-lg font-bold text-gold-light">{item.price}</span>}
        </div>
        {item.subtitle && <p className="max-w-md text-sm text-white/60">{item.subtitle}</p>}
        <a
          href={wa(item.waMessage)}
          target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-gold-dark transition"
        >
          <MessageCircle size={18} /> Order on WhatsApp
        </a>
        <span className="text-[11px] text-white/40">We confirm the details & share a payment link on WhatsApp.</span>
      </div>
    </div>
  );
}
