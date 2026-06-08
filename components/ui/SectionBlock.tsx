import type { ReactNode } from "react";

// Standard section wrapper: consistent vertical padding, optional bg + borders.
export default function SectionBlock({
  children,
  background = "none",
  borderTop = false,
  borderBottom = false,
  id,
  className = "",
}: {
  children: ReactNode;
  background?: "cream" | "white" | "mint" | "none";
  borderTop?: boolean;
  borderBottom?: boolean;
  id?: string;
  className?: string;
}) {
  const bg =
    background === "white" ? "bg-white"
    : background === "mint" ? "bg-brand-mint"
    : background === "cream" ? "bg-brand-cream"
    : "";
  const borders = `${borderTop ? "border-t border-brand-border" : ""} ${borderBottom ? "border-b border-brand-border" : ""}`;
  return (
    <section id={id} className={`section-padding ${bg} ${borders} ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}
