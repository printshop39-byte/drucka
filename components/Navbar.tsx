"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";

export default function Navbar({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-[100] bg-white/75 backdrop-blur-xl border-b border-brand-border/70">
      <div className="flex items-center justify-between px-[22px] py-[14px] max-w-[1180px] mx-auto">
        <Link href="/" className="font-heading font-extrabold text-[1.6rem] text-brand-primary" aria-label="Drucka home">
          Drucka
        </Link>

        <nav className="hidden md:flex items-center gap-[26px]" aria-label="Primary navigation">
          <Link href="/#products" className={navCls(active === "products")}>Products</Link>
          <Link href="/customize" className={navCls(active === "customize")}>Design</Link>
          <Link href="/cart" className={navCls(active === "cart")}>Cart</Link>
          <Link href="/#how" className={navCls(active === "about")}>About</Link>
        </nav>

        <div className="flex items-center gap-[14px]">
          <Link href="/cart" className="hidden md:inline relative text-brand-ink font-semibold text-[0.92rem]">
            Cart
            <span className="absolute -top-[6px] -right-[10px] bg-brand-gold text-brand-dark text-[0.62rem] font-bold rounded-full px-[6px] py-[1px]">
              {count}
            </span>
          </Link>
          <Link href="/login" className="btn-primary !px-[1.3rem] !py-[0.6rem] !text-[0.88rem] hidden md:inline-flex">Login</Link>
          <button
            className="md:hidden text-[1.5rem] text-brand-primary"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden flex flex-col gap-1 px-[22px] pb-[18px] pt-2 border-b border-brand-border bg-white/95">
          <Link href="/#products" className={mobCls} onClick={() => setOpen(false)}>Products</Link>
          <Link href="/customize" className={mobCls} onClick={() => setOpen(false)}>Design</Link>
          <Link href="/cart" className={mobCls} onClick={() => setOpen(false)}>Cart ({count})</Link>
          <Link href="/#how" className={mobCls} onClick={() => setOpen(false)}>About</Link>
          <Link href="/login" className={mobCls} onClick={() => setOpen(false)}>Login</Link>
        </div>
      )}
    </header>
  );
}

const navCls = (on: boolean) =>
  `font-semibold text-[0.92rem] transition-colors ${on ? "text-brand-primary" : "text-brand-muted hover:text-brand-primary"}`;
const mobCls = "py-[10px] px-1 text-brand-ink font-semibold border-b border-brand-border";
