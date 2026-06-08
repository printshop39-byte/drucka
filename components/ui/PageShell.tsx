import type { ReactNode } from "react";

// Standard page container: max-width + consistent padding, optional background.
export default function PageShell({
  children,
  background = "cream",
  className = "",
}: {
  children: ReactNode;
  background?: "cream" | "white" | "mint" | "none";
  className?: string;
}) {
  const bg =
    background === "white" ? "bg-white"
    : background === "mint" ? "bg-brand-mint"
    : background === "none" ? ""
    : "bg-brand-cream";
  return (
    <div className={bg}>
      <div className={`container-page ${className}`}>{children}</div>
    </div>
  );
}
