import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/383568/pexels-photo-383568.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=2000"
          alt="Gallery wall with framed photos"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/60 to-charcoal/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-2xl">
          <p className="text-gold font-medium tracking-[0.3em] uppercase text-sm mb-6 animate-fade-in">
            Museum Quality & Sustainable
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
            Frame Your
            <span className="block text-gold-light italic"> Precious</span>
            Memories
          </h1>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
            India's finest online photo printing & framing company. Handcrafted with 100% solid wood, metal & archival materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#photo-frames"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold hover:bg-gold-dark text-white font-semibold tracking-wide text-sm uppercase transition-all duration-300 rounded-sm"
            >
              Start Framing
              <ArrowRight size={18} />
            </a>
            <a
              href="#statement"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 hover:border-white/60 text-white font-medium tracking-wide text-sm uppercase transition-all duration-300 rounded-sm"
            >
              Explore Collection
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/30 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
