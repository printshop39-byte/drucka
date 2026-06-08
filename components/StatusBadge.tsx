import type { OrderStatus } from "@/lib/orders";

// Shared status badge styling so admin + track-order look consistent.
const STATUS_STYLES: Record<OrderStatus, string> = {
  New: "badge-gold",
  "In Design Review": "badge-green",
  Printing: "badge-green",
  "Ready to Ship": "badge-green",
  Delivered: "badge-dark",
};

export function statusClass(status: OrderStatus): string {
  return STATUS_STYLES[status] ?? "badge-green";
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${statusClass(status)}`}>{status}</span>;
}
