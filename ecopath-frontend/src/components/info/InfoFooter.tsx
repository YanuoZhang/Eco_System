export default function InfoFooter() {
  return (
    <footer className="py-16 sm:py-20 border-t border-emerald-600/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <div className="font-['Pacifico'] text-3xl sm:text-4xl text-emerald-300 mb-6">
            EcoPath
          </div>
          <p className="text-lg sm:text-xl text-emerald-200 max-w-3xl mx-auto mb-8">
            Climate information platform based on authoritative data sources, providing scientific
            support for personal environmental action
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12 text-emerald-300 text-base">
            <span className="flex items-center gap-2">📊 Real-time Data Updates</span>
            <span className="flex items-center gap-2">🔬 Scientific Data Analysis</span>
            <span className="flex items-center gap-2">🎯 Climate Target Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
