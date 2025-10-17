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
                  const value = Number(item.value);
                  const allValues = emissionsData.data.map((d) => Number(d.value));
                  const maxAbsValue = Math.max(...allValues.map((v) => Math.abs(v)));
                  const percentage = Math.abs(value / maxAbsValue) * 100;
                  const isNegative = value < 0;

                  return (
                    <div key={item.year} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-gray-300">{item.year}</div>
                      <div className="flex-1 bg-gray-700 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ${
                            isNegative
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gradient-to-r from-red-500 to-orange-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div
                        className={`w-24 text-sm font-semibold ${isNegative ? "text-green-400" : "text-white"}`}
                      >
                        {value.toFixed(1)} Mt
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
      <div className="mt-8 max-w-4xl mx-auto space-y-4">
        {/* Negative Emissions Notice */}
        {emissionsData && emissionsData.data.some((d) => Number(d.value) < 0) && (
          <div className="bg-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌲</span>
              <div>
                <h4 className="text-lg font-semibold text-green-200 mb-2">
                  Carbon Negative Achievement
                </h4>
                <p className="text-slate-300 text-sm">
                  {stateName} shows{" "}
                  <span className="text-green-300 font-semibold">negative emissions</span> (values
                  below 0), meaning it absorbs more carbon than it emits! This is achieved through
                  extensive forests, renewable energy (especially hydro), and sustainable land
                  management. Green bars indicate carbon sequestration years.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Insights */}
        <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="text-lg font-semibold text-blue-200 mb-2">Data Insights</h4>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>
                  • <strong>Mt CO₂-e = Megatonnes CO₂ equivalent</strong> (1 Mt = 1 million tonnes)
                </li>
                <li>
                  • <strong>CO₂-e</strong> means all greenhouse gases (methane, nitrous oxide, etc.)
                  are converted to equivalent CO₂ amounts
                </li>
                <li>
                  • <strong>Example:</strong> 84.2 Mt CO₂-e = 84.2 million tonnes of CO₂ equivalent
                  emissions
                </li>
                <li>• Emissions data shows {stateName}&apos;s carbon footprint over time</li>
                <li>• Lower values indicate better environmental performance</li>
                <li>• Negative values mean the state absorbs more CO₂ than it emits</li>
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
