import Link from "next/link";
import type { ReactNode } from "react";

// Standard empty/placeholder state: icon, title, message, optional action.
export default function EmptyState({
  icon = "📭",
  title,
  message,
  action,
  className = "",
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; href: string } | ReactNode;
  className?: string;
}) {
  const isLinkAction = action && typeof action === "object" && "href" in (action as object);
  return (
    <div className={`card-standard p-8 text-center ${className}`}>
      <div className="w-14 h-14 mx-auto rounded-full bg-brand-mint flex items-center justify-center text-[1.8rem]">{icon}</div>
      <h3 className="font-heading text-[1.3rem] mt-4">{title}</h3>
      {message && <p className="text-brand-muted text-[0.9rem] mt-2 max-w-[420px] mx-auto">{message}</p>}
      {action && (
        <div className="mt-5">
          {isLinkAction
            ? <Link href={(action as { href: string }).href} className="btn-primary">{(action as { label: string }).label}</Link>
            : (action as ReactNode)}
        </div>
      )}
    </div>
  );
}
