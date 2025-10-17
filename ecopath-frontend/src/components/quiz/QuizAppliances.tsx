"use client";

import { useEffect, useId, useMemo, useState, useRef } from "react";
import { formatEmissions } from "../../utils/timeUnits";

type TimeUnit = "week" | "month" | "quarter" | "year";

type Props = {
  open?: boolean;
  onToggle?: () => void;
  timeUnit?: TimeUnit;
  weeklyUsage?: Array<{ appliance: string; hoursPerWeek?: number; energyEfficient?: boolean }>;
  factors?: { electricity?: number } | null;
  onChange?: (v: {
    appliancesEmissionsKgYear?: number;
    timeUnit?: TimeUnit;
    applianceBreakdownKgYear?: Record<
      string,
      { name: string; icon: string; emissions: number; usageHoursPerWeek: number }
    >;
    weeklyUsage?: Array<{ appliance: string; hoursPerWeek?: number; energyEfficient?: boolean }>;
  }) => void;
};

type Appliance = {
  id: string;
  name: string;
  icon: string;
  calcType: "power"; // keep simple for v1: power(kW) * hours
  kw: number; // average power in kW
  defaultHoursPerWeek: number; // hours/week or 168 for always on
  description?: string;
  alwaysOn?: boolean;
};

const APPLIANCES: Appliance[] = [
  {
    id: "fridge",
    name: "Refrigerator",
    icon: "🧊",
    calcType: "power",
    kw: 0.15,
    defaultHoursPerWeek: 168,
    description: "Always running",
    alwaysOn: true,
  },
  {
    id: "washer",
    name: "Washing Machine",
    icon: "🧺",
    calcType: "power",
    kw: 0.5,
    defaultHoursPerWeek: 3,
    description: "3h/week",
  },
  {
    id: "dryer",
    name: "Clothes Dryer",
    icon: "👕",
    calcType: "power",
    kw: 2.5,
    defaultHoursPerWeek: 3,
    description: "3h/week",
  },
  {
    id: "ac",
    name: "Air Conditioning",
    icon: "❄️",
    calcType: "power",
    kw: 1.5,
    defaultHoursPerWeek: 20,
    description: "20h/week",
  },
  {
    id: "heater",
    name: "Electric Heater",
    icon: "🔥",
    calcType: "power",
    kw: 1.5,
    defaultHoursPerWeek: 15,
    description: "15h/week",
  },
  {
    id: "dishwasher",
    name: "Dishwasher",
    icon: "🍽️",
    calcType: "power",
    kw: 1.8,
    defaultHoursPerWeek: 4,
    description: "4h/week",
  },
  {
    id: "tv",
    name: "Television",
    icon: "📺",
    calcType: "power",
    kw: 0.1,
    defaultHoursPerWeek: 25,
    description: "25h/week",
  },
  {
    id: "computer",
    name: "Computer",
    icon: "💻",
    calcType: "power",
    kw: 0.2,
    defaultHoursPerWeek: 30,
    description: "30h/week",
  },
  {
    id: "microwave",
    name: "Microwave",
    icon: "🔄",
    calcType: "power",
    kw: 1.0,
    defaultHoursPerWeek: 2,
    description: "2h/week",
  },
  {
    id: "oven",
    name: "Electric Oven",
    icon: "🔥",
    calcType: "power",
    kw: 2.4,
    defaultHoursPerWeek: 3,
    description: "3h/week",
  },
];

