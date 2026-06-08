"use client";

import Link from "next/link";

export type AdminSection = "dashboard" | "orders" | "products" | "designs" | "payouts" | "settings";

const NAV: { id: AdminSection; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "products", label: "Products", icon: "🛍️" },
  { id: "designs", label: "Designs", icon: "🎨" },
  { id: "payouts", label: "Payouts", icon: "💰" },
  { id: "settings", label: "Store Settings", icon: "⚙️" },
];

export default function AdminSidebar({
  active,
  onSelect,
  onLogout,
}: {
  active: AdminSection;
  onSelect: (s: AdminSection) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="bg-brand-dark text-white md:rounded-premium md:sticky md:top-[88px] md:h-[calc(100vh-110px)] flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="font-heading font-extrabold text-[1.4rem] text-white">Drucka</div>
        <div className="text-white/60 text-[0.74rem] uppercase tracking-wide font-bold mt-1">Seller Admin</div>
      </div>

      {/* Nav — horizontal scroll on mobile, vertical on desktop */}
      <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-visible flex-1">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-3 rounded-[0.7rem] px-3 py-[0.7rem] text-[0.9rem] font-semibold whitespace-nowrap transition ${
              active === item.id
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span className="text-[1.05rem]">{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 flex md:flex-col gap-1">
        <Link href="/" className="flex items-center gap-3 rounded-[0.7rem] px-3 py-[0.7rem] text-[0.9rem] font-semibold text-white/70 hover:bg-white/8 hover:text-white whitespace-nowrap">
          <span className="text-[1.05rem]">↩</span> Back to Store
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 rounded-[0.7rem] px-3 py-[0.7rem] text-[0.9rem] font-semibold text-white/70 hover:bg-white/8 hover:text-white whitespace-nowrap"
        >
          <span className="text-[1.05rem]">🔒</span> Logout
        </button>
      </div>
    </aside>
  );
}
