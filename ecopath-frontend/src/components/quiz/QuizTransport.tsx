import { useState, useEffect, useCallback, useMemo } from "react";

type Props = {
  open?: boolean;
  onToggle?: () => void;
  timeUnit?: "week" | "month" | "quarter" | "year";
  onChange?: (v: {
    transportEmissionsKgYear?: number;
    transportBreakdownKgYear?: Record<
      string,
      { name: string; icon: string; emissions: number; distance: number; fuelType?: string }
    >;
  }) => void;
  factors?: { electricity?: number; gas?: number; units?: { gas?: string } } | null;
};

interface TransportMode {
  enabled: boolean;
  distance: number;
  fuelType?: "petrol" | "diesel" | "electric" | "hybrid";
  vehicleType?: "small" | "medium" | "large" | "suv";
  frequency?: number;
}

interface TransportData {
  car: TransportMode;
  bus: TransportMode;
  train: TransportMode;
  tram: TransportMode;
  walking: TransportMode;
  cycling: TransportMode;
}

export default function QuizTransport({
  open = true,
  onToggle,
  timeUnit = "week",
  onChange,
}: Props) {
  const [localOpen, setLocalOpen] = useState(open);
  const isOpen = onToggle ? open : localOpen;

  const handleToggle = () => (onToggle ? onToggle() : setLocalOpen((v) => !v));

  // Transport modes state
  const [transportData, setTransportData] = useState<TransportData>({
    car: { enabled: false, distance: 0, fuelType: "petrol", vehicleType: "medium" },
    bus: { enabled: false, distance: 0, frequency: 1 },
    train: { enabled: false, distance: 0, frequency: 1 },
    tram: { enabled: false, distance: 0, frequency: 1 },
    walking: { enabled: false, distance: 0 },
    cycling: { enabled: false, distance: 0 },
  });

  // Local fallback timeUnit when parent is not controlling it
  const [localTimeUnit] = useState<"week" | "month" | "quarter" | "year">("week");

  // Transport emission factors (kg CO2-e per km)
  const transportFactors = useMemo(
    () => ({
      car: {
        petrol: 0.21,
        diesel: 0.24,
        electric: 0.05,
        hybrid: 0.15,
      },
      bus: 0.08,
      train: 0.04,
      tram: 0.06,
      walking: 0,
      cycling: 0.01,
    }),
    [],
  );

  // Calculate transport emissions with breakdown
  const calculateTransportEmissions = useCallback(() => {
    let totalEmissions = 0;
    const breakdown: Record<
      string,
      { name: string; icon: string; emissions: number; distance: number; fuelType?: string }
    > = {};

    const modeIcons = {
      car: "🚗",
      bus: "🚌",
      train: "🚆",
      tram: "🚋",
      walking: "🚶",
      cycling: "🚴",
    };

    const modeNames = {
      car: "Car",
      bus: "Bus",
      train: "Train",
      tram: "Tram",
      walking: "Walking",
      cycling: "Cycling",
    };

    Object.entries(transportData).forEach(([mode, data]) => {
      if (data.enabled && data.distance > 0) {
        let modeEmissions = 0;
        const weeklyDistance = data.distance;
        const frequency = data.frequency || 1;
        const annualDistance = weeklyDistance * frequency * 52;

        if (mode === "car" && data.fuelType) {
          modeEmissions =
            annualDistance *
            transportFactors.car[data.fuelType as keyof typeof transportFactors.car];
        } else if (mode === "bus") {
          modeEmissions = annualDistance * transportFactors.bus;
        } else if (mode === "train") {
          modeEmissions = annualDistance * transportFactors.train;
        } else if (mode === "tram") {
          modeEmissions = annualDistance * transportFactors.tram;
        } else if (mode === "walking") {
          modeEmissions = annualDistance * transportFactors.walking;
        } else if (mode === "cycling") {
          modeEmissions = annualDistance * transportFactors.cycling;
        }

        totalEmissions += modeEmissions;

        // Add to breakdown
        breakdown[mode] = {
          name: modeNames[mode as keyof typeof modeNames],
          icon: modeIcons[mode as keyof typeof modeIcons],
          emissions: modeEmissions,
          distance: annualDistance,
          fuelType: data.fuelType,
        };
      }
    });

    return { totalEmissions, breakdown };
  }, [transportData, transportFactors]);

  // Update parent component when emissions change
  useEffect(() => {
    const { totalEmissions, breakdown } = calculateTransportEmissions();
    onChange?.({
      transportEmissionsKgYear: totalEmissions,
      transportBreakdownKgYear: breakdown,
    });
  }, [calculateTransportEmissions, onChange]);

  const handleModeChange = (
    mode: keyof TransportData,
    field: keyof TransportMode,
    value: string | number | boolean,
  ) => {
    setTransportData((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [field]: value,
      },
    }));
  };

  const getActiveModesCount = () => {
    return Object.values(transportData).filter((mode) => mode.enabled).length;
  };

  const getTotalWeeklyDistance = () => {
    return Object.values(transportData)
      .filter((mode) => mode.enabled)
      .reduce((total, mode) => total + mode.distance * (mode.frequency || 1), 0);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-lg overflow-hidden transition-all duration-300">
      <button
        onClick={handleToggle}
        className="w-full p-4 sm:p-6 text-left hover:bg-green-50/50 transition-colors duration-300 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-lg sm:text-xl">🚗</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                Weekly Transport Habits
              </h3>
              <p className="text-sm sm:text-base text-slate-600">Select modes and distances</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {getActiveModesCount() > 0 && (
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500">Active modes</div>
                <div className="text-sm font-semibold text-green-600">
                  {getActiveModesCount()} types
                </div>
              </div>
            )}
            <i className={`ri-arrow-${isOpen ? "up" : "down"}-s-line text-slate-400 text-xl`}></i>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 animate-fade-in">
          <div className="bg-green-50/80 rounded-xl p-4 sm:p-6 border border-green-200/30">
            <p className="text-sm sm:text-base text-slate-600 mb-6">
              Select and configure all transport modes you use weekly (multiple selection allowed)
            </p>

            <div className="space-y-6">
              {/* Car Transport */}
              <div className="bg-white/80 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <h4 className="font-semibold text-slate-800">Car</h4>
                      <p className="text-sm text-slate-600">km/week</p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transportData.car.enabled}
                      onChange={(e) => handleModeChange("car", "enabled", e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        transportData.car.enabled ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                          transportData.car.enabled ? "translate-x-6" : "translate-x-0.5"
                        } translate-y-0.5`}
                      ></div>
                    </div>
                  </label>
                </div>

                {transportData.car.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-green-200">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Weekly driving distance
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={transportData.car.distance}
                          onChange={(e) =>
                            handleModeChange("car", "distance", parseFloat(e.target.value) || 0)
                          }
                          className="w-full p-3 border border-green-200 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                          km/week
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Fuel Type
                        </label>
                        <select
                          value={transportData.car.fuelType}
                          onChange={(e) => handleModeChange("car", "fuelType", e.target.value)}
                          className="w-full p-2 border border-green-200 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="petrol">Petrol</option>
                          <option value="diesel">Diesel</option>
                          <option value="electric">Electric</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Vehicle Size
                        </label>
                        <select
                          value={transportData.car.vehicleType}
                          onChange={(e) => handleModeChange("car", "vehicleType", e.target.value)}
                          className="w-full p-2 border border-green-200 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                          <option value="suv">SUV</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Public Transport */}
              {[
                { key: "bus", icon: "🚌", name: "Bus" },
                { key: "train", icon: "🚆", name: "Train" },
                { key: "tram", icon: "🚋", name: "Tram" },
              ].map((transport) => (
                <div
                  key={transport.key}
                  className="bg-white/80 rounded-xl p-4 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{transport.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-800">{transport.name}</h4>
                        <p className="text-sm text-slate-600">km/week</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transportData[transport.key as keyof TransportData].enabled}
                        onChange={(e) =>
                          handleModeChange(
                            transport.key as keyof TransportData,
                            "enabled",
                            e.target.checked,
                          )
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          transportData[transport.key as keyof TransportData].enabled
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                            transportData[transport.key as keyof TransportData].enabled
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          } translate-y-0.5`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  {transportData[transport.key as keyof TransportData].enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-green-200">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Weekly {transport.name.toLowerCase()} distance
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={transportData[transport.key as keyof TransportData].distance}
                            onChange={(e) =>
                              handleModeChange(
                                transport.key as keyof TransportData,
                                "distance",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full p-3 border border-green-200 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                            km/week
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Active Transport */}
              {[
                { key: "walking", icon: "🚶", name: "Walking" },
                { key: "cycling", icon: "🚴", name: "Cycling" },
              ].map((transport) => (
                <div
                  key={transport.key}
                  className="bg-white/80 rounded-xl p-4 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{transport.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-800">{transport.name}</h4>
                        <p className="text-sm text-slate-600">km/week</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transportData[transport.key as keyof TransportData].enabled}
                        onChange={(e) =>
                          handleModeChange(
                            transport.key as keyof TransportData,
                            "enabled",
                            e.target.checked,
                          )
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          transportData[transport.key as keyof TransportData].enabled
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                            transportData[transport.key as keyof TransportData].enabled
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          } translate-y-0.5`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  {transportData[transport.key as keyof TransportData].enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-green-200">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Weekly {transport.name.toLowerCase()} distance
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={transportData[transport.key as keyof TransportData].distance}
                            onChange={(e) =>
                              handleModeChange(
                                transport.key as keyof TransportData,
                                "distance",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full p-3 border border-green-200 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                            km/week
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            {getActiveModesCount() > 0 && (
              <div className="mt-6 bg-green-100/60 rounded-lg p-4 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">
                      Weekly Transport Summary
                    </div>
                    <div className="text-xs text-green-600">
                      {getActiveModesCount()} active modes • {getTotalWeeklyDistance().toFixed(1)}{" "}
                      km total
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-700">
                      {calculateTransportEmissions().totalEmissions.toFixed(1)} kg CO₂/year
                    </div>
                    <div className="text-xs text-green-600">Annual emissions</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