export default function QuizAppliances({
  open = true,
  onToggle,
  timeUnit = "month",
  weeklyUsage: initialWeeklyUsage,
  factors,
  onChange,
}: Props) {
  const id = useId();
  const [localOpen, setLocalOpen] = useState(open);
  const isOpen = onToggle ? open : localOpen;
  const initializedRef = useRef(false);

  const handleToggle = () => (onToggle ? onToggle() : setLocalOpen((v) => !v));

  // Simplified state initialization
  const [selected, setSelected] = useState<string[]>(["fridge"]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Initialize from props only once
  useEffect(() => {
    if (initialWeeklyUsage && initialWeeklyUsage.length > 0 && !initializedRef.current) {
      const ids = initialWeeklyUsage
        .map((item) => {
          const ap = APPLIANCES.find((a) => a.name === item.appliance);
          return ap?.id;
        })
        .filter(Boolean) as string[];

      if (ids.length > 0) {
        setSelected(ids);
      }

      const usageMap: Record<string, number> = {};
      initialWeeklyUsage.forEach((item) => {
        const ap = APPLIANCES.find((a) => a.name === item.appliance);
        if (ap && item.hoursPerWeek !== undefined) {
          usageMap[ap.id] = item.hoursPerWeek;
        }
      });

      setUsage(usageMap);
      initializedRef.current = true;
    }
  }, [initialWeeklyUsage]);

  const weeksInPeriod: Record<TimeUnit, number> = {
    week: 1,
    month: 4.345,
    quarter: 13,
    year: 52.143,
  };

  const electricityFactor = factors?.electricity ?? 0.8; // kg/kWh - default fallback

  const { emissionsKgYear, breakdown } = useMemo(() => {
    const map: Record<
      string,
      { name: string; icon: string; emissions: number; usageHoursPerWeek: number }
    > = {};
    selected.forEach((id) => {
      const ap = APPLIANCES.find((a) => a.id === id);
      if (!ap) return;
      // Fix: Use defaultHoursPerWeek when usage[id] is undefined or 0
      const hoursPerWeek = usage[id] && usage[id] > 0 ? usage[id] : ap.defaultHoursPerWeek;
      const kwhYear = ap.kw * hoursPerWeek * weeksInPeriod.year;
      const kgYear = kwhYear * electricityFactor;
      map[id] = {
        name: ap.name,
        icon: ap.icon,
        emissions: Math.max(0, kgYear),
        usageHoursPerWeek: hoursPerWeek,
      };
    });

    // Fix: Calculate total emissions from individual appliance emissions
    const totalEmissions = Object.values(map).reduce((total, item) => total + item.emissions, 0);

    return { emissionsKgYear: totalEmissions, breakdown: map };
  }, [selected, usage, electricityFactor, weeksInPeriod.year]);

  useEffect(() => {
    const weeklyUsageData = selected.map((apId) => {
      const appliance = APPLIANCES.find((ap) => ap.id === apId);
      return {
        appliance: appliance?.name || apId,
        hoursPerWeek: usage[apId] || 0,
        energyEfficient: false, // Default value, could be enhanced later
      };
    });

    onChange?.({
      appliancesEmissionsKgYear: emissionsKgYear,
      timeUnit,
      applianceBreakdownKgYear: breakdown,
      weeklyUsage: weeklyUsageData,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emissionsKgYear]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (APPLIANCES.find((a) => a.id === id)?.alwaysOn) return prev; // keep fridge selected
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const setHours = (id: string, hours: number) => {
    setUsage((prev) => ({ ...prev, [id]: isFinite(hours) && hours >= 0 ? hours : 0 }));
  };

  const selectedCount = selected.length;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow overflow-hidden">
      <button
        className="w-full p-5 text-left hover:bg-purple-50/50 transition-colors cursor-pointer"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-appliances-body`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🧺</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Common Appliances</h3>
              <p className="text-sm text-slate-600">Devices used per {timeUnit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500">Selected</div>
                <div className="text-sm font-semibold text-purple-600">{selectedCount} items</div>
              </div>
            )}
            <i className={`ri-arrow-${isOpen ? "up" : "down"}-s-line text-slate-400 text-xl`} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div id={`${id}-appliances-body`} className="px-5 pb-5">
          <div className="bg-purple-50/80 rounded-xl p-4 border border-purple-200/30">
            <div className="bg-purple-100/60 rounded-lg p-4 mb-6 border border-purple-200/50">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="text-purple-800 font-semibold mb-2">
                    How we calculate appliance emissions
                  </h4>
                  <p className="text-sm text-purple-700 mb-1">
                    Emissions are based on average power × usage and your region&apos;s electricity
                    factor.
                  </p>
                  <p className="text-xs text-purple-600">
                    Select appliances you use regularly; customize usage in Advanced settings.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">Select all appliances you use regularly</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
              {APPLIANCES.map((ap) => (
                <button
                  key={ap.id}
                  type="button"
                  onClick={() => toggle(ap.id)}
                  className={`p-3 rounded-xl font-medium transition-all cursor-pointer border-2 text-sm relative ${
                    selected.includes(ap.id)
                      ? "border-purple-500 bg-purple-500 text-white shadow-lg scale-105"
                      : "border-purple-200 bg-white text-slate-700 hover:bg-purple-100 hover:border-purple-300"
                  } ${ap.alwaysOn ? "after:content-['']" : ""}`}
                  title={ap.description}
                  aria-pressed={selected.includes(ap.id)}
                >
                  <div className="text-xl mb-1">{ap.icon}</div>
                  <div className="mb-1">{ap.name}</div>
                  <div className="text-xs opacity-75">
                    {ap.defaultHoursPerWeek === 168
                      ? "Always on"
                      : `${ap.defaultHoursPerWeek}h/week`}
                  </div>
                </button>
              ))}
            </div>

            {selected.length > 0 && (
              <div className="border-t border-purple-200/50 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors cursor-pointer mb-4"
                >
                  <i className={`ri-arrow-${showAdvanced ? "up" : "down"}-s-line`} />
                  <span>Advanced usage settings (customize weekly hours)</span>
                </button>

                {showAdvanced && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-white/80 rounded-lg p-4">
                      <h4 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">⚙️</span>
                        <span>Customize Weekly Usage</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selected.map((id) => {
                          const ap = APPLIANCES.find((a) => a.id === id)!;
                          const value = usage[id] ?? ap.defaultHoursPerWeek;
                          return (
                            <div
                              key={id}
                              className="bg-purple-50/80 rounded-lg p-3 border border-purple-200/50"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{ap.icon}</span>
                                <span className="text-sm font-medium text-slate-700">
                                  {ap.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={ap.id === "fridge" ? 168 : 100}
                                  step={0.5}
                                  value={value || ""}
                                  onChange={(e) => setHours(id, Number(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-sm border border-purple-200 rounded focus:outline-none focus:border-purple-500 disabled:bg-slate-100"
                                  disabled={ap.alwaysOn}
                                />
                                <span className="text-xs text-slate-600">h/week</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Default:{" "}
                                {ap.defaultHoursPerWeek === 168
                                  ? "Always on"
                                  : `${ap.defaultHoursPerWeek}h/week`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Calculation details */}
          <details className="mt-4 bg-white/70 rounded-lg p-3 border border-purple-200">
            <summary className="text-sm font-medium text-purple-700 cursor-pointer">
              Calculation details
            </summary>
            <div className="mt-2 text-xs text-slate-700 space-y-1">
              {factors && <div>Electricity factor: {factors.electricity ?? "-"} kg CO₂-e/kWh</div>}
              <div>
                Calculation: Power (kW) × Hours/week × 52.143 weeks/year × Electricity factor
              </div>
              <div>Selected appliances: {selected.length} items</div>
              {selected.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selected.map((id) => {
                    const ap = APPLIANCES.find((a) => a.id === id);
                    const hoursPerWeek =
                      usage[id] && usage[id] > 0 ? usage[id] : ap?.defaultHoursPerWeek || 0;
                    const kwhYear = (ap?.kw || 0) * hoursPerWeek * 52.143;
                    const kgYear = kwhYear * (factors?.electricity || 0.8);
                    return ap ? (
                      <div key={id} className="text-xs">
                        {ap.name}: {ap.kw}kW × {hoursPerWeek}h/week × 52.143 ×{" "}
                        {factors?.electricity || 0.8} = {kgYear.toFixed(1)} kg CO₂/year
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </details>

          {/* Section total summary */}
          <div className="mt-4 bg-white/80 rounded-lg p-4 border border-purple-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-800">Section total</div>
                <div className="text-xs text-purple-600">Appliances emissions</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">
                  {(() => {
                    const formatted = formatEmissions(emissionsKgYear, timeUnit);

                    return formatted;
                  })()}
                </div>
                <div className="text-xs text-purple-500">
                  {emissionsKgYear.toFixed(1)} kg CO₂/year
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
