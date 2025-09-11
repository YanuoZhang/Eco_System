export default function Hero() {
  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6">
      <div className="text-center py-6 sm:py-10">
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-slate-700/60 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6 border border-slate-500/40">
          <span className="text-lg sm:text-2xl">🌍</span>
          <span className="text-slate-100 font-medium text-xs sm:text-base">Climate Emergency</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight drop-shadow-2xl">
          Climate Change is Here.
          <br className="hidden sm:block" /> What Will You Do?
        </h1>

        <h2 className="text-base sm:text-2xl font-semibold bg-gradient-to-r from-slate-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent mb-2 sm:mb-3 drop-shadow-lg">
          The Future is Melting. Your Choices Can Stop It.
        </h2>
        <p className="text-sm sm:text-lg text-slate-200">See it. Change it. Live it.</p>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mt-5 sm:mt-8">
          <a
            href="#news-section"
            className="bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-slate-500/40 hover:bg-slate-600/70 hover:scale-105 transition-all duration-300 cursor-pointer text-left"
          >
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="text-white font-semibold">AI News Analysis</h3>
            <p className="text-slate-300 text-sm">AI-curated climate insights</p>
          </a>
          <a
            href="#timeline-section"
            className="bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-slate-500/40 hover:bg-slate-600/70 hover:scale-105 transition-all duration-300 cursor-pointer text-left"
          >
            <div className="text-2xl mb-2">📖</div>
            <h3 className="text-white font-semibold">Climate Timeline</h3>
            <p className="text-slate-300 text-sm">Our climate journey</p>
          </a>
          <a
            href="/quiz"
            className="bg-slate-700/70 backdrop-blur-sm rounded-xl p-4 border border-slate-500/40 hover:bg-slate-600/70 hover:scale-105 transition-all duration-300 cursor-pointer text-left"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-white font-semibold">My Impact</h3>
            <p className="text-slate-300 text-sm">Personal action plans</p>
          </a>
        </div>
      </div>
    </div>
  );
}
