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
import { getOrders, updateOrderStatus, type OrderRow, type OrderItem, type OrderStatus as DbOrderStatus } from "@/lib/orders";

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

  function logout() {
    sessionStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
    setPw("");
  }

  // avoid a flash of the login card before sessionStorage is read
  if (!ready) return null;

  if (unlocked) return <AdminDashboard onLogout={logout} />;

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

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const productCount = getProducts().length;
  const designCount = getDesigns().length;

  // Try Supabase; fall back to SAMPLE_ORDERS if env missing or fetch fails.
  const [orders, setOrders] = useState<DisplayOrder[]>(SAMPLE_ORDERS);
  const [rawOrders, setRawOrders] = useState<OrderRow[]>([]); // full rows for the details modal
  const [usingReal, setUsingReal] = useState(false);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingRef, setSavingRef] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null); // open modal

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
    setRawOrders(rows);
    setUsingReal(true);
    setRevenue(rows.reduce((s, r) => s + Number(r.total || 0), 0));
  }

  useEffect(() => { loadOrders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Change a live order's status: optimistic UI (table + raw rows), persist; revert on failure.
  async function changeStatus(ref: string, next: OrderStatus) {
    if (!usingReal || savingRef) return;
    const prev = orders;
    const prevRaw = rawOrders;
    setStatusError(null);
    setSavingRef(ref);
    setOrders((list) => list.map((o) => (o.ref === ref ? { ...o, status: next } : o)));
    setRawOrders((list) => list.map((o) => (o.order_ref === ref ? { ...o, status: next } : o)));

    const res = await updateOrderStatus(ref, next);
    setSavingRef(null);
    if (!res.ok) {
      setOrders(prev); // revert optimistic change
      setRawOrders(prevRaw);
      setStatusError(
        res.skipped
          ? "Supabase not configured — status not saved."
          : `Couldn't update ${ref}. Please try again.`
      );
    }
  }

  const selectedOrder = selectedRef ? rawOrders.find((o) => o.order_ref === selectedRef) ?? null : null;

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
        <div className="wrap flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Admin</span>
            <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] mt-3">DRUCKA Admin</h1>
            <p className="text-brand-muted mt-[6px]">Manage products, designs, and orders.</p>
          </div>
          <button onClick={onLogout} className="btn-ghost !px-[1rem] !py-[0.5rem] !text-[0.84rem] shrink-0 mt-1">↩ Logout</button>
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
                  <th className="py-[10px] pr-3 font-bold">Status</th>
                  {usingReal && <th className="py-[10px] font-bold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.ref} className="border-b border-brand-border last:border-b-0">
                    <td className="py-[14px] pr-3 font-bold text-brand-ink text-[0.9rem]">
                      {usingReal ? (
                        <button onClick={() => setSelectedRef(o.ref)} className="text-brand-ink hover:text-brand-primary underline-offset-2 hover:underline cursor-pointer">{o.ref}</button>
                      ) : o.ref}
                    </td>
                    <td className="py-[14px] pr-3 text-[0.9rem]">{o.customer}</td>
                    <td className="py-[14px] pr-3 text-brand-muted text-[0.9rem]">{o.product}</td>
                    <td className="py-[14px] pr-3 font-bold text-brand-primary text-[0.9rem]">{o.total}</td>
                    <td className="py-[14px] pr-3">
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
                    {usingReal && (
                      <td className="py-[14px]">
                        <button onClick={() => setSelectedRef(o.ref)} className="btn-ghost !px-[0.9rem] !py-[0.45rem] !text-[0.82rem]">View Details</button>
                      </td>
                    )}
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
                  <>
                    <select
                      value={o.status}
                      disabled={savingRef === o.ref}
                      onChange={(e) => changeStatus(o.ref, e.target.value as OrderStatus)}
                      className="input-premium !py-[0.5rem] !px-[0.7rem] !text-[0.84rem] !rounded-[0.6rem] mt-3 disabled:opacity-60 cursor-pointer w-full"
                      aria-label={`Status for ${o.ref}`}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <button onClick={() => setSelectedRef(o.ref)} className="btn-ghost w-full mt-2 !text-[0.84rem]">View Details</button>
                  </>
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

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          saving={savingRef === selectedOrder.order_ref}
          onChangeStatus={(next) => changeStatus(selectedOrder.order_ref, next)}
          onClose={() => setSelectedRef(null)}
        />
      )}

      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Order Details Modal — full order info, status control, copy buttons.
// ---------------------------------------------------------------------------
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch { /* clipboard blocked — ignore */ }
      }}
      className="text-[0.72rem] font-semibold text-brand-primary hover:underline cursor-pointer"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

