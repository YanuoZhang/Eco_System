"use client";

import { useState } from "react";

export interface EnergyMix {
  source: string;
  percentage: number;
  generation: string;
  trend?: number;
}

interface EnergyMixChartProps {
  data: EnergyMix[];
  title?: string;
}

export default function EnergyMixChart({
  data,
  title = "Energy Generation Mix",
}: EnergyMixChartProps) {
  const [hoveredEnergy, setHoveredEnergy] = useState<EnergyMix | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const handleEnergyHover = (energy: EnergyMix, index: number) => {
    setHoveredEnergy(energy);
    setHoveredIndex(index);
  };

  const handleEnergyLeave = () => {
    setHoveredEnergy(null);
  };

  return (
    <div
      data-testid="energy-mix-chart"
      className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm relative"
    >
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{title}</h3>

      {/* Energy Mix Bars */}
      <div className="space-y-3 sm:space-y-4">
        {data.map((energy, index) => (
          <div
            key={index}
            data-testid={`energy-source-${energy.source.toLowerCase().replace(/\s+/g, "-")}`}
            className="bg-white rounded-lg p-3 sm:p-4 border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-300 min-h-[80px] sm:min-h-[90px]"
            onMouseEnter={() => handleEnergyHover(energy, index)}
            onMouseLeave={handleEnergyLeave}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleEnergyHover(energy, index);
              }
            }}
            aria-label={`${energy.source}: ${energy.percentage}% of total generation, capacity ${energy.generation}${
              energy.trend !== undefined
                ? `, trend ${energy.trend > 0 ? "+" : ""}${energy.trend}%`
                : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="font-medium text-gray-800 text-sm sm:text-base truncate">
                  {energy.source}
                </div>
                {energy.trend !== undefined && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      energy.trend > 0
                        ? "bg-green-100 text-green-700"
                        : energy.trend < 0
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {energy.trend > 0 ? "+" : ""}
                    {energy.trend}%
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-base sm:text-lg font-bold text-purple-600">
                  {energy.percentage}%
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                  {energy.generation}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="h-2 sm:h-3 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 transition-all duration-300"
                style={{ width: `${energy.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Tooltip */}
      {hoveredEnergy && hoveredIndex >= 0 && (
        <div
          className="absolute z-50 bg-white p-3 sm:p-4 border border-gray-200 rounded-lg shadow-xl pointer-events-none"
          style={{
            left: "50%",
            top: `${hoveredIndex * 100 + 60}px`,
            transform: "translateX(-50%)",
            width: "260px",
            maxWidth: "90vw",
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <h5 className="font-semibold text-gray-800 text-lg">{hoveredEnergy.source}</h5>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">
              <span className="text-2xl font-bold text-purple-600">
                {hoveredEnergy.percentage}%
              </span>{" "}
              of total generation
            </p>
            <p className="text-gray-500 text-sm">
              Capacity:{" "}
              <span className="font-medium text-gray-700">{hoveredEnergy.generation}</span>
            </p>
            {hoveredEnergy.trend !== undefined && (
              <p className="text-gray-500 text-sm">
                Trend:{" "}
                <span
                  className={`font-medium ${
                    hoveredEnergy.trend > 0
                      ? "text-green-700"
                      : hoveredEnergy.trend < 0
                        ? "text-red-700"
                        : "text-gray-700"
                  }`}
                >
                  {hoveredEnergy.trend > 0 ? "+" : ""}
                  {hoveredEnergy.trend}%
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Accessibility info */}
      <div className="mt-3 sm:mt-4 text-xs text-gray-500 text-center">
        <p className="hidden sm:block">💡 Tip: Hover over bars for detailed information</p>
        <p className="sm:hidden">💡 Tap bars for details</p>
        <p className="hidden sm:block">⌨️ Use Tab + Enter to navigate and view details</p>
      </div>
    </div>
  );
}
