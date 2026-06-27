import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/* Full-bleed pinned "memories" scroll sequence used as the homepage intro.
   500vh of scroll scrubs through 5 stages while the viewport stays pinned.
   Lenis drives smooth scroll; GSAP ScrollTrigger reads it via the shared
   ticker so pin + scrub stay perfectly in sync. */
export default function ScrollShowcase({ onCta }: { onCta?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Intro plays once per browser tab session. On first visit it shows and
     marks a sessionStorage flag; a reload / in-tab navigation then skips
     straight to the real hero. New tab or new incognito session = shows again. */
  const [show] = useState(() => {
    try {
      return sessionStorage.getItem("drucka_intro_seen") !== "1";
    } catch {
      return true; // private mode / storage blocked → just show it
    }
  });

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem("drucka_intro_seen", "1");
    } catch {
      /* storage blocked — intro will simply replay next load */
    }

    const container = containerRef.current;
    if (!container) return;

    /* Respect reduced-motion: drop the pin/scrub, just stack the stages. */
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      const ctx = gsap.context(() => {
        gsap.set(".layer", { autoAlpha: 1, position: "relative", height: "auto" });
        gsap.set(container, { height: "auto" });
      }, container);
      return () => ctx.revert();
    }

    /* 1 — Lenis smooth scroll, driven by GSAP's ticker (single rAF loop). */
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: true, // let Lenis handle #hash nav (e.g. navbar "Mini Prints")
                     // while it's active during the first-visit intro
    });
    lenis.on("scroll", ScrollTrigger.update);
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    /* 2 — Timeline, scoped + auto-cleaned via gsap.context. */
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          // NO pin: the inner viewport is pinned by CSS `position: sticky`.
          // Adding GSAP pin here would double-pin and create a dead zone.
        },
      });

      // STAGE 1 — Hands hero. Visible on the FIRST frame (no blank landing
      // screen), then a slow scale settle; only the fade-out is scrubbed.
      gsap.set(".layer-hero", { autoAlpha: 1 });
      tl.fromTo(".layer-hero img", { scale: 1.1 }, { scale: 1, duration: 3, ease: "power1.out" })
        .from(".hero-text", { y: 30, autoAlpha: 0, duration: 2 }, "-=1.5")

        // STAGE 2 — Wallet inserts
        .to(".layer-hero", { autoAlpha: 0, y: -50, duration: 2 }, "+=1")
        .to(".layer-wallet", { autoAlpha: 1, duration: 2 })
        .fromTo(".wallet-img", { rotation: -3, scale: 0.95 }, { rotation: 0, scale: 1, duration: 3, ease: "power2.out" }, "<")

        // STAGE 3 — Grid cascade
        .to(".layer-wallet", { autoAlpha: 0, scale: 1.05, duration: 2 }, "+=1")
        .to(".layer-grid", { autoAlpha: 1, duration: 1 })
        .from(".grid-item", { autoAlpha: 0, y: 40, stagger: 0.5, duration: 2.5, ease: "power2.out" }, "<")

        // STAGE 4 — Phone cases slide in
        .to(".layer-grid", { autoAlpha: 0, y: -30, duration: 2 }, "+=1.5")
        .to(".layer-cases", { autoAlpha: 1, duration: 1 })
        .from(".c1, .c2", { x: -80, autoAlpha: 0, rotation: -4, duration: 3, ease: "power3.out" }, "<")
        .from(".c3, .c4", { x: 80, autoAlpha: 0, rotation: 4, duration: 3, ease: "power3.out" }, "<")

        // STAGE 5 — CTA settle
        .to(".layer-cases", { autoAlpha: 0, scale: 0.95, duration: 2 }, "+=1.5")
        .to(".layer-cta", { autoAlpha: 1, duration: 2 })
        .from(".cta-container", { scale: 0.98, y: 15, duration: 2, ease: "power1.out" }, "<");
    }, container);

    /* Recalculate once images have settled, so pin distances are exact. */
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      ctx.revert();
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, [show]);

  /* Each .layer starts hidden (autoAlpha:0) and absolutely stacked. Structural
     bits are inline-styled so they never depend on a generated Tailwind token. */
  const layerStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: 0,
    visibility: "hidden",
  };

  if (!show) return null;

  return (
    <div ref={containerRef} style={{ position: "relative", height: "500vh" }} className="bg-[#fcfbfa]">
      <div
        style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}
        className="flex w-full items-center justify-center"
      >
        {/* STAGE 1 — Hands hero */}
        <div className="layer layer-hero flex flex-col items-center justify-center p-4" style={layerStyle}>
          <img
            src="/images/scroll/hands-hero.webp"
            className="max-h-[70vh] max-w-[85%] rounded object-contain md:max-w-[50%]"
            alt="Mini prints held in hand"
          />
          <div className="hero-text mt-4 text-xl font-light tracking-tight text-[#1a1a1a] md:text-3xl">
            Memories in Your Hands
          </div>
        </div>

        {/* STAGE 2 — Wallet inserts */}
        <div className="layer layer-wallet flex items-center justify-center p-4" style={layerStyle}>
          <img
            src="/images/scroll/wallet-inserts.webp"
            className="wallet-img max-h-[75vh] max-w-[85%] object-contain md:max-w-[45%]"
            alt="2×3 inch wallet & gift inserts"
          />
        </div>

        {/* STAGE 3 — Grid cascade */}
        <div className="layer layer-grid flex items-center justify-center p-4" style={layerStyle}>
          <div className="grid w-[85%] max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
            <img src="/images/scroll/grid-1.webp" className="grid-item h-auto rounded-lg object-contain" alt="Photo print" />
            <img src="/images/scroll/square-prints.webp" className="grid-item h-auto rounded-lg object-contain" alt="3×3 inch Instagram square prints" />
            <img src="/images/scroll/scrapbook-prints.webp" className="grid-item h-auto rounded-lg object-contain" alt="4×3 inch memory & scrapbook prints" />
          </div>
        </div>

        {/* STAGE 4 — Phone cases */}
        <div className="layer layer-cases flex items-center justify-center p-4" style={layerStyle}>
          <div className="grid w-[90%] max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
            <img src="/images/scroll/magazine-case.webp" className="case-item c1 h-auto object-contain" alt="Magazine art phone case" />
            <img src="/images/scroll/case-2.webp" className="case-item c2 h-auto object-contain" alt="Custom phone case" />
            <img src="/images/scroll/collage-case.webp" className="case-item c3 h-auto object-contain" alt="Instagram collage phone case" />
            <img src="/images/scroll/case-4.webp" className="case-item c4 h-auto object-contain" alt="Custom phone case" />
          </div>
        </div>

        {/* STAGE 5 — CTA */}
        <div className="layer layer-cta flex items-center justify-center p-4" style={layerStyle}>
          <div className="cta-container flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-normal text-[#1a1a1a] md:text-5xl">Your Moments, Perfectly Framed</h2>
            <button
              type="button"
              onClick={onCta}
              className="transform rounded-full bg-[#d4af37] px-8 py-4 text-base font-medium tracking-wider text-white transition-all hover:scale-105 hover:bg-[#bfa130] md:text-lg"
            >
              PRINT YOUR MEMORIES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
