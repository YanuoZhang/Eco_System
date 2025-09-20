interface InfoHeroProps {
  selectedState: string;
  states: Array<{ id: string; name: string }>;
  onStateChange: (state: string) => void;
}

export default function InfoHero({ selectedState, states, onStateChange }: InfoHeroProps) {
  return (
    <section className="pt-24 pb-16 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-3 bg-blue-600/40 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-blue-400/30">
          <span className="text-2xl">📊</span>
          <span className="text-blue-200 font-medium">Climate Data & Analytics</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Australian Climate Data Center
        </h1>

        <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto">
          Real-time insights into Australia&apos;s carbon emissions, energy structure, and climate
          targets based on authoritative data sources.
        </p>

        {/* State Selector */}
        <div className="flex justify-center mb-8">
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="bg-slate-600/70 backdrop-blur-sm border border-slate-400/30 rounded-full px-6 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {states.map((state) => (
              <option key={state.id} value={state.id} className="bg-slate-700">
                {state.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
