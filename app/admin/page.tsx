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

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProducts } from "@/data/products";
import { getDesigns } from "@/data/designs";
import { getOrders, updateOrderStatus, type OrderRow, type OrderStatus as DbOrderStatus } from "@/lib/orders";

const WHATSAPP_NUMBER = "917083811355";

// The exact status options shown in the admin status control.
const STATUS_OPTIONS: OrderStatus[] = [
  "New", "In Design Review", "Printing", "Ready to Ship", "Delivered",
];

// Simple front-end admin password.
// TODO: replace this gate with real Supabase/Auth (server-verified) before
// production. This is a lightweight client-side guard only — anyone who reads
// the bundle can find the password, so do not treat it as real security.
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "drucka-admin";
const UNLOCK_KEY = "drucka_admin_unlocked";

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

// ---------------------------------------------------------------------------
// Password gate (default export). Shows a login card until unlocked, then the
// dashboard. Unlock state is kept in sessionStorage so it clears when the tab
// closes. TODO: swap for real auth later.
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === "true");
    setReady(true);
  }, []);

  function unlock() {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  // avoid a flash of the login card before sessionStorage is read
  if (!ready) return null;

  if (unlocked) return <AdminDashboard />;

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center px-[22px] py-16 min-h-[70vh]">
        <div className="w-full max-w-[420px] bg-white border border-brand-border rounded-premium shadow-soft p-[36px_30px]">
          <span className="eyebrow">Restricted</span>
          <h1 className="text-[1.7rem] my-[14px_4px]">Admin Access</h1>
          <p className="text-brand-muted text-[0.92rem] mb-6">Enter the admin password to manage DRUCKA.</p>

          <label className="block text-[0.82rem] font-bold mb-2" htmlFor="adminPw">Password</label>
          <input
            id="adminPw"
            className="input-premium"
            type="password"
            placeholder="••••••••"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") unlock(); }}
            autoComplete="current-password"
          />
          {error && <p className="text-red-600 text-[0.82rem] mt-[10px]">Incorrect password.</p>}

          <button className="btn-primary w-full mt-4" onClick={unlock}>Unlock Admin</button>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// The actual dashboard (unchanged), now rendered only after unlock.
// ---------------------------------------------------------------------------
// Unified display row (works for both sample and Supabase data).
interface DisplayOrder {
  ref: string; customer: string; product: string; total: string; status: OrderStatus;
}

function AdminDashboard() {
  const productCount = getProducts().length;
  const designCount = getDesigns().length;

  // Try Supabase; fall back to SAMPLE_ORDERS if env missing or fetch fails.
  const [orders, setOrders] = useState<DisplayOrder[]>(SAMPLE_ORDERS);
  const [usingReal, setUsingReal] = useState(false);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingRef, setSavingRef] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function loadOrders() {
    setRefreshing(true);
    const rows = await getOrders(20);
    setRefreshing(false);
    if (!rows) return; // null => not configured / failed => keep sample
    const mapped: DisplayOrder[] = rows.map((r) => ({
      ref: r.order_ref,
      customer: r.customer_name,
      product: r.items?.[0]?.name
        ? `${r.items[0].name}${r.items.length > 1 ? ` +${r.items.length - 1}` : ""}`
        : "—",
      total: `₹${Number(r.total).toLocaleString("en-IN")}`,
      status: (r.status as DbOrderStatus) ?? "New",
    }));
    setOrders(mapped);
    setUsingReal(true);
    setRevenue(rows.reduce((s, r) => s + Number(r.total || 0), 0));
  }

  useEffect(() => { loadOrders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Change a live order's status: optimistic UI, then persist; revert on failure.
  async function changeStatus(ref: string, next: OrderStatus) {
    if (!usingReal || savingRef) return;
    const prev = orders;
    setStatusError(null);
    setSavingRef(ref);
    setOrders((list) => list.map((o) => (o.ref === ref ? { ...o, status: next } : o)));

    const res = await updateOrderStatus(ref, next);
    setSavingRef(null);
    if (!res.ok) {
      setOrders(prev); // revert optimistic change
      setStatusError(
        res.skipped
          ? "Supabase not configured — status not saved."
          : `Couldn't update ${ref}. Please try again.`
      );
    }
  }

  const stats = [
    { icon: "🛍️", label: "Products", value: String(productCount), href: "/#products", note: "in catalogue" },
    { icon: "🎨", label: "Design Templates", value: String(designCount), href: "/customize", note: "available" },
    { icon: "📦", label: "Orders", value: String(orders.length), href: "#orders", note: usingReal ? "live" : "sample data" },
    { icon: "💰", label: "Revenue", value: revenue !== null ? `₹${revenue.toLocaleString("en-IN")}` : "₹1,696", note: usingReal ? "live total" : "sample total" },
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
            <div className="flex items-center gap-2">
              <span className="badge badge-gold">{usingReal ? "Live data" : "Sample data"}</span>
              {usingReal && (
                <button
                  onClick={loadOrders}
                  disabled={refreshing}
                  className="btn-ghost !px-[0.9rem] !py-[0.45rem] !text-[0.82rem] disabled:opacity-60"
                >
                  {refreshing ? "Refreshing…" : "↻ Refresh Orders"}
                </button>
              )}
            </div>
          </div>
          <p className="text-brand-muted text-[0.86rem] mb-[18px]">
            {usingReal ? "Orders from Supabase, newest first." : "Placeholder orders — connect Supabase to see live orders."}
          </p>
          {statusError && (
            <p className="text-red-600 text-[0.82rem] mb-[14px] bg-red-50 border border-red-200 rounded-[0.6rem] p-[8px_10px]">
              ⚠️ {statusError}
            </p>
          )}

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
                {orders.map((o) => (
                  <tr key={o.ref} className="border-b border-brand-border last:border-b-0">
                    <td className="py-[14px] pr-3 font-bold text-brand-ink text-[0.9rem]">{o.ref}</td>
                    <td className="py-[14px] pr-3 text-[0.9rem]">{o.customer}</td>
                    <td className="py-[14px] pr-3 text-brand-muted text-[0.9rem]">{o.product}</td>
                    <td className="py-[14px] pr-3 font-bold text-brand-primary text-[0.9rem]">{o.total}</td>
                    <td className="py-[14px]">
                      {usingReal ? (
                        <select
                          value={o.status}
                          disabled={savingRef === o.ref}
                          onChange={(e) => changeStatus(o.ref, e.target.value as OrderStatus)}
                          className="input-premium !py-[0.4rem] !px-[0.7rem] !text-[0.82rem] !rounded-[0.6rem] max-w-[170px] disabled:opacity-60 cursor-pointer"
                          aria-label={`Status for ${o.ref}`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="hidden max-[680px]:flex flex-col gap-3">
            {orders.map((o) => (
              <div key={o.ref} className="border border-brand-border rounded-[0.9rem] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-brand-ink text-[0.9rem]">{o.ref}</span>
                  {!usingReal && <span className={`badge ${STATUS_STYLES[o.status]}`}>{o.status}</span>}
                </div>
                <div className="text-[0.88rem] mt-2">{o.customer}</div>
                <div className="text-brand-muted text-[0.82rem]">{o.product}</div>
                <div className="font-bold text-brand-primary text-[0.9rem] mt-1">{o.total}</div>
                {usingReal && (
                  <select
                    value={o.status}
                    disabled={savingRef === o.ref}
                    onChange={(e) => changeStatus(o.ref, e.target.value as OrderStatus)}
                    className="input-premium !py-[0.5rem] !px-[0.7rem] !text-[0.84rem] !rounded-[0.6rem] mt-3 disabled:opacity-60 cursor-pointer"
                    aria-label={`Status for ${o.ref}`}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                )}
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