function OrderDetailsModal({
  order,
  saving,
  onChangeStatus,
  onClose,
}: {
  order: OrderRow;
  saving: boolean;
  onChangeStatus: (next: OrderStatus) => void;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const phoneDigits = (order.customer_phone || "").replace(/\D/g, "");
  const created = order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "—";
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div
      className="fixed inset-0 z-[200] bg-brand-dark/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.order_ref} details`}
    >
      <div
        className="bg-white border border-brand-border rounded-premium shadow-premium w-full max-w-[640px] max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-brand-border flex items-start justify-between gap-3 p-5 rounded-t-premium">
          <div>
            <span className="eyebrow">Order</span>
            <div className="flex items-center gap-2 mt-2">
              <h3 className="font-heading text-[1.3rem]">{order.order_ref}</h3>
              <CopyButton value={order.order_ref} label="Ref" />
            </div>
            <div className="text-brand-muted text-[0.78rem] mt-1">{created} · {order.payment_method}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 shrink-0 rounded-full border border-brand-border flex items-center justify-center text-[1.2rem] text-brand-muted hover:text-brand-ink hover:border-brand-gold/50">×</button>
        </div>

        <div className="p-5 space-y-5">
          {/* SECTION: Status */}
          <div className="border border-brand-border rounded-[0.9rem] p-4">
            <div className="eyebrow mb-3">Status</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`badge ${STATUS_STYLES[order.status]}`}>{order.status}</span>
              <select
                value={order.status}
                disabled={saving}
                onChange={(e) => onChangeStatus(e.target.value as OrderStatus)}
                className="input-premium !py-[0.45rem] !px-[0.7rem] !text-[0.84rem] !rounded-[0.6rem] max-w-[200px] disabled:opacity-60 cursor-pointer"
                aria-label="Update status"
              >
                {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              {saving && <span className="text-brand-muted text-[0.78rem]">Saving…</span>}
            </div>
          </div>

          {/* SECTION: Customer */}
          <div className="border border-brand-border rounded-[0.9rem] p-4">
            <div className="eyebrow mb-3">Customer</div>
            <div className="text-[0.95rem] font-semibold">{order.customer_name}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="text-[0.86rem] text-brand-primary font-semibold hover:underline">💬 {order.customer_phone}</a>
              <CopyButton value={phoneDigits} label="Phone" />
            </div>
            {order.customer_email && (
              <div className="mt-1"><a href={`mailto:${order.customer_email}`} className="text-[0.86rem] text-brand-primary hover:underline">✉️ {order.customer_email}</a></div>
            )}
            <div className="text-brand-muted text-[0.84rem] mt-2">
              {order.customer_address}, {order.customer_city} - {order.customer_pincode}
            </div>
            {phoneDigits && (
              <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-3 !text-[0.86rem]">💬 Open WhatsApp Chat</a>
            )}
          </div>

          {/* SECTION: Items & Design */}
          <div>
            <div className="eyebrow mb-3">Items &amp; Design ({items.length})</div>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="border border-brand-border rounded-[0.9rem] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-[0.95rem]">{it.name}{it.size ? ` · Size ${it.size}` : ""}</div>
                      <div className="text-brand-muted text-[0.82rem]">
                        Qty {it.qty} × ₹{Number(it.price).toLocaleString("en-IN")} = ₹{(Number(it.price) * Number(it.qty)).toLocaleString("en-IN")}
                      </div>
                    </div>
                    {it.designImageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={it.designImageUrl} alt="Design" className="w-14 h-14 object-contain rounded-[0.5rem] border border-brand-border bg-brand-mint shrink-0" />
                    )}
                  </div>

                  {/* Customization details */}
                  <div className="mt-3 grid grid-cols-2 max-[420px]:grid-cols-1 gap-x-4 gap-y-1 text-[0.8rem]">
                    <span className="text-brand-muted">Custom image: <b className="text-brand-ink">{it.designImageUrl ? "Yes" : "No"}</b></span>
                    {typeof it.rotation === "number" && <span className="text-brand-muted">Rotation: <b className="text-brand-ink">{it.rotation}°</b></span>}
                    {typeof it.designSize === "number" && <span className="text-brand-muted">Design size: <b className="text-brand-ink">{it.designSize}%</b></span>}
                    {it.position && <span className="text-brand-muted">Position: <b className="text-brand-ink">{it.position}</b></span>}
                    {it.text && <span className="text-brand-muted col-span-full">Text: <b className="text-brand-ink">“{it.text}”</b></span>}
                  </div>

                  {it.designImageUrl && (
                    <div className="flex items-center gap-3 mt-3">
                      <a href={it.designImageUrl} target="_blank" rel="noopener noreferrer" className="btn-primary !px-[1rem] !py-[0.5rem] !text-[0.8rem]">Open Design Image ↗</a>
                      <CopyButton value={it.designImageUrl} label="URL" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: Payment & Totals */}
          <div className="bg-brand-mint border border-brand-border rounded-[0.9rem] p-4">
            <div className="eyebrow mb-3">Payment &amp; Totals</div>
            <div className="flex items-center justify-between text-[0.86rem] text-brand-muted mb-1"><span>Payment method</span><span className="text-brand-ink font-semibold">{order.payment_method}</span></div>
            <div className="flex items-center justify-between text-[0.86rem] text-brand-muted mb-1"><span>Subtotal</span><span className="text-brand-ink font-semibold">₹{Number(order.subtotal).toLocaleString("en-IN")}</span></div>
            <div className="flex items-center justify-between text-[0.86rem] text-brand-muted mb-1"><span>Shipping</span><span className="text-brand-ink font-semibold">{Number(order.shipping) === 0 ? "FREE" : `₹${Number(order.shipping).toLocaleString("en-IN")}`}</span></div>
            <div className="flex items-center justify-between text-[0.86rem] text-brand-muted mb-1"><span>Discount</span><span className="text-[#1a8a5c] font-bold">−₹{Number(order.discount).toLocaleString("en-IN")}</span></div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-brand-border">
              <span className="font-bold">Total</span>
              <span className="font-heading text-[1.4rem] font-extrabold text-brand-primary">₹{Number(order.total).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost w-full">Close</button>
        </div>
      </div>
    </div>
  );
}
