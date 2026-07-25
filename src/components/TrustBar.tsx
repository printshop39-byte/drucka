import type { LucideIcon } from 'lucide-react';

/* EMPTY ON PURPOSE. All four stats were removed 2026-07-25 because every one
   of them was either unverifiable or wrong:
     • "10,000+ Happy Customers"      — no source
     • "100% Sustainable Materials"   — unsubstantiated environmental claim
     • "Museum Grade Quality"         — unsubstantiated
     • "Free Shipping Across India"   — contradicted the announcement bar,
                                        which correctly says free above ₹2,999
   This section is already off the homepage (folded into WhyDrucka). With an
   empty list it renders nothing, so it cannot silently return with invented
   figures. Re-add only claims Drucka can actually evidence. */
const stats: Array<{ icon: LucideIcon; label: string; value: string }> = [];

export default function TrustBar() {
  if (stats.length === 0) return null;
  return (
    <section className="bg-white border-b border-stone/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0">
                <stat.icon size={20} className="text-gold" />
              </div>
              <div>
                <p className="font-semibold text-charcoal text-sm">{stat.label}</p>
                <p className="text-xs text-charcoal/50">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
