"use client";

import { useState } from "react";

const STEPS = [
  { n: "1", icon: "🛍️", title: "Choose a product", body: "Pick from T-shirts, mugs, frames, cushions, canvas and keychains." },
  { n: "2", icon: "⬆️", title: "Upload your design", body: "Add your photo, artwork or text — PNG or JPG up to 20MB." },
  { n: "3", icon: "🎨", title: "Customize & preview", body: "Resize, rotate and position your design with a live preview." },
  { n: "4", icon: "📦", title: "We print & deliver", body: "Premium printing, gift-ready packaging, delivered in 2–4 days." },
];

export default function HowItWorksAccordion() {
  // First step open by default — deterministic, so server/client match.
  const [open, setOpen] = useState(0);

  return (
    <div className="grid md:[grid-template-columns:1fr_1fr] gap-8 items-start">
      {/* Accordion */}
      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const isOpen = open === i;
          return (
            <div
              key={s.n}
              className={`border rounded-premium overflow-hidden transition ${isOpen ? "border-brand-gold/50 bg-white shadow-soft" : "border-brand-border bg-white/70"}`}
            >
              <button
                onClick={() => setOpen(i)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
              >
                <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-heading font-extrabold text-[0.95rem] ${isOpen ? "bg-brand-primary text-white" : "bg-brand-mint text-brand-primary"}`}>{s.n}</span>
                <span className="font-bold text-[1rem] text-brand-ink flex-1">{s.title}</span>
                <span className={`text-brand-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
              </button>
              {isOpen && (
                <p className="text-brand-muted text-[0.9rem] px-4 pb-4 pl-[3.7rem]">{s.body}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual side */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-premium p-8 shadow-premium relative overflow-hidden">
        <div className="absolute -right-10 -top-12 w-[220px] h-[220px] rounded-full bg-brand-gold/25 blur-[60px]" />
        <div className="relative">
          <span className="text-[2.6rem]">{STEPS[open].icon}</span>
          <h3 className="font-heading text-[1.5rem] mt-3 text-white">{STEPS[open].title}</h3>
          <p className="text-white/80 mt-2 text-[0.95rem]">{STEPS[open].body}</p>
          <div className="flex gap-2 mt-6">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-[6px] rounded-full transition-all ${i === open ? "w-7 bg-brand-gold" : "w-3 bg-white/30"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
