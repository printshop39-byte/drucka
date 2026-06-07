"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartItem from "@/components/CartItem";
import { useCart } from "@/components/CartContext";
import { designImageLine } from "@/lib/uploadDesign";

const FREE_SHIP_THRESHOLD = 999;
const SHIP_FEE = 49;
// DRUCKA WhatsApp business number (digits only, country code, no +).
const WHATSAPP_NUMBER = "917083811355";
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// Order reference: DRK-YYYYMMDD-XXXX (XXXX = random 4-char base36, uppercase)
function makeOrderRef() {
  const d = new Date();
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DRK-${ymd}-${rand}`;
}

interface Delivery {
  name: string; phone: string; email: string; address: string; city: string; pincode: string;
}
const EMPTY_DELIVERY: Delivery = { name: "", phone: "", email: "", address: "", city: "", pincode: "" };

export default function CartPage() {
  const { items, setQty, removeItem, subtotal } = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMsg, setCouponMsg] = useState<"ok" | "bad" | null>(null);
  const [pay, setPay] = useState("upi");
  const [placed, setPlaced] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery>(EMPTY_DELIVERY);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = (k: keyof Delivery) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDelivery((d) => ({ ...d, [k]: e.target.value }));

  const sub = subtotal;
  const freeShip = sub >= FREE_SHIP_THRESHOLD || sub === 0;
  const shipping = freeShip ? 0 : SHIP_FEE;
  const discount = couponApplied ? Math.round(sub * 0.1) : 0;
  const total = Math.max(0, sub + shipping - discount);

  function applyCoupon() {
    if (coupon.trim().toUpperCase() === "DRUCKA10") {
      setCouponApplied(true);
      setCouponMsg("ok");
    } else {
      setCouponMsg("bad");
    }
  }

  function placeOrder() {
    if (items.length === 0) return;

    // --- validation (email optional) ---
    const required: [keyof Delivery, string][] = [
      ["name", "Full Name"], ["phone", "Phone"], ["address", "Address"],
      ["city", "City"], ["pincode", "Pincode"],
    ];
    const missing = required.filter(([k]) => !delivery[k].trim()).map(([, label]) => label);
    if (missing.length) {
      setFormError(`Please fill: ${missing.join(", ")}.`);
      return;
    }
    setFormError(null);

    // --- generate order reference ---
    const ref = makeOrderRef();

    // --- build order summary message ---
    const lines: string[] = [];
    lines.push("*New DRUCKA Order*");
    lines.push(`Order Ref: ${ref}`);
    lines.push("");
    lines.push("*Customer:*");
    lines.push(`Name: ${delivery.name}`);
    lines.push(`Phone: ${delivery.phone}`);
    if (delivery.email.trim()) lines.push(`Email: ${delivery.email}`);
    lines.push(`Address: ${delivery.address}, ${delivery.city} - ${delivery.pincode}`);
    lines.push("");
    lines.push("*Items:*");
    items.forEach((it, idx) => {
      lines.push(
        `${idx + 1}. ${it.name}${it.size ? ` (Size ${it.size})` : ""} × ${it.qty} — ${fmt(it.price * it.qty)}`
      );
      if (it.meta) lines.push(`   • ${it.meta}`);
      // Include the design image: a public URL once storage is wired, otherwise
      // a clear pending note (customer shares the image in the chat for now).
      if (it.designImage) {
        lines.push(`   • ${designImageLine(it.designImageUrl, !!it.designImageUrl)}`);
      }
    });
    lines.push("");
    lines.push(`Subtotal: ${fmt(sub)}`);
    lines.push(`Shipping: ${freeShip && sub > 0 ? "FREE" : fmt(shipping)}`);
    lines.push(`Discount: -${fmt(discount)}`);
    lines.push(`*Total: ${fmt(total)}*`);
    lines.push(`Payment: ${pay.toUpperCase()}`);

    const message = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    // open WhatsApp (new tab); cart is intentionally NOT cleared yet
    window.open(url, "_blank");

    setOrderRef(ref);
    setPlaced(true);
  }

  return (
    <>
      <Navbar active="cart" />

      <div className="pt-[34px] pb-[10px]">
        <div className="wrap">
          <span className="eyebrow">Checkout</span>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] mt-3">Your Cart</h1>
          <p className="text-brand-muted mt-[6px]">Review your custom prints and complete your order securely.</p>
        </div>
      </div>

      <div className="wrap">
        <div className="grid [grid-template-columns:1.5fr_1fr] max-[960px]:grid-cols-1 gap-7 py-[18px_10px] items-start">

          {/* LEFT */}
          <div>
            {/* CART ITEMS */}
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
              <h3 className="font-heading text-[1.3rem] mb-1">Cart Items</h3>
              <p className="text-brand-muted text-[0.86rem] mb-[18px]">Adjust quantity or remove items.</p>

              {items.length > 0 && (
                <div className={`rounded-[1rem] p-[12px_16px] flex items-center gap-[10px] mb-[18px] text-[0.88rem] font-semibold ${freeShip ? "bg-brand-mint border border-brand-border text-brand-primary" : "bg-gradient-to-br from-brand-goldSoft to-white border border-brand-gold/40 text-brand-dark"}`}>
                  <span className="text-[1.1rem]">🚚</span>
                  {freeShip ? "🎉 You've unlocked FREE shipping!" : `Add ${fmt(FREE_SHIP_THRESHOLD - sub)} more for FREE shipping!`}
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-10 px-[10px] text-brand-muted">
                  <div className="text-[2.6rem]">🛒</div>
                  <p className="my-[10px_18px]">Your cart is empty.</p>
                  <Link href="/#products" className="btn-primary">Browse Products →</Link>
                </div>
              ) : (
                items.map((line) => (
                  <CartItem
                    key={line.lineId}
                    line={line}
                    onInc={() => setQty(line.lineId, line.qty + 1)}
                    onDec={() => setQty(line.lineId, line.qty - 1)}
                    onRemove={() => removeItem(line.lineId)}
                  />
                ))
              )}
            </div>

            {/* DELIVERY */}
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mb-6">
              <h3 className="font-heading text-[1.3rem] mb-1">Delivery Details</h3>
              <p className="text-brand-muted text-[0.86rem] mb-[18px]">Where should we ship your gift?</p>
              <form className="grid grid-cols-2 max-[680px]:grid-cols-1 gap-4" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col"><label className="text-[0.82rem] font-bold mb-[7px]">Full Name *</label><input className="input-premium" placeholder="Sagar Patil" value={delivery.name} onChange={setField("name")} /></div>
                <div className="flex flex-col"><label className="text-[0.82rem] font-bold mb-[7px]">Phone *</label><input className="input-premium" type="tel" placeholder="+91 70838 11355" value={delivery.phone} onChange={setField("phone")} /></div>
                <div className="flex flex-col col-span-full"><label className="text-[0.82rem] font-bold mb-[7px]">Email</label><input className="input-premium" type="email" placeholder="you@example.com" value={delivery.email} onChange={setField("email")} /></div>
                <div className="flex flex-col col-span-full"><label className="text-[0.82rem] font-bold mb-[7px]">Address *</label><input className="input-premium" placeholder="House / Flat, Street, Area" value={delivery.address} onChange={setField("address")} /></div>
                <div className="flex flex-col"><label className="text-[0.82rem] font-bold mb-[7px]">City *</label><input className="input-premium" placeholder="Kolhapur" value={delivery.city} onChange={setField("city")} /></div>
                <div className="flex flex-col"><label className="text-[0.82rem] font-bold mb-[7px]">Pincode *</label><input className="input-premium" placeholder="416001" value={delivery.pincode} onChange={setField("pincode")} /></div>
              </form>
            </div>

            {/* PAYMENT */}
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6">
              <h3 className="font-heading text-[1.3rem] mb-1">Payment Method</h3>
              <p className="text-brand-muted text-[0.86rem] mb-[18px]">Choose how you&apos;d like to pay.</p>
              <div className="grid grid-cols-3 max-[680px]:grid-cols-1 gap-3">
                {[["upi", "📲", "UPI"], ["card", "💳", "Card"], ["cod", "💵", "Cash on Delivery"]].map(([id, e, n]) => (
                  <button key={id} onClick={() => setPay(id)} className={`relative border-[1.5px] rounded-[1rem] p-[16px_12px] text-center cursor-pointer transition bg-white hover:-translate-y-[2px] ${pay === id ? "border-brand-primary bg-brand-mint shadow-glow" : "border-brand-border hover:border-brand-gold/50"}`}>
                    {pay === id && <span className="absolute top-2 right-[10px] text-brand-primary font-bold">✓</span>}
                    <span className="text-[1.6rem]">{e}</span>
                    <span className="block text-[0.84rem] font-bold text-brand-ink mt-[6px]">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: SUMMARY */}
          <div>
            <div className="bg-white border border-brand-border rounded-premium shadow-soft p-6 sticky top-[92px] max-[960px]:static">
              <h3 className="font-heading text-[1.3rem] mb-1">Order Summary</h3>
              <p className="text-brand-muted text-[0.86rem] mb-[18px]">Free shipping on orders above ₹999.</p>

              <div className="flex items-center justify-between text-[0.92rem] text-brand-muted mb-[10px]"><span>Subtotal</span><span className="text-brand-ink font-semibold">{fmt(sub)}</span></div>
              <div className="flex items-center justify-between text-[0.92rem] text-brand-muted mb-[10px]"><span>Shipping</span><span className={freeShip && sub > 0 ? "text-brand-primary font-bold" : "text-brand-ink font-semibold"}>{freeShip && sub > 0 ? "FREE" : fmt(shipping)}</span></div>
              <div className="flex items-center justify-between text-[0.92rem] text-brand-muted mb-[10px]"><span>Discount</span><span className="text-[#1a8a5c] font-bold">−{fmt(discount)}</span></div>

              <div className="flex gap-2 my-4">
                <input className="input-premium flex-1" placeholder="Coupon code (try DRUCKA10)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                <button className="btn-ghost" onClick={applyCoupon}>{couponApplied ? "Applied ✓" : "Apply"}</button>
              </div>
              {couponMsg === "bad" && <p className="text-red-600 text-[0.8rem] -mt-2 mb-2">Invalid coupon code.</p>}
              {couponMsg === "ok" && <p className="text-brand-primary text-[0.8rem] -mt-2 mb-2">Coupon applied — 10% off!</p>}

              <div className="flex items-center justify-between mt-[14px] pt-[14px] border-t border-dashed border-brand-border">
                <span className="font-bold text-brand-ink">Total</span>
                <span className="font-heading text-[1.8rem] font-extrabold text-brand-primary">{fmt(total)}</span>
              </div>

              <button onClick={placeOrder} className="btn-primary w-full mt-[18px]" style={placed ? { background: "linear-gradient(135deg,#08483B,#06382F)" } : undefined}>
                {placed ? "✓ Order sent" : "Place Order via WhatsApp →"}
              </button>

              {formError && (
                <p className="text-red-600 text-[0.82rem] mt-[10px]">{formError}</p>
              )}
              {placed && orderRef && (
                <div className="mt-[12px] bg-brand-mint border border-brand-border rounded-[0.9rem] p-[12px_14px]">
                  <p className="text-brand-primary text-[0.84rem] font-semibold">
                    ✓ WhatsApp opened. Your order reference is{" "}
                    <span className="font-bold">{orderRef}</span>
                  </p>
                  <p className="text-brand-muted text-[0.78rem] mt-[6px]">
                    Save this reference. You can{" "}
                    <Link href="/track-order" className="text-brand-primary font-semibold underline">track your order</Link>{" "}
                    anytime.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-[10px] mt-[18px]">
                {[["🔒", "Secure Payment"], ["🚚", "Fast Delivery"], ["⭐", "Premium Print"], ["💬", "WhatsApp Support"]].map(([e, t]) => (
                  <div key={t} className="flex items-center gap-2 bg-white border border-brand-border rounded-[0.8rem] p-[10px_12px] text-[0.8rem] font-semibold text-brand-ink"><span className="text-[1.05rem]">{e}</span> {t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
