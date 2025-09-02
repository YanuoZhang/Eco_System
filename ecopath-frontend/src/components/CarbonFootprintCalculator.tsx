"use client";

import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { useStateContext } from "@/contexts/StateContext";
import TimeUnitSelector, { TimeUnit } from "./TimeUnitSelector";

interface FormData {
  electricity: string;
  gas: string;
  transportMode: string;
  distance: string;
}

interface CalculationResult {
  totalEmissions: number;
  breakdown: {
    electricity: number;
    gas: number;
    transport: number;
  };
  comparison: number;
}

interface CarbonFootprintCalculatorProps {
  onNext?: () => void;
  onPrev?: () => void;
}

const transportOptions = [
  { value: "car-petrol", label: "Petrol Car", emissionFactor: 0.21 },
  { value: "car-diesel", label: "Diesel Car", emissionFactor: 0.17 },
  { value: "car-hybrid", label: "Hybrid Car", emissionFactor: 0.12 },
  { value: "car-electric", label: "Electric Vehicle", emissionFactor: 0.05 },
  { value: "public-transport", label: "Public Transport", emissionFactor: 0.08 },
  { value: "bike-walk", label: "Cycling/Walking", emissionFactor: 0.01 },
];

const transportTimeframes = [
  { value: "day", label: "Daily", multiplier: 365 },
  { value: "month", label: "Monthly", multiplier: 12 },
  { value: "quarter", label: "Yearly", multiplier: 1 },
];

