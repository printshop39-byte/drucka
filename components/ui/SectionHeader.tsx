import type { ReactNode } from "react";

// Standard section header: eyebrow + title + subtitle, optional right-side actions.
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = false,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  action?: ReactNode;
  className?: string;
}) {
  if (center) {
    return (
      <div className={`text-center max-w-[640px] mx-auto mb-10 ${className}`}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className={`text-[clamp(1.7rem,3.8vw,2.5rem)] ${eyebrow ? "mt-3" : ""} leading-[1.15]`}>{title}</h2>
        {subtitle && <p className="text-brand-muted text-[1.02rem] mt-2">{subtitle}</p>}
      </div>
    );
  }
  return (
    <div className={`flex items-end justify-between gap-4 flex-wrap mb-8 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className={`text-[clamp(1.6rem,3.6vw,2.3rem)] ${eyebrow ? "mt-2" : ""} leading-[1.15]`}>{title}</h2>
        {subtitle && <p className="text-brand-muted text-[0.98rem] mt-1.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
