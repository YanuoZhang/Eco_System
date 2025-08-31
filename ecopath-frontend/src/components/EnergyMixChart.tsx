"use client";

import { useState } from "react";

export interface EnergyMix {
  source: string;
  percentage: number;
  generation: string;
  trend: number;
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
      className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm relative"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>

      {/* Energy Mix Bars */}
      <div className="space-y-4">
        {data.map((energy, index) => (
          <div
            key={index}
            data-testid={`energy-source-${energy.source.toLowerCase().replace(/\s+/g, "-")}`}
            className="bg-white rounded-lg p-4 border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-300"
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
            aria-label={`${energy.source}: ${energy.percentage}% of total generation, capacity ${energy.generation}, trend ${energy.trend > 0 ? "+" : ""}${energy.trend}%`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="font-medium text-gray-800">{energy.source}</div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    energy.trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {energy.trend > 0 ? "+" : ""}
                  {energy.trend}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">{energy.percentage}%</div>
                <div className="text-xs text-gray-500">{energy.generation}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 transition-all duration-300"
                style={{ width: `${energy.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Tooltip */}
      {hoveredEnergy && hoveredIndex >= 0 && (
        <div
          className="absolute z-50 bg-white p-4 border border-gray-200 rounded-lg shadow-xl pointer-events-none"
          style={{
            left: "50%",
            top: `${hoveredIndex * 120 + 80}px`,
            transform: "translateX(-50%)",
            width: "280px",
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
            <p
              className={`text-sm font-medium ${
                hoveredEnergy.trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Trend: {hoveredEnergy.trend > 0 ? "+" : ""}
              {hoveredEnergy.trend}%
            </p>
          </div>
        </div>
      )}

      {/* Accessibility info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Tip: Hover over bars for detailed information</p>
        <p>⌨️ Use Tab + Enter to navigate and view details</p>
      </div>
    </div>
  );
}
