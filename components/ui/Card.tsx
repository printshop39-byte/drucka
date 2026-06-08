import type { ReactNode } from "react";

// Standard white card: border, rounded-premium, soft shadow, optional hover lift.
export default function Card({
  children,
  hover = false,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return (
    <Tag className={`card-standard ${hover ? "card-hover" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
