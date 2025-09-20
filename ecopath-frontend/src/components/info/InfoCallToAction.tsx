import Link from "next/link";

export default function InfoCallToAction() {
  return (
    <section className="py-16 sm:py-20 relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-teal-700/60 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-teal-500/40">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Data Shows Us Reality, Action Determines Our Future
          </h2>

          <p className="text-lg sm:text-xl text-teal-100 leading-relaxed mb-8 max-w-3xl mx-auto">
            Now that you understand these data and trends, it&apos;s time to explore your personal
            environmental impact and discover how to contribute to positive change.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/quiz"
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-600 hover:via-teal-600 hover:to-green-600 text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 whitespace-nowrap cursor-pointer transform hover:shadow-emerald-500/30 ring-4 ring-emerald-400/20"
            >
              Explore My Environmental Impact →
            </a>
            <Link
              href="/"
              className="border-2 border-teal-400/50 hover:bg-teal-400/10 text-teal-200 font-semibold text-xl px-12 py-5 rounded-full transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
