import type { ReactNode } from "react";

// Consistent section header: small eyebrow, big heading, optional subtitle.
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = false,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={`${center ? "text-center max-w-[640px] mx-auto" : "flex items-end justify-between gap-4 flex-wrap"} mb-8`}>
      <div className={center ? "" : "min-w-0"}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className={`text-[clamp(1.6rem,3.6vw,2.4rem)] ${eyebrow ? "mt-3" : ""} leading-[1.15]`}>{title}</h2>
        {subtitle && <p className="text-brand-muted text-[1rem] mt-2">{subtitle}</p>}
      </div>
      {!center && action}
    </div>
  );
}
