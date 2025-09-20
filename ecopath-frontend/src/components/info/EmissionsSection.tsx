import { EmissionsData } from "./types";

interface EmissionsSectionProps {
  emissionsData: EmissionsData | null;
  selectedState: string;
  stateName: string;
}

export default function EmissionsSection({ emissionsData, stateName }: EmissionsSectionProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Carbon Emissions Analysis - {stateName}
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Historical emissions data showing trends over the last 10 years
        </p>
      </div>

      {emissionsData && (
        <div className="max-w-4xl mx-auto">
          {/* Emissions Trend Chart */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">10-Year Trend</h3>
            {emissionsData.data.length > 0 ? (
              <div className="space-y-3">
                {emissionsData.data.slice(0, 10).map((item) => {
                  const maxValue = Math.max(...emissionsData.data.map((d) => Number(d.value)));
                  const percentage = (Number(item.value) / maxValue) * 100;
                  return (
                    <div key={item.year} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-gray-300">{item.year}</div>
                      <div className="flex-1 bg-gray-700 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-20 text-sm text-white font-semibold">
                        {Number(item.value).toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400">No trend data available</div>
            )}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 max-w-4xl mx-auto">
        <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="text-lg font-semibold text-blue-200 mb-2">Data Insights</h4>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>• Emissions data shows {stateName}&apos;s carbon footprint over time</li>
                <li>• Lower values indicate better environmental performance</li>
                <li>• Trends help identify if the state is on track for climate targets</li>
                <li>• Data is sourced from official government emissions inventories</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
