"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// DRUCKA WhatsApp business number (digits only, country code, no +).
const WHATSAPP_NUMBER = "917083811355";

export default function TrackOrderPage() {
  const [ref, setRef] = useState("");
  const [checked, setChecked] = useState(false);

  function checkStatus() {
    if (!ref.trim()) return;
    setChecked(true);
  }

  const waUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(
      `Hi DRUCKA, I'd like to track my order.${ref.trim() ? ` Order Ref: ${ref.trim()}` : ""}`
    );

  return (
    <>
      <Navbar />

      <div className="pt-[34px] pb-[10px]">
        <div className="wrap">
          <span className="eyebrow">Order Status</span>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] mt-3">Track Your Order</h1>
          <p className="text-brand-muted mt-[6px]">
            Enter your order reference (e.g. DRK-20260607-AB12) to check its status.
          </p>
        </div>
      </div>

      <div className="wrap">
        <div className="max-w-[560px] py-[18px] pb-16">
          {/* INPUT CARD */}
          <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
            <label className="block text-[0.82rem] font-bold mb-2" htmlFor="orderRef">
              Order Reference
            </label>
            <div className="flex gap-2 max-[480px]:flex-col">
              <input
                id="orderRef"
                className="input-premium flex-1"
                placeholder="DRK-YYYYMMDD-XXXX"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") checkStatus(); }}
              />
              <button className="btn-primary" onClick={checkStatus}>
                Check Status
              </button>
            </div>
          </div>

          {/* STATUS CARD (placeholder) */}
          {checked && (
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-full bg-brand-mint flex items-center justify-center text-[1.4rem]">
                  📦
                </span>
                <div>
                  <div className="font-bold text-[1.05rem]">
                    {ref.trim() || "Your order"}
                  </div>
                  <span className="badge badge-gold mt-1">Status: Processing</span>
                </div>
              </div>
              <p className="text-brand-muted text-[0.88rem]">
                Tracking is currently manual. Please contact us on WhatsApp with your
                order reference and we&apos;ll share the latest status of your order.
              </p>
              <a href={waUrl} className="btn-primary w-full mt-4" target="_blank" rel="noopener noreferrer">
                💬 Contact us on WhatsApp
              </a>
            </div>
          )}

          {/* HELP CARD */}
          <div className="bg-gradient-to-br from-white to-brand-mint border border-brand-border rounded-premium shadow-soft p-6">
            <h3 className="font-heading text-[1.2rem] mb-1">Need help?</h3>
            <p className="text-brand-muted text-[0.88rem] mb-4">
              Don&apos;t have your reference, or have a question about your order? Reach
              us directly — we&apos;re happy to help.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a href={waUrl} className="btn-primary" target="_blank" rel="noopener noreferrer">
                💬 WhatsApp Us
              </a>
              <a href="mailto:hello@drucka.in" className="btn-ghost">
                ✉️ hello@drucka.in
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
