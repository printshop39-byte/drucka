import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/* collapsible panel section — keeps the side panel premium, not crowded */
export default function Section({ title, defaultOpen = false, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold/90">{title}</span>
        <ChevronDown size={13} className={`text-white/35 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3.5">{children}</div>}
    </div>
  );
}
