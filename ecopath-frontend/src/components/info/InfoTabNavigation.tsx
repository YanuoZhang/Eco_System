interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface InfoTabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs: Tab[] = [
  { id: "emissions", label: "Carbon Emissions", icon: "🏭" },
  { id: "energy", label: "Energy Mix", icon: "⚡" },
  { id: "targets", label: "Climate Targets", icon: "🎯" },
];

export default function InfoTabNavigation({ activeTab, onTabChange }: InfoTabNavigationProps) {
  return (
    <section className="py-8 bg-blue-700/30 backdrop-blur-sm border-b border-blue-500/30 sticky top-16 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-center overflow-x-auto pb-4">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-teal-600 text-white shadow-lg scale-105"
                    : "bg-slate-600/70 text-slate-200 hover:bg-slate-500/70 hover:scale-105"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
