"use client";

import { useState } from "react";

interface EquivalentsPanelProps {
  totalEmissionsKg: number;
  timeUnit: string;
}

interface EquivalentItem {
  icon: string;
  label: string;
  value: number;
  unit: string;
  testId: string;
}

export default function EquivalentsPanel({ totalEmissionsKg, timeUnit }: EquivalentsPanelProps) {
  const [showEquivalents, setShowEquivalents] = useState(true);

  // Conversion factors based on requirements
  const calculateEquivalents = (): EquivalentItem[] => {
    if (totalEmissionsKg <= 0) {
      return [];
    }

    return [
      {
        icon: "🌳",
        label: "Trees needed to absorb",
        value: Math.round(totalEmissionsKg / 21.77),
        unit: "trees",
        testId: "equiv-trees",
      },
      {
        icon: "🔋",
        label: "Phone charges",
        value: Math.round(totalEmissionsKg * 1215),
        unit: "charges",
        testId: "equiv-phones",
      },
      {
        icon: "🚗",
        label: "Petrol car kilometers",
        value: Math.round(totalEmissionsKg / 0.192),
        unit: "km",
        testId: "equiv-km",
      },
      {
        icon: "🍔",
        label: "Beef burgers",
        value: Math.round(totalEmissionsKg / 5),
        unit: "burgers",
        testId: "equiv-burgers",
      },
      {
        icon: "🥛",
        label: "Cups of milk",
        value: Math.round(totalEmissionsKg / 0.5),
        unit: "cups",
        testId: "equiv-milk",
      },
      {
        icon: "✈️",
        label: "Short-haul flights",
        value: Math.round(totalEmissionsKg / 255),
        unit: "flights",
        testId: "equiv-flights",
      },
    ];
  };

  const equivalents = calculateEquivalents();

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getTimeUnitLabel = (): string => {
    const labels: Record<string, string> = {
      day: "daily",
      week: "weekly",
      month: "monthly",
      quarter: "quarterly",
      year: "yearly",
    };
    return labels[timeUnit] || "per period";
  };

  if (totalEmissionsKg <= 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-green-200 mt-4">
        <div className="text-center text-gray-500 py-4">
          <span className="text-2xl mb-2 block">📊</span>
          <p>No equivalents available.</p>
          <p className="text-sm mt-1">Calculate your emissions to see everyday equivalents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-green-200 mt-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-green-800 flex items-center space-x-2">
          <span className="text-xl">🌍</span>
          <span>Everyday Equivalents</span>
        </h4>
        <button
          onClick={() => setShowEquivalents(!showEquivalents)}
          className="text-green-600 hover:text-green-800 transition-colors text-sm font-medium"
          data-testid="equivalents-toggle"
        >
          {showEquivalents ? "Hide" : "Show"} equivalents
        </button>
      </div>

      {/* Equivalents content */}
      {showEquivalents && (
        <div className="space-y-3">
          <p className="text-sm text-green-600 mb-4">
            Your {getTimeUnitLabel()} CO₂ emissions equivalent to:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {equivalents.map((item) => (
              <div
                key={item.testId}
                className="bg-green-50 rounded-lg p-3 border border-green-200 hover:bg-green-100 transition-colors"
                data-testid={item.testId}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium text-green-800">{item.label}</span>
                </div>
                <div className="text-xl font-bold text-green-700">{formatNumber(item.value)}</div>
                <div className="text-xs text-green-600">{item.unit}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Note:</span> These equivalents are approximate and based
              on average values. Actual environmental impact may vary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
