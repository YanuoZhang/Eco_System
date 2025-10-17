import { ClimateTarget } from "./types";

interface ClimateTargetsSectionProps {
  climateTarget: ClimateTarget | null;
  selectedState: string;
  stateName: string;
}

export default function ClimateTargetsSection({
  climateTarget,
  stateName,
}: ClimateTargetsSectionProps) {
  const getProgressColor = (progress: string | number) => {
    const numProgress = Number(progress);
    if (numProgress >= 80) return "text-green-400";
    if (numProgress >= 50) return "text-yellow-400";
    if (numProgress >= 20) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Climate Targets - {stateName}
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          State climate targets and current progress towards achieving them
        </p>
      </div>

      {climateTarget ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Target Overview */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Target Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Plan Name:</span>
                <span className="text-white font-semibold">{climateTarget.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Target Year:</span>
                <span className="text-white font-semibold">{climateTarget.targetYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Baseline Year:</span>
                <span className="text-white font-semibold">{climateTarget.baselineYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Target Reduction:</span>
                <span className="text-white font-semibold">{climateTarget.targetValuePct}%</span>
              </div>
              {climateTarget.notes && (
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300 text-sm">{climateTarget.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Progress Tracking</h3>
            <div className="text-center mb-6">
              <div
                className={`text-4xl font-bold mb-2 ${getProgressColor(climateTarget.progress)}`}
              >
                {Number(climateTarget.progress).toFixed(1)}%
              </div>
              <div className="text-lg text-gray-300 mb-2">Achieved Reduction</div>
              <div className="text-sm text-gray-400">{climateTarget.progressDescription}</div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    Number(climateTarget.progress) >= 80
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : Number(climateTarget.progress) >= 50
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : Number(climateTarget.progress) >= 20
                          ? "bg-gradient-to-r from-orange-500 to-red-500"
                          : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}
                  style={{ width: `${Math.min(Number(climateTarget.progress), 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0%</span>
                <span>{climateTarget.targetValuePct}% Target</span>
                <span>100%</span>
              </div>
            </div>

            {climateTarget.latestEmissions && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    Latest Emissions ({climateTarget.latestEmissions.year}):
                  </span>
                  <span className="text-white font-semibold">
                    {Number(climateTarget.latestEmissions.value).toFixed(1)} Mt CO₂-e
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            No climate target data available for {stateName}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8">
        <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h4 className="text-lg font-semibold text-purple-200 mb-2">Target Insights</h4>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>
                  • <strong>Mt CO₂-e = Megatonnes CO₂ equivalent</strong> (1 Mt = 1 million tonnes)
                </li>
                <li>• Climate targets are legally binding commitments to reduce emissions</li>
                <li>• Progress is measured against baseline year emissions</li>
                <li>• States must accelerate efforts to meet ambitious targets</li>
                <li>• Individual actions contribute to achieving these goals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
