"use client";

// DRUCKA Admin Dashboard — FOUNDATION (front-end only).
//
// This is a static placeholder so DRUCKA can later manage products, designs and
// orders from one place. No database, no auth, no real data yet.
//
// TODO (backend): connect Supabase/Firebase and fetch real products, designs,
//   orders and revenue here instead of the local data files + sample rows.
// TODO (auth): protect this route with real authentication (only DRUCKA staff
//   should reach /admin). For now it is publicly reachable and linked only from
//   the footer, not the main navbar.
// TODO (orders): fetch real orders by their reference (DRK-YYYYMMDD-XXXX),
//   ideally written to the DB at the moment the WhatsApp order is placed.

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProducts } from "@/data/products";
import { getDesigns } from "@/data/designs";

const WHATSAPP_NUMBER = "917083811355";

// Order status options (used for badges). Later these come from the DB.
type OrderStatus = "New" | "In Design Review" | "Printing" | "Ready to Ship" | "Delivered";

const STATUS_STYLES: Record<OrderStatus, string> = {
  New: "badge-gold",
  "In Design Review": "badge-green",
  Printing: "badge-green",
  "Ready to Ship": "badge-green",
  Delivered: "badge-dark",
};

// Sample placeholder orders. TODO: replace with real orders from the backend.
const SAMPLE_ORDERS: {
  ref: string; customer: string; product: string; total: string; status: OrderStatus;
}[] = [
  { ref: "DRK-20260607-ABUJ", customer: "Aarti Patil", product: "Premium T-Shirt", total: "₹748", status: "New" },
  { ref: "DRK-20260607-8U78", customer: "Rohan Kulkarni", product: "Framed Print", total: "₹948", status: "In Design Review" },
];

export default function AdminPage() {
  const productCount = getProducts().length;
  const designCount = getDesigns().length;

  // TODO: orders + revenue come from the DB later; static for now.
  const stats = [
    { icon: "🛍️", label: "Products", value: String(productCount), href: "/#products", note: "in catalogue" },
    { icon: "🎨", label: "Design Templates", value: String(designCount), href: "/customize", note: "available" },
    { icon: "📦", label: "Orders", value: String(SAMPLE_ORDERS.length), href: "#orders", note: "sample data" },
    { icon: "💰", label: "Revenue", value: "₹1,696", note: "sample total" },
  ];

  return (
    <>
      <Navbar />

      {/* HEADER */}
      <div className="pt-[34px] pb-[10px]">
        <div className="wrap">
          <span className="eyebrow">Admin</span>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] mt-3">DRUCKA Admin</h1>
          <p className="text-brand-muted mt-[6px]">Manage products, designs, and orders.</p>
        </div>
      </div>

      <div className="wrap pb-16">
        {/* QUICK ACTIONS */}
        <div className="flex flex-wrap gap-3 py-[18px]">
          {/* TODO: wire Add Product / Add Design to real admin forms once a DB exists. */}
          <Link href="/#products" className="btn-primary">➕ Add Product</Link>
          <Link href="/customize" className="btn-secondary">🎨 Add Design</Link>
          <a href="#orders" className="btn-ghost">📦 View Orders</a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            💬 Open WhatsApp
          </a>
        </div>

        {/* STAT CARDS */}
        <div className="grid gap-[18px] grid-cols-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1 mt-2">
          {stats.map((s) => {
            const card = (
              <div className="bg-white border border-brand-border rounded-premium shadow-soft p-[22px] transition hover:-translate-y-1 hover:shadow-premium hover:border-brand-gold/45 h-full">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-full bg-brand-mint flex items-center justify-center text-[1.4rem]">{s.icon}</span>
                  <span className="font-heading text-[1.9rem] font-extrabold text-brand-primary leading-none">{s.value}</span>
                </div>
                <div className="mt-[14px] font-bold text-[0.98rem]">{s.label}</div>
                <div className="text-brand-muted text-[0.8rem]">{s.note}</div>
              </div>
            );
            return s.href ? (
              <Link key={s.label} href={s.href} className="block">{card}</Link>
            ) : (
              <div key={s.label}>{card}</div>
            );
          })}
        </div>

        {/* RECENT ORDERS */}
        <div id="orders" className="bg-white border border-brand-border rounded-premium shadow-soft p-6 mt-7">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <h3 className="font-heading text-[1.3rem]">Recent Orders</h3>
            <span className="badge badge-gold">Sample data</span>
          </div>
          <p className="text-brand-muted text-[0.86rem] mb-[18px]">
            Placeholder orders. {/* TODO: fetch real orders by reference from the backend. */}
          </p>

          {/* Desktop table */}
          <div className="overflow-x-auto max-[680px]:hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-brand-muted text-[0.78rem] uppercase tracking-wide border-b border-brand-border">
                  <th className="py-[10px] pr-3 font-bold">Order Ref</th>
                  <th className="py-[10px] pr-3 font-bold">Customer</th>
                  <th className="py-[10px] pr-3 font-bold">Product</th>
                  <th className="py-[10px] pr-3 font-bold">Total</th>
                  <th className="py-[10px] font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_ORDERS.map((o) => (
                  <tr key={o.ref} className="border-b border-brand-border last:border-b-0">
                    <td className="py-[14px] pr-3 font-bold text-brand-ink text-[0.9rem]">{o.ref}</td>
                    <td className="py-[14px] pr-3 text-[0.9rem]">{o.customer}</td>
                    <td className="py-[14px] pr-3 text-brand-muted text-[0.9rem]">{o.product}</td>
                    <td className="py-[14px] pr-3 font-bold text-brand-primary text-[0.9rem]">{o.total}</td>
                    <td className="py-[14px]"><span className={`badge ${STATUS_STYLES[o.status]}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="hidden max-[680px]:flex flex-col gap-3">
            {SAMPLE_ORDERS.map((o) => (
              <div key={o.ref} className="border border-brand-border rounded-[0.9rem] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-ink text-[0.9rem]">{o.ref}</span>
                  <span className={`badge ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </div>
                <div className="text-[0.88rem] mt-2">{o.customer}</div>
                <div className="text-brand-muted text-[0.82rem]">{o.product}</div>
                <div className="font-bold text-brand-primary text-[0.9rem] mt-1">{o.total}</div>
              </div>
            ))}
          </div>

          {/* Status legend */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-dashed border-brand-border">
            <span className="text-brand-muted text-[0.78rem] font-semibold mr-1">Statuses:</span>
            {(["New", "In Design Review", "Printing", "Ready to Ship", "Delivered"] as OrderStatus[]).map((st) => (
              <span key={st} className={`badge ${STATUS_STYLES[st]}`}>{st}</span>
            ))}
          </div>
        </div>

        {/* FOUNDATION NOTE */}
        <div className="bg-gradient-to-br from-white to-brand-mint border border-brand-border rounded-premium shadow-soft p-6 mt-7">
          <h3 className="font-heading text-[1.2rem] mb-1">This is a foundation</h3>
          <p className="text-brand-muted text-[0.88rem]">
            Front-end only for now. Coming next: real authentication, a database
            (Supabase/Firebase), live order tracking by reference, and product /
            design management forms.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