export default function CarbonFootprintCalculator({
  onNext,
  onPrev,
}: CarbonFootprintCalculatorProps) {
  const { selectedState } = useStateContext();
  const [mounted, setMounted] = useState(false);
  const [timeUnit, setTimeUnit] = useState<TimeUnit["value"]>("month");
  const [transportTimeframe, setTransportTimeframe] = useState<
    "day" | "week" | "month" | "quarter"
  >("day");
  const [formData, setFormData] = useState<FormData>({
    electricity: "",
    gas: "",
    transportMode: "",
    distance: "",
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const getFieldLabel = (field: "electricity" | "gas" | "distance") => {
    const unitLabels = {
      day: "Daily",
      week: "Weekly",
      month: "Monthly",
      quarter: "Quarterly",
    };

    const fieldLabels = {
      electricity: `Electricity (kWh) - ${unitLabels[timeUnit]}`,
      gas: `Gas (MJ) - ${unitLabels[timeUnit]}`,
      distance: `Distance (km) - ${unitLabels[timeUnit]}`,
    };

    return fieldLabels[field];
  };

  const getPlaceholder = (field: "electricity" | "gas" | "distance") => {
    const placeholders = {
      electricity:
        timeUnit === "day"
          ? "e.g., 30"
          : timeUnit === "week"
            ? "e.g., 200"
            : timeUnit === "month"
              ? "e.g., 800"
              : "e.g., 2400",
      gas:
        timeUnit === "day"
          ? "e.g., 50"
          : timeUnit === "week"
            ? "e.g., 350"
            : timeUnit === "month"
              ? "e.g., 1500"
              : "e.g., 4500",
      distance:
        timeUnit === "day"
          ? "e.g., 25"
          : timeUnit === "week"
            ? "e.g., 175"
            : timeUnit === "month"
              ? "e.g., 750"
              : "e.g., 2250",
    };

    return placeholders[field];
  };

  const calculateEmissions = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      // 将前端选择映射到后端 API 所需格式
      const stateCodeMatch = selectedState.match(/\((.*?)\)/);
      const stateCode = stateCodeMatch ? stateCodeMatch[1] : "VIC";

      const transportModeMap: Record<
        string,
        "car" | "bus" | "train" | "tram" | "bicycle" | "walking"
      > = {
        "car-petrol": "car",
        "car-diesel": "car",
        "car-hybrid": "car",
        "car-electric": "car",
        "public-transport": "bus",
        "bike-walk": "bicycle",
      };

      const energyPayload =
        formData.electricity || formData.gas
          ? {
              electricity: formData.electricity ? Number(formData.electricity) : undefined,
              gas: formData.gas ? Number(formData.gas) : undefined,
              timeUnit: (timeUnit as "month" | "quarter" | "year") ?? "month",
            }
          : undefined;

      const transportPayload =
        formData.transportMode && formData.distance
          ? {
              mode: transportModeMap[formData.transportMode] ?? "car",
              distance: Number(formData.distance),
              timeUnit: (transportTimeframe as "day" | "week" | "month" | "year") ?? "day",
              frequency: 1,
            }
          : undefined;

      const resp = await ApiService.calculateEmissions({
        state: stateCode,
        energy: energyPayload,
        transport: transportPayload,
      });

      const totalTonnes = resp.totalEmissions / 1000; // 后端单位为 kg，前端以吨展示
      const australianAverage = 16.2;
      const comparison = ((totalTonnes - australianAverage) / australianAverage) * 100;

      setResult({
        totalEmissions: Math.round(totalTonnes * 10) / 10,
        breakdown: {
          electricity: resp.breakdown?.energy?.total
            ? Math.round(resp.breakdown.energy.total) / 1000
            : 0,
          gas: resp.breakdown?.energy?.gas ? Math.round(resp.breakdown.energy.gas) / 1000 : 0,
          transport: resp.breakdown?.transport?.total
            ? Math.round(resp.breakdown.transport.total) / 1000
            : 0,
        },
        comparison: Math.round(comparison),
      });
    } catch {
      setError("计算过程中出现错误，请重试");
    } finally {
      setIsCalculating(false);
    }
  };

  const hasAnyInput =
    formData.electricity || formData.gas || (formData.transportMode && formData.distance);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-green-600">Loading calculator...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      {/* Page Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-200/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🧮</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-green-800 mb-2">
                  Carbon Footprint Calculator
                </h1>
                <p className="text-green-600 text-lg">
                  Calculate your household&apos;s environmental impact
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full border border-purple-200 text-sm font-medium">
                <span className="text-lg">🔍</span>
                <span>Calculator</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Independent assessment tool</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-green-200 shadow-lg">
            <form className="space-y-8">
              {/* Time Unit Selector */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-green-800 flex items-center space-x-2">
                  <span className="text-lg">⏰</span>
                  <span>Time Period</span>
                </h3>
                <TimeUnitSelector
                  selectedUnit={timeUnit}
                  onUnitChange={setTimeUnit}
                  dataTestId="energy-time-unit-select"
                  type="energy"
                />
              </div>

              {/* Home Energy Usage */}
              <div>
                <h3 className="text-xl font-semibold text-green-800 flex items-center space-x-2 mb-6">
                  <span className="text-lg">🏠</span>
                  <span>Home Energy Usage</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      {getFieldLabel("electricity")}
                    </label>
                    <input
                      type="number"
                      value={formData.electricity}
                      onChange={(e) => handleInputChange("electricity", e.target.value)}
                      placeholder={getPlaceholder("electricity")}
                      className="w-full p-4 bg-white text-green-800 rounded-lg border border-green-300 focus:border-green-500 focus:outline-none"
                      data-testid="electricity-input"
                    />
                    <p className="text-xs text-green-600 mt-1">Check your latest bill</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      {getFieldLabel("gas")}
                    </label>
                    <input
                      type="number"
                      value={formData.gas}
                      onChange={(e) => handleInputChange("gas", e.target.value)}
                      placeholder={getPlaceholder("gas")}
                      className="w-full p-4 bg-white text-green-800 rounded-lg border border-green-300 focus:border-amber-500 focus:outline-none"
                      data-testid="gas-input"
                    />
                    <p className="text-xs text-green-600 mt-1">Megajoules per period</p>
                  </div>
                </div>
              </div>

              {/* Transportation */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-green-800 flex items-center space-x-2">
                    <span className="text-lg">🚗</span>
                    <span>Transportation</span>
                  </h3>
                  {/* Transport Timeframe Selector */}
                  <TimeUnitSelector
                    selectedUnit={transportTimeframe}
                    onUnitChange={setTransportTimeframe}
                    dataTestId="transport-time-unit-select"
                    type="transport"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Transport Mode
                    </label>
                    <select
                      value={formData.transportMode}
                      onChange={(e) => handleInputChange("transportMode", e.target.value)}
                      className="w-full p-4 bg-white text-green-800 rounded-lg border border-green-300 focus:border-blue-500 focus:outline-none pr-8"
                      data-testid="transport-mode-select"
                    >
                      <option value="">Select transport method...</option>
                      {transportOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Distance (km) -{" "}
                      {transportTimeframes.find((t) => t.value === transportTimeframe)?.label}
                    </label>
                    <input
                      type="number"
                      value={formData.distance}
                      onChange={(e) => handleInputChange("distance", e.target.value)}
                      placeholder="e.g., 25"
                      className="w-full p-4 bg-white text-green-800 rounded-lg border border-green-300 focus:border-teal-500 focus:outline-none"
                      data-testid="distance-input"
                    />
                    <p className="text-xs text-green-600 mt-1">
                      {transportTimeframe === "day"
                        ? "Round trip distance"
                        : transportTimeframe === "month"
                          ? "Total monthly distance"
                          : "Total yearly distance"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Calculate Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={calculateEmissions}
                  disabled={!hasAnyInput || isCalculating}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-12 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-teal-600 transition-all duration-300 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  data-testid="calculate-btn"
                >
                  {isCalculating ? (
                    <span className="flex items-center space-x-2">
                      <span className="animate-spin">⏳</span>
                      <span>Calculating...</span>
                    </span>
                  ) : (
                    "Calculate My Carbon Footprint"
                  )}
                </button>
              </div>
            </form>

            {/* Results Display */}
            {result && (
              <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-2xl font-bold text-green-800 mb-4 text-center">
                  Your Carbon Footprint Results
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {result.totalEmissions} tonnes
                    </div>
                    <div className="text-green-700">CO₂ per year</div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        result.comparison < 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {result.comparison > 0 ? "+" : ""}
                      {result.comparison}%
                    </div>
                    <div className="text-green-700">vs Australian average</div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 mb-3">Emission Breakdown</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {result.breakdown.electricity}t
                      </div>
                      <div className="text-sm text-red-500">Electricity</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">
                        {result.breakdown.gas}t
                      </div>
                      <div className="text-sm text-amber-500">Gas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {result.breakdown.transport}t
                      </div>
                      <div className="text-sm text-purple-500">Transport</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-green-200/50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Previous Step Button */}
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap border border-gray-200"
                >
                  <span>←</span>
                  <span>Previous Step</span>
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-green-600 text-sm mb-2">Calculate your environmental impact</p>
            </div>

            {/* Next Step Button */}
            {onNext && (
              <button
                onClick={onNext}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 cursor-pointer whitespace-nowrap shadow-lg"
              >
                <span>Next Journey</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
