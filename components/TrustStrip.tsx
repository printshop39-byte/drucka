// A small trust/benefits strip — reassures customers near hero/products.
const ITEMS = [
  { icon: "🎨", text: "Free design preview" },
  { icon: "💬", text: "WhatsApp order support" },
  { icon: "🔒", text: "Secure UPI payment" },
  { icon: "🚚", text: "Fast delivery" },
];

export default function TrustStrip() {
  return (
    <div className="grid grid-cols-4 max-[700px]:grid-cols-2 gap-3">
      {ITEMS.map((it) => (
        <div key={it.text} className="flex items-center gap-2 bg-white border border-brand-border rounded-[0.8rem] px-3 py-[10px] text-[0.82rem] font-semibold text-brand-ink">
          <span className="text-[1.1rem]">{it.icon}</span>
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
