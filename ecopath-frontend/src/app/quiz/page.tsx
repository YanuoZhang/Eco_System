"use client";

import { useEffect, useState, useCallback } from "react";
import QuizHero from "@/components/quiz/QuizHero";
import QuizElectricity from "@/components/quiz/QuizElectricity";
import QuizHotWater from "@/components/quiz/QuizHotWater";
import QuizAppliances from "@/components/quiz/QuizAppliances";
import QuizTransport from "@/components/quiz/QuizTransport";
import QuizFloatingPreview from "@/components/quiz/QuizFloatingPreview";
import QuizResultsModal from "@/components/quiz/QuizResultsModal";
import apiClient, { StateData } from "@/services/apiClient";

export default function QuizPage() {
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string>("VIC");
  const [showResults, setShowResults] = useState(false);
  const [timeUnit, setTimeUnit] = useState<"week" | "month" | "quarter" | "year">("month");
  const [factors, setFactors] = useState<{
    electricity?: number;
    gas?: number;
    units?: { gas?: string };
  } | null>(null);
  
  // Original quiz data for AI recommendations
  const [electricity, setElectricity] = useState<number>(0);
  const [gasMJ, setGasMJ] = useState<number>(0);
  const [hotWaterSystem, setHotWaterSystem] = useState<"electric" | "gas" | "solar" | undefined>(undefined);
  const [hotWaterUsage, setHotWaterUsage] = useState<number>(0);
  const [hotWaterHousehold, setHotWaterHousehold] = useState<number>(0);
  const [appliancesUsage, setAppliancesUsage] = useState<Array<{ appliance: string; hoursPerWeek?: number; energyEfficient?: boolean }>>([]);
  const [transportModes, setTransportModes] = useState<Array<{ mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking"; distance?: number; frequency?: number }>>([]);
  
  // Calculated emissions data
  const [electricityEmissions, setElectricityEmissions] = useState<number>(0);
  const [hotWaterEmissions, setHotWaterEmissions] = useState<number>(0);
  const [appliancesEmissions, setAppliancesEmissions] = useState<number>(0);
  const [transportEmissions, setTransportEmissions] = useState<number>(0);
  const [transportBreakdown, setTransportBreakdown] = useState<
    | Record<
        string,
        { name: string; icon: string; emissions: number; distance: number; fuelType?: string }
      >
    | undefined
  >(undefined);
  const [applianceBreakdown, setApplianceBreakdown] = useState<
    | Record<string, { name: string; icon: string; emissions: number; usageHoursPerWeek: number }>
    | undefined
  >(undefined);

  const handleTransportChange = useCallback(
    (v: {
      transportEmissionsKgYear?: number;
      transportBreakdownKgYear?: Record<
        string,
        { name: string; icon: string; emissions: number; distance: number; fuelType?: string }
      >;
      modes?: Array<{ mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking"; distance?: number; frequency?: number }>;
    }) => {
      if (v.modes) setTransportModes(v.modes);
      if (typeof v.transportEmissionsKgYear === "number")
        setTransportEmissions(v.transportEmissionsKgYear);
      if (v.transportBreakdownKgYear) setTransportBreakdown(v.transportBreakdownKgYear);
    },
    [],
  );

  useEffect(() => {
    apiClient
      .getStates()
      .then((list) => setStates(list))
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!selectedState) return;
    apiClient
      .getEmissionsFactors(selectedState)
      .then((data) =>
        setFactors(data as { electricity?: number; gas?: number; units?: { gas?: string } }),
      )
      .catch(() => setFactors(null));
  }, [selectedState]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-green-50">
      <QuizHero states={states} selectedState={selectedState} onStateChange={setSelectedState} />
      {/* Global time unit selector under hero, aligned to top-right */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-end">
          <div className="grid grid-cols-4 gap-3 mt-4">
            {(["week", "month", "quarter", "year"] as const).map((tu) => (
              <button
                key={tu}
                type="button"
                onClick={() => setTimeUnit(tu)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${timeUnit === tu ? "bg-orange-500 text-white shadow-md" : "bg-white text-slate-600 hover:bg-orange-100 border border-orange-200"}`}
              >
                {tu}
              </button>
            ))}
          </div>
        </div>
      </div>
      <section className="py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <QuizElectricity
            timeUnit={timeUnit}
            factors={factors}
            onChange={(v) => {
              if (v.timeUnit) setTimeUnit(v.timeUnit);
              if (typeof v.electricity === "number") setElectricity(v.electricity);
              if (typeof v.gasMJ === "number") setGasMJ(v.gasMJ);
              if (typeof v.electricityEmissionsKgYear === "number")
                setElectricityEmissions(v.electricityEmissionsKgYear);
            }}
          />
          <QuizHotWater
            timeUnit={timeUnit}
            factors={factors}
            onChange={(v) => {
              if (v.timeUnit) setTimeUnit(v.timeUnit);
              if (v.system) setHotWaterSystem(v.system);
              if (typeof v.usage === "number") setHotWaterUsage(v.usage);
              if (typeof v.household === "number") setHotWaterHousehold(v.household);
              if (typeof v.hotWaterEmissionsKgYear === "number")
                setHotWaterEmissions(v.hotWaterEmissionsKgYear);
            }}
          />
          <QuizAppliances
            timeUnit={timeUnit}
            factors={{ electricity: factors?.electricity }}
            onChange={(v) => {
              if (v.weeklyUsage) setAppliancesUsage(v.weeklyUsage);
              if (typeof v.appliancesEmissionsKgYear === "number")
                setAppliancesEmissions(v.appliancesEmissionsKgYear);
              if (v.applianceBreakdownKgYear) setApplianceBreakdown(v.applianceBreakdownKgYear);
            }}
          />
          <QuizTransport timeUnit={timeUnit} factors={factors} onChange={handleTransportChange} />
        </div>
      </section>
      <QuizFloatingPreview
        valueKgYear={
          electricityEmissions + hotWaterEmissions + appliancesEmissions + transportEmissions
        }
        timeUnit={timeUnit}
        onOpen={() => {
          // Persist quiz summary for AI suggestions and later revisit
          try {
            const payload = {
              // Original quiz data for AI recommendations
              location: { state: selectedState },
              electricity: {
                usage: electricity,
                timeUnit,
                household: 1, // Default household size
              },
              hotWater: {
                system: hotWaterSystem,
                usage: hotWaterUsage,
                timeUnit,
                household: hotWaterHousehold,
              },
              appliances: {
                weeklyUsage: appliancesUsage,
              },
              transport: {
                modes: transportModes,
              },
              // Calculated results for display
              state: selectedState,
              timeUnit,
              totals: {
                electricityKgYear: electricityEmissions,
                hotWaterKgYear: hotWaterEmissions,
                appliancesKgYear: appliancesEmissions,
                transportKgYear: transportEmissions,
                totalKgYear:
                  electricityEmissions +
                  hotWaterEmissions +
                  appliancesEmissions +
                  transportEmissions,
              },
              appliances: applianceBreakdown || {},
              transport: transportBreakdown || {},
              savedAt: new Date().toISOString(),
            };
            if (typeof window !== "undefined") {
              localStorage.setItem("carbonFootprint", JSON.stringify(payload));
            }
          } catch {}
          setShowResults(true);
        }}
      />
      <QuizResultsModal
        open={showResults}
        onClose={() => setShowResults(false)}
        timeUnit={timeUnit}
        totals={{
          electricityKgYear: electricityEmissions,
          hotWaterKgYear: hotWaterEmissions,
          appliancesKgYear: appliancesEmissions,
          transportKgYear: transportEmissions,
        }}
        appliances={applianceBreakdown}
        transport={transportBreakdown}
      />

      {/* Bottom CTA: clear next-step guidance with large primary button */}
      <div className="border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            Ready to turn insights into action?
          </h3>
          <p className="text-slate-600 mb-6">
            Use your footprint results to build a personalised pledge plan and set reminders.
          </p>
          <a
            href="/pledge"
            className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 rounded-full shadow-2xl transition-all duration-300 ring-4 ring-emerald-300/20"
          >
            Create My Action Plan →
          </a>
        </div>
      </div>
    </div>
  );
}
