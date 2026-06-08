"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOrderByRef, type OrderRow, type OrderStatus, type OrderItem } from "@/lib/orders";

// DRUCKA WhatsApp business number (digits only, country code, no +).
const WHATSAPP_NUMBER = "917083811355";

// Ecommerce-style tracking steps, in order.
const TRACKING_STEPS: { status: OrderStatus; label: string; description: string; icon: string }[] = [
  { status: "New", label: "Order Placed", description: "We received your order.", icon: "🧾" },
  { status: "In Design Review", label: "Design Review", description: "Your uploaded design is being checked.", icon: "🎨" },
  { status: "Printing", label: "Printing", description: "Your product is being printed.", icon: "🖨️" },
  { status: "Ready to Ship", label: "Ready to Ship", description: "Your order is packed and ready for pickup.", icon: "📦" },
  { status: "Delivered", label: "Delivered", description: "Your order has been delivered.", icon: "✅" },
];

// Computed delivery estimate text (no backend date needed yet).
function deliveryEstimate(status: OrderStatus): string {
  switch (status) {
    case "Delivered": return "Delivered";
    case "Ready to Ship": return "Estimated delivery: Today / Tomorrow";
    case "Printing": return "Estimated delivery: 2–4 days";
    case "In Design Review": return "Estimated delivery: 3–5 days";
    case "New":
    default: return "Estimated delivery: 4–6 days";
  }
}

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; order: OrderRow }
  | { kind: "notfound" }        // Supabase configured but no matching order
  | { kind: "manual" };          // Supabase not configured — manual tracking

