import Link from "next/link";

export interface Metric {
  icon: string;
  value: string;
  label: string;
  sublabel?: string;
  href?: string;
  accent?: boolean; // highlighted (e.g. revenue / primary stat)
}

// Standard metric/stat card — used in admin dashboard, homepage trust stats.
export default function MetricCard({ metric }: { metric: Metric }) {
  const inner = (
    <div className={`rounded-premium border p-5 h-full transition ${
      metric.accent
        ? "bg-gradient-to-br from-brand-primary to-brand-dark border-brand-dark text-white shadow-premium"
        : "card-standard card-hover"
    }`}>
      <div className="flex items-center justify-between">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[1.25rem] ${metric.accent ? "bg-white/15" : "bg-brand-mint"}`}>{metric.icon}</span>
        <span className={`font-heading text-[1.7rem] font-extrabold leading-none ${metric.accent ? "text-white" : "text-brand-primary"}`}>{metric.value}</span>
      </div>
      <div className={`mt-[14px] font-bold text-[0.95rem] ${metric.accent ? "text-white" : ""}`}>{metric.label}</div>
      {metric.sublabel && <div className={`text-[0.78rem] ${metric.accent ? "text-white/70" : "text-brand-muted"}`}>{metric.sublabel}</div>}
    </div>
  );
  return metric.href ? <Link href={metric.href} className="block">{inner}</Link> : <div>{inner}</div>;
}
