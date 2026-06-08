import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroMockupCollage from "@/components/HeroMockupCollage";
import HowItWorksAccordion from "@/components/HowItWorksAccordion";
import ProductCategoryStrip from "@/components/ProductCategoryStrip";
import TrustStrip from "@/components/TrustStrip";
import FaqAccordion from "@/components/FaqAccordion";

export default function HomePage() {
  return (
    <>
      <Navbar active="home" />

      {/* HERO */}
      <section className="relative overflow-hidden py-[64px_56px] max-[680px]:py-[40px_36px]">
        <div className="absolute -left-20 -top-16 w-[340px] h-[340px] rounded-full bg-brand-gold/[0.18] blur-[70px]" />
        <div className="absolute -right-24 -bottom-32 w-[440px] h-[440px] rounded-full bg-brand-primary/[0.15] blur-[80px]" />
        <div className="wrap relative grid items-center gap-12 [grid-template-columns:1.05fr_1fr] max-[900px]:[grid-template-columns:1fr] max-[900px]:gap-10">
          <div>
            <span className="eyebrow">Premium Custom Printing Studio</span>
            <h1 className="text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.04] mt-5 text-brand-ink">
              Print it. Gift it.<br /><span className="text-brand-primary">Feel it.</span>
            </h1>
            <p className="text-brand-muted text-[1.12rem] max-w-[480px] mt-[18px]">
              Upload your photo or design and turn it into premium T-shirts, mugs, frames,
              cushions, canvas and personalized keychains — printed beautifully, delivered fast.
            </p>
            <div className="flex gap-[14px] flex-wrap mt-[30px]">
              <Link href="/customize" className="btn-primary">Start Customizing →</Link>
              <Link href="/#products" className="btn-secondary">Browse Products</Link>
            </div>
            <div className="flex gap-[26px] flex-wrap mt-[28px]">
              <div className="text-[0.84rem] text-brand-muted"><b className="block font-heading text-[1.4rem] text-brand-ink">2–4 days</b>Fast delivery</div>
              <div className="text-[0.84rem] text-brand-muted"><b className="block font-heading text-[1.4rem] text-brand-ink">Premium</b>Print quality</div>
              <div className="text-[0.84rem] text-brand-muted"><b className="block font-heading text-[1.4rem] text-brand-ink">Secure</b>Checkout</div>
            </div>
          </div>
          <HeroMockupCollage />
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="pb-4">
        <div className="wrap"><TrustStrip /></div>
      </section>

      {/* PRODUCT FAVORITES */}
      <section className="py-16 max-[680px]:py-12 bg-brand-mint" id="products">
        <div className="wrap">
          <div className="text-center max-w-[640px] mx-auto mb-8">
            <span className="eyebrow">Product Favorites</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] my-[14px_10px] leading-[1.15]">Customize a gift they&apos;ll love</h2>
            <p className="text-brand-muted text-[1.02rem]">Pick a product and make it yours with your photo, text or artwork.</p>
          </div>
          <ProductCategoryStrip />
          <div className="text-center mt-10">
            <Link href="/customize" className="btn-primary">Start Customizing →</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 max-[680px]:py-12" id="how">
        <div className="wrap">
          <div className="text-center max-w-[640px] mx-auto mb-10">
            <span className="eyebrow">Simple Process</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] my-[14px_10px] leading-[1.15]">How It Works</h2>
            <p className="text-brand-muted text-[1.02rem]">From your idea to a gift in hand, in four easy steps.</p>
          </div>
          <HowItWorksAccordion />
        </div>
      </section>

      {/* AI BANNER */}
      <section className="pb-16 max-[680px]:pb-12">
        <div className="wrap">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-dark text-white rounded-[1.75rem] p-11 max-[680px]:p-7 flex items-center justify-between gap-7 flex-wrap shadow-premium">
            <div className="absolute -right-10 -top-16 w-[280px] h-[280px] rounded-full bg-brand-gold/30 blur-[70px]" />
            <div className="relative max-w-[560px]">
              <span className="badge badge-gold">✨ AI Powered</span>
              <h2 className="text-white text-[clamp(1.6rem,3.2vw,2.2rem)] mt-3">Not sure what to print? Ask Drucka AI!</h2>
              <p className="text-white/80 mt-[10px]">Describe the occasion — birthday, anniversary, office gift — and our AI suggests the perfect product and design idea in seconds.</p>
            </div>
            <Link href="/customize" className="relative bg-brand-gold text-brand-dark rounded-full px-[1.7rem] py-[0.95rem] font-bold text-[0.95rem] transition hover:-translate-y-[2px] shadow-[0_12px_28px_rgba(216,163,61,0.35)]">Ask Drucka AI →</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 max-[680px]:py-12 bg-brand-mint">
        <div className="wrap">
          <div className="text-center max-w-[640px] mx-auto mb-10">
            <span className="eyebrow">Loved by Customers</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] my-[14px_10px] leading-[1.15]">What People Say</h2>
            <p className="text-brand-muted text-[1.02rem]">Real gifts, real smiles — here&apos;s what our customers tell us.</p>
          </div>
          <div className="grid gap-[22px] grid-cols-3 max-[900px]:grid-cols-1">
            {[
              { q: "Ordered a photo mug for my mom's birthday. The print quality was stunning and it arrived in 3 days. She loved it!", a: "AP", n: "Aarti Patil", c: "Pune" },
              { q: "The framed canvas looks premium — way better than I expected. Drucka is now my go-to for gifts.", a: "RK", n: "Rohan Kulkarni", c: "Kolhapur" },
              { q: "Easy upload, beautiful T-shirts for our whole team. Fast delivery and great support. Highly recommend!", a: "SD", n: "Sneha Deshmukh", c: "Mumbai" },
            ].map((t) => (
              <div key={t.a} className="bg-white border border-brand-border rounded-premium p-[26px] shadow-soft transition hover:-translate-y-[5px] hover:shadow-premium">
                <div className="text-brand-gold text-base tracking-[2px]">★★★★★</div>
                <p className="my-[14px_18px] text-brand-ink text-[0.96rem]">&quot;{t.q}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-[42px] h-[42px] rounded-full bg-brand-mint text-brand-primary flex items-center justify-center font-bold">{t.a}</div>
                  <div><b className="text-[0.92rem]">{t.n}</b><span className="block text-[0.8rem] text-brand-muted">{t.c}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / BENEFITS */}
      <section className="section-padding">
        <div className="container-page">
          <div className="grid gap-[18px] grid-cols-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
            {[
              { i: "🚚", t: "Fast Delivery", s: "2–4 days across India" },
              { i: "⭐", t: "Premium Print Quality", s: "Crisp, lasting colors" },
              { i: "🔒", t: "Secure Checkout", s: "100% safe payment" },
              { i: "🎁", t: "Gift-Ready Packaging", s: "Made for gifting" },
            ].map((x) => (
              <div key={x.t} className="card-standard card-hover p-[24px_18px] text-center">
                <div className="text-[1.8rem]">{x.i}</div>
                <b className="block mt-[10px] text-[0.96rem]">{x.t}</b>
                <span className="text-[0.82rem] text-brand-muted">{x.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-[680px]:py-12 bg-brand-mint">
        <div className="wrap">
          <div className="text-center max-w-[640px] mx-auto mb-8">
            <span className="eyebrow">Questions</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] my-[14px_10px] leading-[1.15]">Frequently Asked</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      <Footer />
    </>
  );
}
