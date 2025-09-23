import { useState, useEffect, useId, useMemo, useCallback } from "react";

type Props = {
  open?: boolean;
  onToggle?: () => void;
  timeUnit?: "week" | "month" | "quarter" | "year";
  onChange?: (v: {
    hotWaterEmissionsKgYear?: number;
    timeUnit?: "month" | "quarter" | "year";
    system?: "electric" | "gas" | "solar";
    usage?: number;
    household?: number;
  }) => void;
  factors?: { electricity?: number; gas?: number; units?: { gas?: string } } | null;
};

export default function QuizHotWater({
  open = true,
  onToggle,
  timeUnit = "month",
  onChange,
  factors,
}: Props) {
  const id = useId();
  const [localOpen, setLocalOpen] = useState(open);
  const isOpen = onToggle ? open : localOpen;

  const handleToggle = () => (onToggle ? onToggle() : setLocalOpen((v) => !v));

  // Hot water system state
  const [hotWaterSystem, setHotWaterSystem] = useState<"electric" | "gas" | "solar" | null>(null);
  const [energySaving, setEnergySaving] = useState<boolean>(false);
  const [usageKnown, setUsageKnown] = useState<boolean>(false);
  const [knownUsage, setKnownUsage] = useState<string>(""); // energy usage per period (string allows empty)
  // Removed legacy cost-based path to avoid unused state and keep logic simple
  const [household, setHousehold] = useState<number>(1);

  // Local fallback timeUnit when parent is not controlling it
  const [localTimeUnit] = useState<"week" | "month" | "quarter" | "year">("month");
  const currentTimeUnit = timeUnit ?? localTimeUnit;

  // Reset known usage if system is not selected
  useEffect(() => {
    if (!hotWaterSystem && (usageKnown || knownUsage !== "")) {
      setUsageKnown(false);
      setKnownUsage("");
    }
    // include values that are checked inside the effect
  }, [hotWaterSystem, usageKnown, knownUsage]);

  // Helper: compute gas emissions from energy in MJ using factor units
  const computeGasEmissionsKg = useCallback(
    (energyMJ: number, multiplier: number) => {
      const gasFactor = factors?.gas ?? 0.18; // default aligns with backend fallback (kg/kWh-eq)
      const gasUnit = factors?.units?.gas ?? "kg CO2-e per kWh equivalent";
      const kg = gasUnit.includes("per GJ")
        ? (energyMJ / 1000) * gasFactor // MJ -> GJ
        : (energyMJ / 3.6) * gasFactor; // MJ -> kWh-eq
      return kg * multiplier;
    },
    [factors],
  );

  // Derived UI label/unit for known usage input
  const usageUnit = hotWaterSystem === "gas" ? "MJ" : "kWh";

  // Parse known usage as number
  const knownUsageValue = useMemo(() => {
    const n = parseFloat(knownUsage);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [knownUsage]);

  // Calculate hot water emissions based on system type and household size
  const hotWaterEmissionsKgYear = useMemo(() => {
    if (!hotWaterSystem) return 0;

    // Apply energy-saving multiplier
    const energySavingMultiplier = energySaving ? 0.7 : 1.0;

    let emissionsKgPeriod = 0;

    if (usageKnown && knownUsageValue > 0) {
      // User provides direct energy usage per period
      if (hotWaterSystem === "electric" || hotWaterSystem === "solar") {
        const electricityFactor = factors?.electricity ?? 0.8; // kg/kWh
        emissionsKgPeriod = knownUsageValue * electricityFactor * energySavingMultiplier;
      } else if (hotWaterSystem === "gas") {
        // knownUsage is MJ for gas
        emissionsKgPeriod = computeGasEmissionsKg(knownUsageValue, energySavingMultiplier);
      }
    } else {
      // If user doesn't know usage, estimate based on household size
      let dailyEnergyPerPerson = 0;
      switch (hotWaterSystem) {
        case "electric":
          dailyEnergyPerPerson = 2.5; // kWh per person per day
          break;
        case "gas":
          dailyEnergyPerPerson = 10.0; // MJ per person per day
          break;
        case "solar":
          dailyEnergyPerPerson = 1.0; // kWh per person per day
          break;
      }

      let periodDays = 0;
      switch (currentTimeUnit) {
        case "week":
          periodDays = 7;
          break;
        case "month":
          periodDays = 30;
          break;
        case "quarter":
          periodDays = 91;
          break;
        case "year":
          periodDays = 365;
          break;
      }

      const periodEnergyPerPerson = dailyEnergyPerPerson * periodDays;
      const totalPeriodEnergy = periodEnergyPerPerson * household;

      if (hotWaterSystem === "electric" || hotWaterSystem === "solar") {
        const electricityFactor = factors?.electricity ?? 0.8;
        emissionsKgPeriod = totalPeriodEnergy * electricityFactor * energySavingMultiplier;
      } else if (hotWaterSystem === "gas") {
        emissionsKgPeriod = computeGasEmissionsKg(totalPeriodEnergy, energySavingMultiplier);
      }
    }

    const scaleToYear =
      currentTimeUnit === "month"
        ? 12
        : currentTimeUnit === "quarter"
          ? 4
          : currentTimeUnit === "week"
            ? 52.143
            : 1;
    const emissionsKgYear = emissionsKgPeriod * scaleToYear;

    return Math.round(emissionsKgYear * 100) / 100;
  }, [
    hotWaterSystem,
    household,
    energySaving,
    currentTimeUnit,
    factors,
    usageKnown,
    knownUsageValue,
    computeGasEmissionsKg,
  ]);

  useEffect(() => {
    onChange?.({
      hotWaterEmissionsKgYear,
      system: hotWaterSystem || undefined,
      usage: usageKnown ? Number(knownUsage) || undefined : undefined,
      household: household || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotWaterEmissionsKgYear, hotWaterSystem, knownUsage, usageKnown, household]);

  const unitLabel =
    currentTimeUnit === "week"
      ? "Weekly"
      : currentTimeUnit === "month"
        ? "Monthly"
        : currentTimeUnit === "quarter"
          ? "Quarterly"
          : "Yearly";

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-orange-200/50 shadow overflow-hidden">
      <button
        className="w-full p-5 text-left hover:bg-orange-50/50 transition-colors cursor-pointer"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-hotwater-body`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🌡️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Hot Water System</h3>
              <p className="text-sm text-slate-600">Type and energy consumption</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">System</div>
              <div className="text-sm font-semibold text-red-600 capitalize">
                {hotWaterSystem || "Not selected"}
              </div>
            </div>
            <i className={`ri-arrow-${isOpen ? "up" : "down"}-s-line text-slate-400 text-xl`} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div id={`${id}-hotwater-body`} className="px-5 pb-5">
          <div className="bg-red-50/80 rounded-xl p-4 border border-red-200/30 space-y-6">
            {/* Hot water system type selection */}
            <div>
              <h4 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">🌡️</span>
                <span>Select your hot water system type</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "electric", label: "Electric", icon: "⚡" },
                  { value: "gas", label: "Gas", icon: "🔥" },
                  { value: "solar", label: "Solar", icon: "☀️" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setHotWaterSystem(option.value as "electric" | "gas" | "solar")}
                    className={`p-4 rounded-xl font-medium transition-all duration-300 border-2 ${
                      hotWaterSystem === option.value
                        ? "border-red-500 bg-red-500 text-white shadow-lg scale-105"
                        : "border-red-200 bg-white text-slate-700 hover:bg-red-100 hover:border-red-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Household size slider (hidden when usage is known) */}
            {!(usageKnown || knownUsageValue > 0) && (
              <div>
                <div className="text-slate-800 font-semibold mb-2">
                  Household size: {household} {household === 1 ? "person" : "people"}
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={household}
                  onChange={(e) => setHousehold(Number(e.target.value))}
                  className="w-full h-3 bg-red-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>1 person</span>
                  <span>8+ people</span>
                </div>
              </div>
            )}

            {/* Energy-saving option */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                id={`${id}-energy-saving`}
                type="checkbox"
                checked={energySaving}
                onChange={(e) => setEnergySaving(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 rounded"
              />
              <span className="text-sm sm:text-base text-slate-700 font-medium">
                Energy-saving hot water system
              </span>
            </label>

            {/* Known usage input */}
            <div className="bg-white/60 rounded-lg p-4">
              <label
                className={`flex items-center gap-3 cursor-pointer mb-3 ${!hotWaterSystem ? "opacity-60" : ""}`}
              >
                <input
                  id={`${id}-hotwater-known`}
                  type="checkbox"
                  checked={usageKnown}
                  disabled={!hotWaterSystem}
                  onChange={(e) => {
                    if (!hotWaterSystem) return;
                    setUsageKnown(e.target.checked);
                    if (!e.target.checked) setKnownUsage("");
                  }}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 rounded disabled:cursor-not-allowed"
                />
                <span className="text-sm sm:text-base text-slate-700 font-medium">
                  I know my exact {unitLabel.toLowerCase()} hot water usage
                </span>
                {!hotWaterSystem && (
                  <span className="text-xs text-slate-500">(Please select system type first)</span>
                )}
              </label>

              {usageKnown && (
                <div className="relative animate-fade-in">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={knownUsage}
                    onChange={(e) => setKnownUsage(e.target.value.replace(/,/g, "."))}
                    disabled={!hotWaterSystem}
                    className="w-full p-3 sm:p-4 border border-red-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
                    placeholder={hotWaterSystem === "gas" ? "e.g. 120" : "e.g. 60"}
                  />
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm sm:text-base">
                    {usageUnit}/{currentTimeUnit}
                  </div>
                  {(hotWaterSystem === "electric" || hotWaterSystem === "solar") && (
                    <div className="mt-2 text-xs text-slate-500">
                      Hot water only (not whole-home electricity usage).
                    </div>
                  )}
                  {hotWaterSystem === "gas" && (
                    <div className="mt-2 text-xs text-slate-500">Hot water gas only.</div>
                  )}
                </div>
              )}
            </div>

            {/* Calculation details */}
            <details className="bg-white/70 rounded-lg p-3 border border-red-200">
              <summary className="text-sm font-medium text-red-700 cursor-pointer">
                Calculation details
              </summary>
              <div className="mt-2 text-xs text-slate-700 space-y-1">
                {usageKnown && knownUsageValue > 0 ? (
                  <>
                    <div>
                      Usage-based calculation: {knownUsageValue} {usageUnit}/{currentTimeUnit}
                    </div>
                    <div>Energy-saving multiplier: {energySaving ? "0.7" : "1.0"}</div>
                    {hotWaterSystem === "electric" || hotWaterSystem === "solar" ? (
                      <div>Electricity factor: {factors?.electricity ?? "-"} kg CO₂-e/kWh</div>
                    ) : (
                      <div>
                        Gas factor: {factors?.gas ?? "-"}{" "}
                        {factors?.units?.gas ?? "kg CO₂-e per kWh equivalent"}
                      </div>
                    )}
                    <div>Calculation: usage × factor × multiplier</div>
                  </>
                ) : (
                  <>
                    <div>Household-based calculation: {household} people</div>
                    <div>
                      Base consumption:{" "}
                      {hotWaterSystem === "electric"
                        ? "2.5 kWh"
                        : hotWaterSystem === "gas"
                          ? "10.0 MJ"
                          : "1.0 kWh"}{" "}
                      per person per day
                    </div>
                    <div>Energy-saving multiplier: {energySaving ? "0.7" : "1.0"}</div>
                    {hotWaterSystem === "electric" || hotWaterSystem === "solar" ? (
                      <div>Electricity factor: {factors?.electricity ?? "-"} kg CO₂-e/kWh</div>
                    ) : (
                      <div>
                        Gas factor: {factors?.gas ?? "-"}{" "}
                        {factors?.units?.gas ?? "kg CO₂-e per kWh equivalent"}
                      </div>
                    )}
                    <div>
                      Calculation: {household} people ×{" "}
                      {currentTimeUnit === "month"
                        ? "30"
                        : currentTimeUnit === "quarter"
                          ? "91"
                          : "365"}{" "}
                      days × daily consumption × factor × multiplier
                    </div>
                  </>
                )}
              </div>
            </details>
          </div>

          {/* Section total summary */}
          <div className="mt-4 bg-white/80 rounded-lg p-4 border border-red-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-800">Section total</div>
                <div className="text-xs text-red-600">Hot water emissions</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  {(
                    hotWaterEmissionsKgYear /
                    (currentTimeUnit === "month"
                      ? 12
                      : currentTimeUnit === "quarter"
                        ? 4
                        : currentTimeUnit === "week"
                          ? 52.143
                          : 1)
                  ).toFixed(1)}{" "}
                  kg CO₂/{unitLabel}
                </div>
                <div className="text-xs text-red-500">
                  {hotWaterEmissionsKgYear.toFixed(1)} kg CO₂/year
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slider thumb styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ef4444; /* red-500 */
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
