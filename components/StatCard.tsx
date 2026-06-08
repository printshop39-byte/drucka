import Link from "next/link";

export interface Stat {
  icon: string;
  label: string;
  value: string;
  note?: string;
  href?: string;
  accent?: boolean; // highlight (e.g. revenue)
}

export default function StatCard({ stat }: { stat: Stat }) {
  const inner = (
    <div className={`rounded-premium border p-[20px] h-full transition hover:-translate-y-1 hover:shadow-premium ${
      stat.accent
        ? "bg-gradient-to-br from-brand-primary to-brand-dark border-brand-dark text-white shadow-premium"
        : "bg-white border-brand-border shadow-soft hover:border-brand-gold/45"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[1.25rem] ${stat.accent ? "bg-white/15" : "bg-brand-mint"}`}>{stat.icon}</span>
        <span className={`font-heading text-[1.7rem] font-extrabold leading-none ${stat.accent ? "text-white" : "text-brand-primary"}`}>{stat.value}</span>
      </div>
      <div className={`mt-[14px] font-bold text-[0.95rem] ${stat.accent ? "text-white" : ""}`}>{stat.label}</div>
      {stat.note && <div className={`text-[0.78rem] ${stat.accent ? "text-white/70" : "text-brand-muted"}`}>{stat.note}</div>}
    </div>
  );
  return stat.href ? <Link href={stat.href} className="block">{inner}</Link> : <div>{inner}</div>;
}
