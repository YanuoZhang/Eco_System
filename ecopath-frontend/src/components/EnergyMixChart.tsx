"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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
  // Define colors for different energy sources
  const COLORS = [
    "#8B5CF6", // Purple - Coal
    "#3B82F6", // Blue - Gas
    "#10B981", // Green - Solar
    "#F59E0B", // Yellow - Wind
    "#EF4444", // Red - Hydro
    "#06B6D4", // Cyan - Other
    "#84CC16", // Lime - Nuclear
    "#F97316", // Orange - Biomass
  ];

  // Transform data for pie chart
  const pieData = data.map((item, index) => ({
    name: item.source,
    value: item.percentage,
    generation: item.generation,
    trend: item.trend,
    fill: COLORS[index % COLORS.length],
  }));

  // Custom tooltip component
  type EnergySlice = {
    name: string;
    value: number;
    generation: string;
    trend?: number;
    fill: string;
  };
  type TooltipPayload = { payload: EnergySlice };
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.fill }}></div>
            <h5 className="font-semibold text-gray-800">{data.name}</h5>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600">
              <span className="text-xl font-bold" style={{ color: data.fill }}>
                {data.value}%
              </span>{" "}
              of total generation
            </p>
            <p className="text-gray-500 text-sm">
              Capacity: <span className="font-medium text-gray-700">{data.generation}</span>
            </p>
            {data.trend !== undefined && (
              <p className="text-gray-500 text-sm">
                Trend:{" "}
                <span
                  className={`font-medium ${
                    data.trend > 0
                      ? "text-green-700"
                      : data.trend < 0
                        ? "text-red-700"
                        : "text-gray-700"
                  }`}
                >
                  {data.trend > 0 ? "+" : ""}
                  {data.trend}%
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      data-testid="energy-mix-chart"
      className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm"
    >
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6 text-center">{title}</h3>

      {/* Pie Chart */}
      <div className="h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  data-testid={`energy-source-${entry.name.toLowerCase().replace(/\s+/g, "-")}`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Energy source details */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((energy, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <div>
                <div className="font-medium text-gray-800 text-sm">{energy.source}</div>
                <div className="text-xs text-gray-500">{energy.generation}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                {energy.percentage}%
              </div>
              {energy.trend !== undefined && (
                <div
                  className={`text-xs font-medium ${
                    energy.trend > 0
                      ? "text-green-700"
                      : energy.trend < 0
                        ? "text-red-700"
                        : "text-gray-700"
                  }`}
                >
                  {energy.trend > 0 ? "+" : ""}
                  {energy.trend}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Accessibility info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Hover over chart segments for detailed information</p>
      </div>
    </div>
  );
}
