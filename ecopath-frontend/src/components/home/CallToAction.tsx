export default function CallToAction() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Soft blending overlays to avoid hard splits between sections */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-24" style={{background: 'linear-gradient(180deg, rgba(59,106,122,0.4) 0%, rgba(59,106,122,0) 100%)'}} />
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{background: 'linear-gradient(0deg, rgba(59,106,122,0.4) 0%, rgba(59,106,122,0) 100%)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="bg-slate-700/50 backdrop-blur-md rounded-2xl p-8 lg:p-12 border border-slate-500/30 shadow-2xl/20">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6">
              <span className="text-3xl">🤔</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">Now the question is...</h2>
            <p className="text-base md:text-lg lg:text-xl text-slate-100 leading-relaxed mb-4">
              You&apos;ve seen the global story unfold. You&apos;ve witnessed the impacts happening around you.
              The data is clear, the science is certain, the impacts are here.
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-white font-semibold mb-6">But what is <em>your</em> role in this story?</p>
            <div className="bg-blue-600/30 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-6 border border-blue-400/40">
              <p className="text-sm md:text-base lg:text-lg text-blue-100 leading-relaxed">
                Every choice you make - from the energy that powers your home to the food on your plate,
                from how you travel to what you buy - contributes to the story we&apos;re collectively writing.
                Understanding your personal environmental impact isn&apos;t about guilt; it&apos;s about power.
              </p>
            </div>
            <p className="text-base md:text-lg text-slate-200 mb-8">
              The power to change course. The power to be part of the solution. The power to ensure the next chapter is one of hope and action.
            </p>
            <a
              href="/quiz"
              className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-bold text-lg sm:text-xl lg:text-2xl px-8 sm:px-12 lg:px-16 py-4 sm:py-5 lg:py-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 whitespace-nowrap cursor-pointer transform hover:shadow-blue-500/30 ring-4 ring-blue-400/20 inline-block"
            >
              Explore My Climate Impact →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


