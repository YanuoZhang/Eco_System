"use client";

import { useRouter } from "next/navigation";

type TimeUnit = "week" | "month" | "quarter" | "year";

export default function QuizResultsModal({
  open,
  onClose,
  timeUnit = "year",
  totals,
  appliances,
  transport,
}: {
  open: boolean;
  onClose: () => void;
  timeUnit?: TimeUnit;
  totals?: {
    electricityKgYear?: number;
    hotWaterKgYear?: number;
    appliancesKgYear?: number;
    transportKgYear?: number;
  };
  appliances?: Record<
    string,
    { name: string; icon: string; emissions: number; usageHoursPerWeek: number }
  >;
  transport?: Record<
    string,
    { name: string; icon: string; emissions: number; distance: number; fuelType?: string }
  >;
}) {
  const router = useRouter();
  if (!open) return null;
  const year =
    (totals?.electricityKgYear ?? 0) +
    (totals?.hotWaterKgYear ?? 0) +
    (totals?.appliancesKgYear ?? 0) +
    (totals?.transportKgYear ?? 0);
  const scale =
    timeUnit === "month" ? 12 : timeUnit === "quarter" ? 4 : timeUnit === "week" ? 52.143 : 1;
  const shown = year / scale;
  const unitLabel = timeUnit;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 -mt-2 -mx-2 px-2 pt-2 pb-4 flex justify-between items-center border-b border-slate-100 mb-4">
          <h3 className="text-2xl font-bold text-slate-800">Your Carbon Footprint Analysis</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-200 hover:bg-slate-300 rounded-full"
          >
            ×
          </button>
        </div>
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500 shadow">
            <div className="text-sm text-slate-500">Electricity</div>
            <div className="text-2xl font-bold text-orange-600">
              {((totals?.electricityKgYear ?? 0) / scale).toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">kg CO₂/{unitLabel}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border-l-4 border-red-500 shadow">
            <div className="text-sm text-slate-500">Hot water</div>
            <div className="text-2xl font-bold text-red-600">
              {((totals?.hotWaterKgYear ?? 0) / scale).toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">kg CO₂/{unitLabel}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border-l-4 border-purple-500 shadow">
            <div className="text-sm text-slate-500">Appliances</div>
            <div className="text-2xl font-bold text-purple-600">
              {((totals?.appliancesKgYear ?? 0) / scale).toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">kg CO₂/{unitLabel}</div>
          </div>
          <div className="bg-white rounded-xl p-5 border-l-4 border-green-500 shadow">
            <div className="text-sm text-slate-500">Transport</div>
            <div className="text-2xl font-bold text-green-600">
              {((totals?.transportKgYear ?? 0) / scale).toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">kg CO₂/{unitLabel}</div>
          </div>
        </div>
        {/* Total */}
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-800 mb-2">
            {shown.toFixed(1)} kg CO₂/{unitLabel}
          </div>
          <div className="text-sm text-slate-500">({year.toFixed(1)} kg CO₂/year)</div>
        </div>

        {/* Equivalents */}
        <div className="mt-6 bg-white/80 rounded-2xl p-6 border border-orange-200">
          <div className="text-lg text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="font-medium">Environmental impact equivalent</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="font-semibold text-green-800 mb-1">Trees needed</div>
              <div className="text-2xl font-bold text-green-600">{Math.round(year / 22)} trees</div>
              <div className="text-green-700">to offset annual emissions</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-semibold text-blue-800 mb-1">Driving equivalent</div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(year / 0.21)} km</div>
              <div className="text-blue-700">in a petrol car</div>
            </div>
          </div>
        </div>

        {/* AI Recommendation and Top Appliances (refer-style) */}
        {appliances && Object.keys(appliances).length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🏠</span>
              <h4 className="text-xl font-bold text-slate-800">Top Appliance Contributors</h4>
            </div>
            <div className="space-y-3">
              {Object.entries(appliances)
                .sort(([, a], [, b]) => b.emissions - a.emissions)
                .slice(0, 5)
                .map(([id, a]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between bg-purple-50/60 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{a.icon}</span>
                      <span className="font-medium text-slate-700">{a.name}</span>
                      <span className="text-xs text-slate-500">
                        {a.usageHoursPerWeek === 168 ? "Always on" : `${a.usageHoursPerWeek}h/week`}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">
                        {(a.emissions / scale).toFixed(1)} kg/{unitLabel}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Transport Breakdown */}
        {transport && Object.keys(transport).length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚗</span>
              <h4 className="text-xl font-bold text-slate-800">Transport Breakdown</h4>
            </div>
            <div className="space-y-3">
              {Object.entries(transport)
                .sort(([, a], [, b]) => b.emissions - a.emissions)
                .map(([id, t]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between bg-green-50/60 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <span className="font-medium text-slate-700">{t.name}</span>
                        {t.fuelType && (
                          <span className="text-xs text-slate-500 ml-2">({t.fuelType})</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {t.distance.toFixed(0)} km/year
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {(t.emissions / scale).toFixed(1)} kg/{unitLabel}
                      </div>
                      <div className="text-xs text-slate-500">
                        {((t.emissions / year) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              router.push("/pledge");
            }}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            Take Action →
          </button>
        </div>
      </div>
    </div>
  );
}
