"use client";

import { useEffect, useId, useMemo, useState } from "react";

type Props = {
  open?: boolean;
  onToggle?: () => void;
  electricity?: number; // kWh
  gasMJ?: number; // MJ
  timeUnit?: "month" | "quarter" | "year";
  onChange?: (v: {
    electricity?: number;
    gasMJ?: number;
    timeUnit?: "month" | "quarter" | "year";
    electricityEmissionsKgYear?: number;
  }) => void;
  factors?: { electricity?: number; gas?: number; units?: { gas?: string } } | null;
};

export default function QuizElectricity({
  open = true,
  onToggle,
  electricity,
  gasMJ: _gasMJ,
  timeUnit = "month",
  onChange,
  factors,
}: Props) {
  const id = useId();
  const [localOpen, setLocalOpen] = useState(open);
  const isOpen = onToggle ? open : localOpen;

  const handleToggle = () => (onToggle ? onToggle() : setLocalOpen((v) => !v));

  // Support both known-kWh input and bill/household estimation
  const [knowKwh, setKnowKwh] = useState<boolean>(false);
  const [bill, setBill] = useState<number>(1); // $ per selected unit
  const [household, setHousehold] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [led, setLed] = useState<"yes" | "no" | "mixed" | null>(null);
  const [ac, setAc] = useState<"frequently" | "rarely" | "seasonally" | null>(null);
  const [efficient, setEfficient] = useState<"yes" | "no" | "mixed" | null>(null);

  // Local fallback timeUnit when parent is not controlling it
  const [localTimeUnit] = useState<"month" | "quarter" | "year">("month");
  const currentTimeUnit = timeUnit ?? localTimeUnit;

  // Locally controlled kWh; always editable; sync initial value from parent
  const [localElectricity, setLocalElectricity] = useState<number | "">(electricity ?? "");
  useEffect(() => {
    if (electricity !== undefined) setLocalElectricity(electricity);
  }, [electricity]);

  // Estimation rule (simplified from refer): kWh ≈ bill / 0.25, adjusted by household size
  const estimatedKwh = useMemo(() => {
    const base = bill > 0 ? bill / 0.25 : 0;
    const adj = Math.max(0.7, Math.min(1.5, household / 2.5));
    return Math.round(base * adj);
  }, [bill, household]);

  // Compute electricity emissions (kg CO2e/year) using energyrating.gov.au-based multipliers (conservative)
  const electricityFactor = factors?.electricity ?? 0;
  const scale = currentTimeUnit === "month" ? 12 : currentTimeUnit === "quarter" ? 4 : 1;
  const kwhInput = knowKwh
    ? typeof localElectricity === "number"
      ? localElectricity
      : 0
    : estimatedKwh;
  let emissionsYear = kwhInput * scale * electricityFactor;
  const ledMultiplier = led === "yes" ? 0.85 : led === "no" ? 1.3 : 1.0;
  const acMultiplier = ac === "rarely" ? 0.88 : ac === "frequently" ? 1.0 : 1.0;
  const efficientMultiplier = efficient === "yes" ? 0.8 : efficient === "mixed" ? 0.9 : 1.0;
  emissionsYear = emissionsYear * ledMultiplier * acMultiplier * efficientMultiplier;

  useEffect(() => {
    onChange?.({ electricityEmissionsKgYear: emissionsYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emissionsYear]);

  const unitLabel =
    currentTimeUnit === "month"
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
        aria-controls={`${id}-elec-body`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Electricity Usage</h3>
              <p className="text-sm text-slate-600">
                {unitLabel} electricity bill and household information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">{unitLabel}</div>
              <div className="text-sm font-semibold text-orange-600">
                {knowKwh
                  ? `${typeof localElectricity === "number" ? localElectricity : 0} kWh/${currentTimeUnit}`
                  : `$${bill}`}
              </div>
            </div>
            <i className={`ri-arrow-${isOpen ? "up" : "down"}-s-line text-slate-400 text-xl`} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div id={`${id}-elec-body`} className="px-5 pb-5">
          <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-200/30 space-y-6">
            {/* Monthly bill slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-800 font-semibold">
                  {currentTimeUnit === "month"
                    ? "Monthly"
                    : currentTimeUnit === "quarter"
                      ? "Quarterly"
                      : "Yearly"}{" "}
                  electricity bill
                </label>
                <div className="text-right">
                  <div className="text-xs text-slate-500">
                    {currentTimeUnit === "month"
                      ? "Monthly"
                      : currentTimeUnit === "quarter"
                        ? "Quarterly"
                        : "Yearly"}
                  </div>
                  <div className="text-sm font-semibold text-orange-600">${bill}</div>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={5000}
                step={1}
                value={bill}
                onChange={(e) => setBill(Number(e.target.value))}
                className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>$1</span>
                <span>$5000</span>
              </div>
            </div>

            {/* Household slider */}
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
                className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1 person</span>
                <span>8+ people</span>
              </div>
            </div>

            {/* Known kWh toggle + input (same position as refer) */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                id={`${id}-know`}
                type="checkbox"
                checked={knowKwh}
                onChange={(e) => setKnowKwh(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 rounded"
              />
              <span className="text-sm sm:text-base text-slate-700 font-medium">
                I know my exact kWh usage
              </span>
            </label>

            {knowKwh && (
              <div className="relative animate-fade-in">
                <input
                  type="number"
                  min={0}
                  value={localElectricity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocalElectricity(v === "" ? "" : Number(v));
                    onChange?.({ electricity: v === "" ? undefined : Number(v) });
                  }}
                  className="w-full p-3 sm:p-4 border border-orange-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-lg"
                  placeholder="600"
                />
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm sm:text-base">
                  kWh/{currentTimeUnit}
                </div>
              </div>
            )}

            {/* Estimated usage hint */}
            {!knowKwh && (
              <div className="text-sm text-slate-600">
                Estimated usage:{" "}
                <span className="font-semibold text-slate-800">
                  {estimatedKwh} kWh/{currentTimeUnit}
                </span>
              </div>
            )}

            {/* Time unit buttons removed; using the global selector under hero */}

            <details className="bg-white/70 rounded-lg p-3 border border-orange-200">
              <summary className="text-sm font-medium text-orange-700 cursor-pointer">
                Calculation details
              </summary>
              <div className="mt-2 text-xs text-slate-700 space-y-1">
                {factors && (
                  <div>Electricity factor: {factors.electricity ?? "-"} kg CO₂-e/kWh</div>
                )}
                <div>Bill→kWh assumption: price 0.25 $/kWh (configurable)</div>
                <div>Household adjustment applies only when using bill-based estimation</div>
              </div>
            </details>

            {/* Advanced options */}
            <button
              type="button"
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 8.25a.75.75 0 0 1 .53.22l6 6a.75.75 0 1 1-1.06 1.06L12 10.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06l6-6a.75.75 0 0 1 .53-.22z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 15.75a.75.75 0 0 1-.53-.22l-6-6a.75.75 0 1 1 1.06-1.06L12 13.94l5.47-5.47a.75.75 0 0 1 1.06 1.06l-6 6a.75.75 0 0 1-.53.22z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>Advanced options (for more accurate calculation)</span>
            </button>

            {showAdvanced && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h4 className="text-slate-700 font-medium mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <span>Do you mainly use LED bulbs?</span>
                  </h4>
                  <div className="flex gap-3">
                    {(["yes", "no", "mixed"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setLed(v)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${led === v ? "bg-orange-500 text-white shadow-md scale-105" : "bg-white text-slate-600 hover:bg-orange-100 border border-orange-200"}`}
                      >
                        {v[0].toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-700 font-medium mb-3 flex items-center gap-2">
                    <span className="text-lg">❄️</span>
                    <span>Do you use air conditioning frequently?</span>
                  </h4>
                  <div className="flex gap-3">
                    {(["frequently", "rarely", "seasonally"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAc(v)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${ac === v ? "bg-orange-500 text-white shadow-md scale-105" : "bg-white text-slate-600 hover:bg-orange-100 border border-orange-200"}`}
                      >
                        {v[0].toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-700 font-medium mb-3 flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span>Are most of your appliances energy-efficient?</span>
                  </h4>
                  <div className="flex gap-3">
                    {(["yes", "no", "mixed"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setEfficient(v)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${efficient === v ? "bg-orange-500 text-white shadow-md scale-105" : "bg-white text-slate-600 hover:bg-orange-100 border border-orange-200"}`}
                      >
                        {v[0].toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Advanced multipliers are based on energyrating.gov.au (conservative defaults)
                </div>
              </div>
            )}
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
          background: #f97316; /* orange-500 */
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
