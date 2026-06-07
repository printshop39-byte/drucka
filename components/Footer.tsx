import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white mt-10">
      <div className="wrap grid gap-[34px] py-[46px_30px] [grid-template-columns:1.6fr_1fr_1fr] max-md:[grid-template-columns:1fr]">
        <div>
          <div className="font-heading font-extrabold text-[1.6rem] text-white">Drucka</div>
          <p className="text-white/70 text-[0.88rem] mt-[10px] max-w-[300px]">
            Premium custom printing &amp; gifting studio. Upload your design, we print it, you gift it.
          </p>
          <div className="flex gap-3 mt-[14px]">
            <a href="https://wa.me/917083811355" aria-label="Chat with Drucka on WhatsApp" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[1.05rem] transition hover:bg-brand-gold hover:-translate-y-[3px]">💬</a>
            <a href="https://instagram.com/druc.ka" aria-label="Drucka on Instagram" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[1.05rem] transition hover:bg-brand-gold hover:-translate-y-[3px]">📷</a>
            <a href="mailto:hello@drucka.in" aria-label="Email Drucka" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[1.05rem] transition hover:bg-brand-gold hover:-translate-y-[3px]">✉️</a>
          </div>
        </div>
        <div>
          <h4 className="text-white text-base mb-3">Shop</h4>
          <ul className="space-y-[9px]">
            <li><Link href="/#products" className="text-white/70 text-[0.88rem] hover:text-brand-gold">T-Shirts</Link></li>
            <li><Link href="/#products" className="text-white/70 text-[0.88rem] hover:text-brand-gold">Mugs &amp; Frames</Link></li>
            <li><Link href="/customize" className="text-white/70 text-[0.88rem] hover:text-brand-gold">Design Studio</Link></li>
            <li><Link href="/cart" className="text-white/70 text-[0.88rem] hover:text-brand-gold">Cart</Link></li>
            <li><Link href="/track-order" className="text-white/70 text-[0.88rem] hover:text-brand-gold">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-base mb-3">Get in Touch</h4>
          <ul className="space-y-[9px]">
            <li><a href="https://wa.me/917083811355" className="text-white/70 text-[0.88rem] hover:text-brand-gold">WhatsApp Chat</a></li>
            <li><a href="https://instagram.com/druc.ka" className="text-white/70 text-[0.88rem] hover:text-brand-gold">@druc.ka</a></li>
            <li><a href="mailto:hello@drucka.in" className="text-white/70 text-[0.88rem] hover:text-brand-gold">hello@drucka.in</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-[18px] text-center text-white/60 text-[0.82rem]">
        © 2026 Drucka — Print it. Gift it. Feel it. · All rights reserved.
      </div>
    </footer>
  );
}