export default function TrackOrderPage() {
  const [ref, setRef] = useState("");
  const [checked, setChecked] = useState(false);
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });

  async function checkStatus() {
    if (!ref.trim()) return;
    setChecked(true);
    setLookup({ kind: "loading" });
    const res = await getOrderByRef(ref);
    if (!res.configured) {
      setLookup({ kind: "manual" });
    } else if (res.found && res.order) {
      setLookup({ kind: "found", order: res.order });
    } else {
      setLookup({ kind: "notfound" });
    }
  }

  const waUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=` +
    encodeURIComponent(
      `Hi DRUCKA, I'd like to track my order.${ref.trim() ? ` Order Ref: ${ref.trim()}` : ""}`
    );

  // Found-order view is wider (timeline); everything else stays narrow.
  const wide = lookup.kind === "found";

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
        <div className={`${wide ? "max-w-[820px]" : "max-w-[560px]"} py-[18px] pb-16`}>
          {/* INPUT CARD */}
          <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
            <label className="block text-[0.82rem] font-bold mb-2" htmlFor="orderRef">Order Reference</label>
            <div className="flex gap-2 max-[480px]:flex-col">
              <input
                id="orderRef"
                className="input-premium flex-1"
                placeholder="DRK-YYYYMMDD-XXXX"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") checkStatus(); }}
              />
              <button className="btn-primary" onClick={checkStatus}>Check Status</button>
            </div>
          </div>

          {/* LOADING */}
          {checked && lookup.kind === "loading" && (
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
              <p className="text-brand-muted text-[0.9rem]">Looking up your order…</p>
            </div>
          )}

          {/* FOUND — full tracking view */}
          {lookup.kind === "found" && <TrackingView order={lookup.order} waUrl={waUrl} />}

          {/* NOT FOUND */}
          {checked && lookup.kind === "notfound" && (
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-full bg-brand-mint flex items-center justify-center text-[1.4rem]">🔍</span>
                <div className="font-bold text-[1.05rem]">Order not found</div>
              </div>
              <p className="text-brand-muted text-[0.88rem]">
                We couldn&apos;t find an order with that reference. Please double-check it,
                or contact us on WhatsApp and we&apos;ll help.
              </p>
              <a href={waUrl} className="btn-primary w-full mt-4" target="_blank" rel="noopener noreferrer">💬 Contact us on WhatsApp</a>
            </div>
          )}

          {/* MANUAL (Supabase not configured) */}
          {checked && lookup.kind === "manual" && (
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-full bg-brand-mint flex items-center justify-center text-[1.4rem]">📦</span>
                <div>
                  <div className="font-bold text-[1.05rem]">{ref.trim() || "Your order"}</div>
                  <span className="badge badge-gold mt-1">Status: Processing</span>
                </div>
              </div>
              <p className="text-brand-muted text-[0.88rem]">
                Tracking is currently manual. Please contact us on WhatsApp with your
                order reference and we&apos;ll share the latest status of your order.
              </p>
              <a href={waUrl} className="btn-primary w-full mt-4" target="_blank" rel="noopener noreferrer">💬 Contact us on WhatsApp</a>
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
              <a href={waUrl} className="btn-primary" target="_blank" rel="noopener noreferrer">💬 WhatsApp Us</a>
              <a href="mailto:hello@drucka.in" className="btn-ghost">✉️ hello@drucka.in</a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Full tracking view: status card + timeline + ETA + item summary.
// ---------------------------------------------------------------------------
function TrackingView({ order, waUrl }: { order: OrderRow; waUrl: string }) {
  const currentIndex = Math.max(0, TRACKING_STEPS.findIndex((s) => s.status === order.status));
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const eta = deliveryEstimate(order.status);

  return (
    <div className="space-y-6 mb-6">
      {/* STATUS CARD */}
      <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-brand-muted text-[0.78rem] uppercase tracking-wide font-bold">Order</div>
            <div className="font-heading text-[1.4rem]">{order.order_ref}</div>
            <div className="text-brand-muted text-[0.84rem] mt-1">
              {order.customer_name} · ₹{Number(order.total).toLocaleString("en-IN")} · {order.payment_method}
            </div>
          </div>
          <span className={`badge ${order.status === "Delivered" ? "badge-dark" : "badge-green"} text-[0.8rem]`}>{order.status}</span>
        </div>
        <div className="mt-4 bg-brand-mint border border-brand-border rounded-[0.9rem] p-[12px_16px] flex items-center gap-2 text-[0.9rem] font-semibold text-brand-primary">
          <span className="text-[1.1rem]">🚚</span> {eta}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6">
        <div className="eyebrow mb-5">Progress</div>

        {/* Desktop: horizontal */}
        <div className="hidden min-[640px]:flex items-start justify-between relative">
          {TRACKING_STEPS.map((step, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return (
              <div key={step.status} className="flex-1 flex flex-col items-center text-center relative">
                {/* connector line to next step */}
                {i < TRACKING_STEPS.length - 1 && (
                  <div className={`absolute top-[22px] left-1/2 w-full h-[3px] ${i < currentIndex ? "bg-brand-primary" : "bg-brand-border"}`} />
                )}
                <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-[1.2rem] border-2 ${
                  done ? "bg-brand-primary border-brand-primary text-white"
                  : current ? "bg-white border-brand-gold text-brand-ink shadow-glow"
                  : "bg-brand-mint border-brand-border text-brand-muted"
                }`}>
                  {done ? "✓" : step.icon}
                </div>
                <div className={`mt-2 text-[0.82rem] font-bold px-1 ${current ? "text-brand-primary" : done ? "text-brand-ink" : "text-brand-muted"}`}>{step.label}</div>
                <div className="text-[0.72rem] text-brand-muted px-1 mt-[2px] max-w-[120px]">{step.description}</div>
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical */}
        <div className="min-[640px]:hidden flex flex-col">
          {TRACKING_STEPS.map((step, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return (
              <div key={step.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[1.1rem] border-2 ${
                    done ? "bg-brand-primary border-brand-primary text-white"
                    : current ? "bg-white border-brand-gold text-brand-ink shadow-glow"
                    : "bg-brand-mint border-brand-border text-brand-muted"
                  }`}>
                    {done ? "✓" : step.icon}
                  </div>
                  {i < TRACKING_STEPS.length - 1 && (
                    <div className={`w-[3px] flex-1 min-h-[26px] ${i < currentIndex ? "bg-brand-primary" : "bg-brand-border"}`} />
                  )}
                </div>
                <div className="pb-5">
                  <div className={`text-[0.9rem] font-bold ${current ? "text-brand-primary" : done ? "text-brand-ink" : "text-brand-muted"}`}>{step.label}</div>
                  <div className="text-[0.78rem] text-brand-muted">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ITEM SUMMARY */}
      <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6">
        <div className="eyebrow mb-3">Items ({items.length})</div>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-brand-border last:border-b-0 pb-3 last:pb-0">
              {it.designImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={it.designImageUrl} alt="Design" className="w-12 h-12 object-contain rounded-[0.5rem] border border-brand-border bg-brand-mint shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-[0.5rem] bg-brand-mint flex items-center justify-center text-[1.4rem] shrink-0">🎁</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[0.9rem]">{it.name}{it.size ? ` · ${it.size}` : ""}</div>
                <div className="text-brand-muted text-[0.82rem]">Qty {it.qty} · ₹{Number(it.price).toLocaleString("en-IN")}</div>
              </div>
              {it.designImageUrl && (
                <a href={it.designImageUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary text-[0.8rem] font-semibold hover:underline shrink-0">View design ↗</a>
              )}
            </div>
          ))}
        </div>
        <a href={waUrl} className="btn-ghost w-full mt-4 !text-[0.86rem]" target="_blank" rel="noopener noreferrer">💬 Questions? Contact us on WhatsApp</a>
      </div>
    </div>
  );
}
