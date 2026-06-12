import { Award, Leaf, Star, Package } from 'lucide-react';

const stats = [
  { icon: Award, label: 'Museum Grade', value: 'Quality' },
  { icon: Leaf, label: '100% Sustainable', value: 'Materials' },
  { icon: Star, label: '10,000+', value: 'Happy Customers' },
  { icon: Package, label: 'Free Shipping', value: 'Across India' },
];

export default function TrustBar() {
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
