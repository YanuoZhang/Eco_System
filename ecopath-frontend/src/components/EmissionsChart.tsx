'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface EmissionData {
  year: number;
  value: number;
}

interface EmissionsChartProps {
  data: EmissionData[];
  title?: string;
}

const TIME_RANGES = [
  { label: '5 Years', value: 5 },
  { label: '10 Years', value: 10 },
  { label: 'All Data', value: 0 }
];

export default function EmissionsChart({ data, title = 'Greenhouse Gas Emissions' }: EmissionsChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(10);

  // Handle no data case first
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">Emissions data is not available for the selected state and time period.</p>
        </div>
      </div>
    );
  }

  // Filter data based on selected time range
  const filteredData = selectedTimeRange > 0 
    ? data.slice(-selectedTimeRange)
    : data;

  // Get latest available value
  const latestData = data.length > 0 ? data[data.length - 1] : null;

  // Custom tooltip format
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-lg p-3 shadow-lg">
          <p className="text-green-800 font-medium">
            {label} – {payload[0].value.toFixed(1)} Mt CO₂-e
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
          {latestData && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Latest:</span>
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {latestData.year}: {latestData.value.toFixed(1)} Mt CO₂-e
              </span>
            </div>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Time Range:</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ 
                value: 'Mt CO₂-e', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 12 }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
          <span>🌱</span>
          <span>Annual greenhouse gas emissions data</span>
          <span>•</span>
          <span>Source: EPA Victoria & AEMO</span>
        </div>
      </div>
    </div>
  );
}
