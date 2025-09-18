"use client";

import { useEffect, useState } from "react";
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
  const [electricityEmissions, setElectricityEmissions] = useState<number>(0);
  const [hotWaterEmissions, setHotWaterEmissions] = useState<number>(0);
  const [appliancesEmissions, setAppliancesEmissions] = useState<number>(0);
  const [applianceBreakdown, setApplianceBreakdown] = useState<
    | Record<string, { name: string; icon: string; emissions: number; usageHoursPerWeek: number }>
    | undefined
  >(undefined);

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
              if (typeof v.electricityEmissionsKgYear === "number")
                setElectricityEmissions(v.electricityEmissionsKgYear);
            }}
          />
          <QuizHotWater
            timeUnit={timeUnit}
            factors={factors}
            onChange={(v) => {
              if (v.timeUnit) setTimeUnit(v.timeUnit);
              if (typeof v.hotWaterEmissionsKgYear === "number")
                setHotWaterEmissions(v.hotWaterEmissionsKgYear);
            }}
          />
          <QuizAppliances
            timeUnit={timeUnit}
            factors={{ electricity: factors?.electricity }}
            onChange={(v) => {
              if (typeof v.appliancesEmissionsKgYear === "number")
                setAppliancesEmissions(v.appliancesEmissionsKgYear);
              if (v.applianceBreakdownKgYear) setApplianceBreakdown(v.applianceBreakdownKgYear);
            }}
          />
          <QuizTransport />
        </div>
      </section>
      <QuizFloatingPreview
        valueKgYear={electricityEmissions + hotWaterEmissions + appliancesEmissions}
        timeUnit={timeUnit}
        onOpen={() => setShowResults(true)}
      />
      <QuizResultsModal
        open={showResults}
        onClose={() => setShowResults(false)}
        timeUnit={timeUnit}
        totals={{
          electricityKgYear: electricityEmissions,
          hotWaterKgYear: hotWaterEmissions,
          appliancesKgYear: appliancesEmissions,
        }}
        appliances={applianceBreakdown}
      />
    </div>
  );
}
