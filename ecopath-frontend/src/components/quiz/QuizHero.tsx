import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

export default function QuizHero({
  states = [],
  selectedState = "",
  onStateChange,
}: {
  states?: { id: string; displayName?: string }[];
  selectedState?: string;
  onStateChange?: (state: string) => void;
}) {
  type Factors = {
    electricity?: number;
    gas?: number;
    units?: { gas?: string };
  } | null;

  const [factors, setFactors] = useState<Factors>(null);
  const [loadingFactors, setLoadingFactors] = useState(false);

  useEffect(() => {
    if (!selectedState) return;
    setLoadingFactors(true);
    apiClient
      .getEmissionsFactors(selectedState)
      .then((data) => setFactors(data as Factors))
      .catch(() => setFactors(null))
      .finally(() => setLoadingFactors(false));
  }, [selectedState]);
  return (
    <section className="pt-0 pb-10 relative overflow-hidden min-h-[600px] sm:min-h-[640px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/quiz_bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-amber-500/20 to-transparent" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center pt-10 sm:pt-16 md:pt-20">
          {/* Explore pill */}
          <div className="inline-flex items-center gap-3 bg-orange-600/40 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-orange-400/30">
            <span className="text-2xl">🌱</span>
            <span className="text-orange-100 font-medium">Explore Your Environmental Impact</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Discover Your Carbon Footprint
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-4xl mx-auto leading-relaxed">
            Calculate your environmental impact and get personalized recommendations for a more
            sustainable lifestyle
          </p>
        </div>

        {/* Integrated location selector card to mirror refer */}
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📍</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Select Your Location</h3>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  State/Territory
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedState || "VIC"}
                    onChange={(e) => {
                      const val = e.target.value || "VIC";
                      onStateChange?.(val);
                    }}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700 pr-8"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName || s.id}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">
                    ▾
                  </div>
                </div>
              </div>

              {selectedState && (
                <div className="bg-white/80 rounded-lg p-3 border border-emerald-200 text-left">
                  {loadingFactors ? (
                    <div className="text-sm text-slate-600">Loading factors…</div>
                  ) : factors ? (
                    <div className="text-sm text-emerald-700">
                      <div className="font-semibold mb-1">Emissions factors</div>
                      <div>Electricity: {factors?.electricity ?? "-"} kg CO₂-e/kWh</div>
                      <div>
                        Gas:{" "}
                        {factors?.units?.gas === "kg CO2-e per GJ"
                          ? `${factors?.gas ?? "-"} kg/GJ`
                          : `${factors?.gas ?? "-"} kg/kWh-eq`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">No factors available.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
