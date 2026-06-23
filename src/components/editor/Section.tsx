import { useState } from 'react';
import { ChevronDown, Crown } from 'lucide-react';

/* collapsible panel section — keeps the side panel premium, not crowded.
   `pro` shows a gold crown to mark a premium effect (PicMonkey-style). */
export default function Section({ title, defaultOpen = false, pro = false, children }: {
  title: string; defaultOpen?: boolean; pro?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold/90">
          {title}
          {pro && <Crown size={11} className="text-gold-light" aria-label="Pro feature" />}
        </span>
        <ChevronDown size={13} className={`text-white/35 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3.5">{children}</div>}
    </div>
  );
}
