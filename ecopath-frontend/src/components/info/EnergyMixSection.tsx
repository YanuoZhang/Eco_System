import { useState } from "react";
import { EnergyMixData } from "./types";

interface EnergyMixSectionProps {
  energyMixData: EnergyMixData[];
  selectedState: string;
  stateName: string;
}

export default function EnergyMixSection({ energyMixData, stateName }: EnergyMixSectionProps) {
  const [hoveredSlice, setHoveredSlice] = useState<EnergyMixData | null>(null);
  const getEnergyColor = (source: string) => {
    const colors: { [key: string]: string } = {
      coal: "#374151",
      gas: "#2563eb",
      solar: "#eab308",
      wind: "#22c55e",
      hydro: "#3b82f6",
      battery: "#8b5cf6",
      bioenergy: "#16a34a",
      distillate: "#f97316",
    };
    return colors[source.toLowerCase()] || "#6b7280";
  };

  // Calculate totals and categories
  const totalCapacity = energyMixData.reduce((sum, energy) => sum + Number(energy.generation), 0);
  const renewableSources = ["solar", "wind", "hydro", "battery", "bioenergy"];
  const fossilSources = ["coal", "gas", "distillate"];

  const renewableTotal = energyMixData
    .filter((energy) => renewableSources.includes(energy.source.toLowerCase()))
    .reduce((sum, energy) => sum + Number(energy.generation), 0);

  const fossilTotal = energyMixData
    .filter((energy) => fossilSources.includes(energy.source.toLowerCase()))
    .reduce((sum, energy) => sum + Number(energy.generation), 0);

  const renewablePercentage = ((renewableTotal / totalCapacity) * 100).toFixed(1);
  const fossilPercentage = ((fossilTotal / totalCapacity) * 100).toFixed(1);

  // Generate pie chart data
  let cumulativePercentage = 0;
  const pieChartData = energyMixData.map((energy) => {
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + energy.percentage) / 100) * 360;
    cumulativePercentage += energy.percentage;

    return {
      ...energy,
      startAngle,
      endAngle,
      color: getEnergyColor(energy.source),
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Energy Structure - {stateName}
        </h2>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Current energy generation mix and capacity breakdown
        </p>
      </div>

      {energyMixData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Panel - Pie Chart */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Energy Generation Share
            </h3>

            {/* Pie Chart */}
            <div className="relative w-80 h-80 mx-auto mb-6 group">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {pieChartData.map((slice) => {
                  const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
                  const startX = 50 + 50 * Math.cos(((slice.startAngle - 90) * Math.PI) / 180);
                  const startY = 50 + 50 * Math.sin(((slice.startAngle - 90) * Math.PI) / 180);
                  const endX = 50 + 50 * Math.cos(((slice.endAngle - 90) * Math.PI) / 180);
                  const endY = 50 + 50 * Math.sin(((slice.endAngle - 90) * Math.PI) / 180);

                  const pathData = [
                    `M 50 50`,
                    `L ${startX} ${startY}`,
                    `A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                    "Z",
                  ].join(" ");

                  return (
                    <g key={slice.source}>
                      <path
                        d={pathData}
                        fill={slice.color}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="0.5"
                        className="cursor-pointer transition-all duration-200 hover:opacity-80"
                        onMouseEnter={() => {
                          console.log("Mouse enter:", slice.source);
                          setHoveredSlice(slice);
                        }}
                        onMouseLeave={() => {
                          console.log("Mouse leave:", slice.source);
                          setHoveredSlice(null);
                        }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Hover Info Display */}
              {hoveredSlice && (
                <div className="absolute top-2 left-2 bg-black/95 text-white px-4 py-3 rounded-lg border border-white/20 pointer-events-none z-20 shadow-lg">
                  <div className="font-bold capitalize text-lg">{hoveredSlice.source}</div>
                  <div className="text-base text-gray-200 mt-1">
                    {hoveredSlice.percentage}% • {Number(hoveredSlice.generation).toFixed(1)} GWh
                  </div>
                </div>
              )}

              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{totalCapacity.toFixed(1)}</div>
                  <div className="text-base text-gray-300">GWh Total</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 text-sm mb-6">
              {energyMixData.map((energy) => (
                <div key={energy.source} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getEnergyColor(energy.source) }}
                  ></div>
                  <span className="text-gray-300 capitalize truncate">
                    {energy.source}: {energy.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {/* Environmental Impact */}
            <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
              <h4 className="text-sm font-semibold text-green-200 mb-2">Environmental Impact</h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• {renewablePercentage}% renewable energy reduces carbon emissions</div>
                <div>• Clean sources help achieve climate targets</div>
                <div>• Transition to renewables is accelerating</div>
                <div>• Renewable energy significantly reduces carbon footprint</div>
              </div>
            </div>
          </div>

          {/* Right Panels */}
          <div className="space-y-6">
            {/* Renewable Energy Panel */}
            <div className="bg-gradient-to-br from-green-800/90 to-green-900/90 rounded-2xl p-6 border border-green-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-green-200 mb-4">Renewable Energy</h3>
              <div className="text-4xl font-bold text-green-400 mb-4">{renewablePercentage}%</div>

              <div className="space-y-2 mb-4">
                {energyMixData
                  .filter((energy) => renewableSources.includes(energy.source.toLowerCase()))
                  .map((energy) => (
                    <div key={energy.source} className="flex justify-between">
                      <span className="text-green-200 capitalize">{energy.source}:</span>
                      <span className="text-green-300">{energy.percentage}%</span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-2 text-green-300 text-sm">
                <span>↗</span>
                <span>Growing at +12.4% annually</span>
              </div>
            </div>

            {/* Fossil Fuels Panel */}
            <div className="bg-gradient-to-br from-orange-800/90 to-red-900/90 rounded-2xl p-6 border border-orange-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-orange-200 mb-4">Fossil Fuels</h3>
              <div className="text-4xl font-bold text-orange-400 mb-4">{fossilPercentage}%</div>

              <div className="space-y-2 mb-4">
                {energyMixData
                  .filter((energy) => fossilSources.includes(energy.source.toLowerCase()))
                  .map((energy) => (
                    <div key={energy.source} className="flex justify-between">
                      <span className="text-orange-200 capitalize">{energy.source}:</span>
                      <span className="text-orange-300">{energy.percentage}%</span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-2 text-orange-300 text-sm">
                <span>↘</span>
                <span>Decreasing as renewables grow</span>
              </div>
            </div>

            {/* Total Installed Capacity Panel */}
            <div className="bg-gradient-to-br from-blue-800/90 to-blue-900/90 rounded-2xl p-6 border border-blue-700/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-blue-200 mb-4">Total Installed Capacity</h3>

              <div className="grid grid-cols-2 gap-4">
                {energyMixData.map((energy) => (
                  <div key={energy.source} className="flex justify-between items-center">
                    <span className="text-blue-200 capitalize">{energy.source}:</span>
                    <span className="text-blue-300 font-semibold">
                      {Number(energy.generation).toFixed(1)} GWh
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No energy mix data available for {stateName}</div>
        </div>
      )}
    </div>
  );
}
