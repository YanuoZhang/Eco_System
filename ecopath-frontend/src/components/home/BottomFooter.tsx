export default function BottomFooter() {
  return (
    <footer className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center">
          <div className="font-['Pacifico'] text-4xl text-teal-200 mb-6">EcoPath</div>
          <p className="text-xl text-slate-100 max-w-3xl mx-auto mb-8">
            AI-powered climate insights and personal action tracking platform, dedicated to creating
            meaningful environmental impact.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12 text-teal-200 text-base">
            <span className="flex items-center gap-2">🤖 AI-Curated News</span>
            <span className="flex items-center gap-2">📖 Story Mode Timeline</span>
            <span className="flex items-center gap-2">📊 Climate Data Analysis</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
