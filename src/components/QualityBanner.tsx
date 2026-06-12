export default function QualityBanner() {
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/18947394/pexels-photo-18947394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600"
          alt="Craftsman working on frames"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/75"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-sm sm:text-base uppercase tracking-[0.3em] text-gold mb-6 font-medium">
          Frames That Will Last a Lifetime
        </h2>
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-8 leading-tight">
          Museum Quality &<br />Sustainable
        </h3>
        <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          More than 99% of photo frames made in India are made out of plastic. We are on a mission to provide the highest quality, sustainable frames made of 100% solid wood, aluminium metal & high-density polystyrene at the best price.
        </p>
        <a
          href="#photo-frames"
          className="inline-flex items-center gap-2 px-10 py-4 bg-gold hover:bg-gold-dark text-white font-semibold tracking-wide text-sm uppercase transition-all rounded-sm"
        >
          Start Framing
        </a>
      </div>
    </section>
  );
}
