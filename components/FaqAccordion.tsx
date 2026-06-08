"use client";

import { useState } from "react";

const FAQS = [
  { q: "Can I upload my own image?", a: "Yes — upload any photo or design (PNG/JPG up to 20MB) on the Customize page and preview it live on the product." },
  { q: "How long does delivery take?", a: "Most orders are printed and delivered within 2–4 days across India." },
  { q: "Can I track my order?", a: "Yes. Use the Track Order page with the DRK reference you receive on WhatsApp to see your live status." },
  { q: "How do I place an order?", a: "Customize your product, add it to cart, fill your delivery details, and tap Place Order — your order opens pre-filled in WhatsApp to confirm." },
];

export default function FaqAccordion() {
  // No item open by default — deterministic, hydration-safe (-1 = none).
  const [open, setOpen] = useState(-1);

  return (
    <div className="space-y-3 max-w-[760px] mx-auto">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className={`border rounded-premium overflow-hidden transition ${isOpen ? "border-brand-gold/50 bg-white shadow-soft" : "border-brand-border bg-white"}`}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer"
            >
              <span className="font-bold text-[0.96rem] text-brand-ink">{f.q}</span>
              <span className={`text-brand-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
            </button>
            {isOpen && <p className="text-brand-muted text-[0.9rem] px-4 pb-4">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
