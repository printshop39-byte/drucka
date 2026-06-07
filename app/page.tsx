import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import MockImage from "@/components/MockImage";
import { getProducts } from "@/data/products";

export default function HomePage() {
  const products = getProducts();
  const heroTiles = products.slice(0, 3);

  return (
    <>
      <Navbar active="home" />

      {/* HERO */}
      <section className="relative overflow-hidden py-[64px_50px]">
        <div className="absolute -left-20 -top-16 w-[340px] h-[340px] rounded-full bg-brand-gold/[0.18] blur-[70px]" />
        <div className="absolute -right-24 -bottom-32 w-[440px] h-[440px] rounded-full bg-brand-primary/[0.15] blur-[80px]" />
        <div className="wrap relative grid items-center gap-12 [grid-template-columns:1.05fr_1fr] max-[900px]:[grid-template-columns:1fr]">
          <div>
            <span className="eyebrow">Premium Custom Printing Studio</span>
            <h1 className="text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.04] mt-5 text-brand-ink">
              Print it. Gift it.<br /><span className="text-brand-primary">Feel it.</span>
            </h1>
            <p className="text-brand-muted text-[1.12rem] max-w-[480px] mt-[18px]">
              Upload your photo or design and turn it into premium T-shirts, mugs, frames, cushions and personalized gifts — printed beautifully, delivered fast.
            </p>
            <div className="flex gap-[14px] flex-wrap mt-[30px]">
              <Link href="/customize" className="btn-primary">Start Customizing →</Link>
              <Link href="/#products" className="btn-secondary">Browse Products</Link>
            </div>
            <div className="flex gap-[22px] flex-wrap mt-[26px]">
              <div className="text-[0.86rem] text-brand-muted"><b className="block font-heading text-[1.5rem] text-brand-ink">50k+</b>Happy gifts delivered</div>
              <div className="text-[0.86rem] text-brand-muted"><b className="block font-heading text-[1.5rem] text-brand-ink">4.9★</b>Average rating</div>
              <div className="text-[0.86rem] text-brand-muted"><b className="block font-heading text-[1.5rem] text-brand-ink">2–4 days</b>Fast delivery</div>
            </div>
          </div>
          <div className="bg-white/[0.86] border border-brand-border rounded-premium shadow-soft backdrop-blur-[14px] p-[18px]">
            <div className="bg-brand-mint rounded-2xl p-[18px]">
              <div className="grid grid-cols-3 gap-3">
                {heroTiles.map((p) => (
                  <div key={p.id} className="bg-white border border-brand-border rounded-[14px] p-[14px_10px] text-center transition hover:-translate-y-[5px] hover:shadow-premium hover:border-brand-gold/45">
                    <div className="h-[90px] rounded-[10px] flex items-center justify-center overflow-hidden mb-[10px] bg-gradient-to-br from-brand-mint to-white">
                      <MockImage src={p.image} alt={p.name} emoji={p.fallbackEmoji} className="w-full h-full object-contain p-2" emojiClassName="text-[2.4rem]" />
                    </div>
                    <p className="text-[0.82rem] font-bold text-brand-ink">{p.name}</p>
                  </div>
                ))}
              </div>
              <div className="mt-[14px] bg-white border border-brand-border rounded-[12px] p-[12px_14px] flex items-center justify-between">
                <span className="text-[0.85rem] font-bold text-brand-ink">Live preview</span>
                <span className="badge badge-green">Ready to customize</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 max-[680px]:py-12" id="how">
        <div className="wrap">
          <div className="text-center max-w-[640px] mx-auto mb-11">
            <span className="eyebrow">Simple Process</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] my-[14px_10px] leading-[1.15]">How It Works</h2>
            <p className="text-brand-muted text-[1.02rem]">Three easy steps from your idea to a gift in hand.</p>
          </div>
          <div className="grid gap-[22px] grid-cols-3 max-[680px]:grid-cols-1">
            {[
              { n: "1", i: "⬆️", t: "Upload", d: "Add your photo, text or artwork and choose a product to print it on." },
              { n: "2", i: "🖨️", t: "We Print", d: "Our studio prints your design in premium quality with crisp, lasting colors." },
              { n: "3", i: "📦", t: "Delivered", d: "Securely packed and shipped to your door — gift-ready in 2–4 days." },
            ].map((s) => (
              <div key={s.n} className="bg-white border border-brand-border rounded-premium p-[30px_24px] text-center shadow-soft transition hover:-translate-y-[6px] hover:shadow-premium">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-mint text-brand-primary flex items-center justify-center font-heading font-extrabold text-[1.3rem]">{s.n}</div>
                <div className="text-[2rem] mb-2">{s.i}</div>
                <h3 className="text-[1.2rem] mb-2">{s.t}</h3>
                <p className="text-brand-muted text-[0.92rem]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-16 max-[680px]:py-12 bg-brand-mint" id="products">
        <div className="wrap">
          <div className="text-center max-w-[640px] mx-auto mb-11">
            <span className="eyebrow">Bestsellers</span>
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] my-[14px_10px] leading-[1.15]">Popular Products</h2>
            <p className="text-brand-muted text-[1.02rem]">Customize any product with your own photo, text or design.</p>
          </div>
          <ProductGrid products={products} />
        </div>
      </section>

      {/* UPLOAD CTA */}
      <section className="py-16 max-[680px]:py-12">
        <div className="wrap">
          <div className="bg-gradient-to-br from-white to-brand-mint border border-brand-border rounded-[1.75rem] p-11 max-[680px]:p-7 grid grid-cols-2 max-[900px]:grid-cols-1 gap-10 items-center shadow-soft">
            <div>
              <span className="eyebrow">Start Designing</span>
              <h2 className="text-[clamp(1.7rem,3.5vw,2.4rem)] leading-[1.15] mt-3">Got a design in mind? Upload it now.</h2>
              <p className="text-brand-muted mt-3">Drag and drop your photo or artwork — we&apos;ll show you a live preview on any product. PNG or JPG, up to 20MB.</p>
              <div className="mt-[22px] flex gap-3 flex-wrap">
                <Link href="/customize" className="btn-primary">Start Customizing →</Link>
                <Link href="/customize" className="btn-secondary">See Examples</Link>
              </div>
            </div>
            <Link href="/customize" className="border-[1.5px] border-dashed border-brand-primary/35 bg-white rounded-[1.5rem] p-[42px_24px] text-center block transition hover:border-brand-gold hover:shadow-premium hover:-translate-y-1">
              <div className="text-[2.6rem]">⬆️</div>
              <p className="text-brand-muted mt-2 text-[0.92rem]"><span className="text-brand-primary font-bold">Click to upload</span> or drag your design here</p>
              <p className="text-[0.8rem] text-brand-muted">PNG, JPG up to 20MB</p>
            </Link>
          </div>
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
          <div className="text-center max-w-[640px] mx-auto mb-11">
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

      {/* TRUST */}
      <section className="py-16 max-[680px]:py-12">
        <div className="wrap">
          <div className="grid gap-[18px] grid-cols-4 max-[900px]:grid-cols-2 max-[680px]:grid-cols-1">
            {[
              { i: "🔒", t: "Secure Payment", s: "100% safe checkout" },
              { i: "🚚", t: "Fast Delivery", s: "2–4 days across India" },
              { i: "⭐", t: "Premium Print Quality", s: "Crisp, lasting colors" },
              { i: "🎁", t: "Made for Gifting", s: "Gift-ready packaging" },
            ].map((x) => (
              <div key={x.t} className="bg-white border border-brand-border rounded-premium p-[24px_18px] text-center transition hover:-translate-y-1 hover:border-brand-gold/45">
                <div className="text-[1.8rem]">{x.i}</div>
                <b className="block mt-[10px] text-[0.96rem]">{x.t}</b>
                <span className="text-[0.82rem] text-brand-muted">{x.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
