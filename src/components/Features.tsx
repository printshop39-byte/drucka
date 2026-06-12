import { Printer, Truck, RefreshCw } from 'lucide-react';

const features = [
  {
    icon: Printer,
    title: 'Giclée Prints',
    description: 'Get your photographs printed with the highest quality and longevity with our fine art giclée printing.',
  },
  {
    icon: Truck,
    title: 'Shipping Across India',
    description: 'Spend more and save on delivery costs with our free shipping on qualifying orders.',
  },
  {
    icon: RefreshCw,
    title: '7 Days Replacement',
    description: 'Hassle-free replacement within a week of your order. No questions asked.',
  },
];

export default function Features() {
  return (
    <section className="py-16 bg-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-5 border border-gold/30 rounded-full flex items-center justify-center group-hover:border-gold transition-colors">
                <feature.icon size={24} className="text-gold" />
              </div>
              <h3 className="font-serif font-semibold text-white text-lg mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
