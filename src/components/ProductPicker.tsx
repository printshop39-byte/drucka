import { ArrowRight, X } from 'lucide-react';
import useModalA11y from '../hooks/useModalA11y';
import { isEnquiry } from '../lib/orderMode';

/* ── "What would you like to create?" ──
   Until now every generic entry point on the site — the hero's "Start
   Customising", the mobile bar's Upload button, both navbar CTAs — dropped the
   visitor straight into the FRAME customizer regardless of what they came for.
   Someone arriving to print photos had to discover on their own that they were
   in the wrong editor.

   This sheet is the one place that decision gets made. Every tile names a real
   product and routes to that product's own editor. */

export type PickerTarget =
  | 'photo-prints' | 'mini-prints' | 'frame' | 'tshirt'
  | 'mug' | 'canvas' | 'collage' | 'bulk';

interface Item {
  id: PickerTarget;
  title: string;
  sub: string;
  price: string;
  img: string;
  /** designer product id, for tiles that open a Qikink-made product: those
   *  are ordered by enquiry, so the tile shows no price (lib/orderMode.js) */
  designerId?: string;
}

/* Order is deliberate: cheapest, highest-intent entry points first. */
const ITEMS: Item[] = [
  { id: 'photo-prints', title: 'Photo Prints',  sub: '4×6 to A3 · single prints', price: 'from ₹39',   img: '/images/prints/print-1.webp' },
  { id: 'mini-prints',  title: 'Mini Prints',   sub: 'Wallet & scrapbook packs',  price: '₹19 · min 10', img: '/images/mini/mini-3x3.jpg' },
  { id: 'frame',        title: 'Photo Frames',  sub: 'Gold, black, wood',         price: 'from ₹899',  img: '/images/frames/premium-golden-live.webp' },
  { id: 'tshirt',       title: 'T-Shirts',      sub: 'Front & back, full colour', price: 'from ₹599',  img: '/images/tshirt.webp', designerId: 'tshirt' },
  { id: 'mug',          title: 'Photo Mugs',    sub: 'Edge-to-edge wrap print',   price: 'from ₹299',  img: '/images/mug.webp', designerId: 'mug' },
  { id: 'canvas',       title: 'Canvas Prints', sub: 'Ready to hang', price: 'from ₹500', img: '/mockups/canvas-front-white.webp', designerId: 'canvas' },
  { id: 'collage',      title: 'Photo Collage', sub: 'Many photos, one print',    price: 'from ₹99',   img: '/images/prints/print-2.webp' },
  { id: 'bulk',         title: 'Bulk & Corporate', sub: 'Events, teams, gifting', price: 'Get a quote', img: '/images/categories/men-tshirt.webp' },
];

export default function ProductPicker({
  onPick, onClose,
}: { onPick: (id: PickerTarget) => void; onClose: () => void }) {
  const ref = useModalA11y(onClose);

  return (
    <div
      className="fixed inset-0 z-[96] flex items-end justify-center bg-charcoal/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
        /* bottom sheet on phones, centred card from sm up. max-h + internal
           scroll so eight tiles never push the close button off-screen. */
        className="flex max-h-[90svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-start gap-3 border-b border-stone/50 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <h2 id="picker-title" className="font-serif text-xl text-charcoal sm:text-2xl">
              What would you like to create?
            </h2>
            <p className="mt-0.5 text-sm text-charcoal/55" lang="mr">
              तुम्हाला काय बनवायचं आहे?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full text-charcoal/50 transition hover:bg-black/5 hover:text-charcoal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto p-4 sm:grid-cols-4 sm:gap-3 sm:p-6">
          {ITEMS.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onPick(it.id)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-stone/60 bg-white text-left transition hover:border-gold hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span className="block aspect-[4/3] w-full overflow-hidden bg-stone/30">
                <img
                  src={it.img}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </span>
              {/* sized for a two-line subtitle: at 375px the longer ones wrap, and a
                  short tile was clipping its own price line */}
              <span className="flex min-h-[84px] flex-1 flex-col px-3 py-2.5">
                <span className="text-sm font-bold text-charcoal">{it.title}</span>
                <span className="mt-0.5 text-[11px] leading-snug text-charcoal/50">{it.sub}</span>
                <span className="mt-auto pt-1.5 text-[11px] font-bold text-gold-dark">{it.designerId && isEnquiry(it.designerId) ? 'Price on enquiry' : it.price}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="border-t border-stone/50 px-5 py-3 text-center text-[11px] text-charcoal/45 sm:px-7">
          Not sure? <button type="button" onClick={() => onPick('bulk')} className="font-semibold text-gold-dark underline underline-offset-2">
            Ask us on WhatsApp <ArrowRight size={11} className="inline" />
          </button>
        </p>
      </div>
    </div>
  );
}
