"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QuizHero from "@/components/quiz/QuizHero";
import QuizElectricity from "@/components/quiz/QuizElectricity";
import QuizHotWater from "@/components/quiz/QuizHotWater";
import QuizAppliances from "@/components/quiz/QuizAppliances";
import QuizTransport from "@/components/quiz/QuizTransport";
import QuizFloatingPreview from "@/components/quiz/QuizFloatingPreview";
import QuizResultsModal from "@/components/quiz/QuizResultsModal";
import apiClient, { StateData } from "@/services/apiClient";

// Helper function to save quiz data and trigger storage event
const saveQuizDataWithEvent = (payload: unknown) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("carbonFootprint", JSON.stringify(payload));

    // Save a data version number to track changes
    const dataVersion = Date.now().toString();
    localStorage.setItem("quizDataVersion", dataVersion);

    // Trigger a custom event to notify other tabs/pages that quiz data has been updated
    window.dispatchEvent(
      new CustomEvent("quizDataUpdated", {
        detail: { timestamp: Date.now(), dataVersion },
      }),
    );
  }
};

export default function QuizPage() {
  const router = useRouter();
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string>("VIC");
  const [showResults, setShowResults] = useState(false);
  const [timeUnit, setTimeUnit] = useState<"week" | "month" | "quarter" | "year">("month");
  const [factors, setFactors] = useState<{
    electricity?: number;
    gas?: number;
    units?: { gas?: string };
  } | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Original quiz data for AI recommendations
  // Electricity: either exact usage OR bill/household for estimation
  const [electricity, setElectricity] = useState<number | undefined>(undefined);
  const [electricityBill, setElectricityBill] = useState<number | undefined>(undefined);
  const [electricityHousehold, setElectricityHousehold] = useState<number | undefined>(undefined);

  const [hotWaterSystem, setHotWaterSystem] = useState<"electric" | "gas" | "solar" | undefined>(
    undefined,
  );
  const [hotWaterUsage, setHotWaterUsage] = useState<number | undefined>(undefined);
  const [hotWaterHousehold, setHotWaterHousehold] = useState<number | undefined>(undefined);
  const [appliancesUsage, setAppliancesUsage] = useState<
    Array<{ appliance: string; hoursPerWeek?: number; energyEfficient?: boolean }>
  >([]);
  const [transportModes, setTransportModes] = useState<
    Array<{
      mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
      distance?: number;
      frequency?: number;
    }>
  >([]);

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
  const [isLoadingData, setIsLoadingData] = useState(true); // Prevent auto-save during initial load

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedData = localStorage.getItem("carbonFootprint");
      if (savedData) {
        const parsed = JSON.parse(savedData);

        // Restore location
        if (parsed.location?.state) {
          setSelectedState(parsed.location.state);
        } else if (parsed.state) {
          setSelectedState(parsed.state);
        }

        // Restore time unit
        if (parsed.timeUnit) {
          setTimeUnit(parsed.timeUnit);
        }

        // Restore electricity data - check mode
        if (parsed.electricity?.usage !== undefined && parsed.electricity.usage > 0) {
          // User entered exact usage
          setElectricity(parsed.electricity.usage);
          setElectricityBill(undefined);
          setElectricityHousehold(undefined);
        } else if (parsed.electricity?.bill !== undefined) {
          // User used estimation
          setElectricity(undefined);
          setElectricityBill(parsed.electricity.bill);
          setElectricityHousehold(parsed.electricity.household || 1);
        }

        // Restore hot water data
        if (parsed.hotWater?.system) {
          setHotWaterSystem(parsed.hotWater.system);
        }
        if (parsed.hotWater?.usage !== undefined) {
          setHotWaterUsage(parsed.hotWater.usage);
        }
        if (parsed.hotWater?.household !== undefined) {
          setHotWaterHousehold(parsed.hotWater.household);
        }

        // Restore appliances data
        if (parsed.appliances?.weeklyUsage) {
          setAppliancesUsage(parsed.appliances.weeklyUsage);
        }

        // Restore transport data
        if (parsed.transport?.modes) {
          setTransportModes(parsed.transport.modes);
        }

        // Restore calculated emissions
        if (parsed.totals) {
          if (parsed.totals.electricityKgYear !== undefined) {
            setElectricityEmissions(parsed.totals.electricityKgYear);
          }
          if (parsed.totals.hotWaterKgYear !== undefined) {
            setHotWaterEmissions(parsed.totals.hotWaterKgYear);
          }
          if (parsed.totals.appliancesKgYear !== undefined) {
            setAppliancesEmissions(parsed.totals.appliancesKgYear);
          }
          if (parsed.totals.transportKgYear !== undefined) {
            setTransportEmissions(parsed.totals.transportKgYear);
          }
        }

        // Restore breakdowns
        if (parsed.applianceBreakdown) {
          setApplianceBreakdown(parsed.applianceBreakdown);
        }
        if (parsed.transportBreakdown) {
          setTransportBreakdown(parsed.transportBreakdown);
        }
      }
    } catch (e) {
      console.error("[Quiz] Error loading from localStorage:", e);
    } finally {
      setIsDataLoaded(true);
      setIsLoadingData(false); // Allow auto-save after initial load is complete

      // If we loaded existing data, ensure we have a data version number
      const existingData = localStorage.getItem("carbonFootprint");
      const existingVersion = localStorage.getItem("quizDataVersion");
      if (existingData && !existingVersion) {
        const dataVersion = Date.now().toString();
        localStorage.setItem("quizDataVersion", dataVersion);
      }
    }
  }, []);

  const handleTransportChange = useCallback(
    (v: {
      transportEmissionsKgYear?: number;
      transportBreakdownKgYear?: Record<
        string,
        { name: string; icon: string; emissions: number; distance: number; fuelType?: string }
      >;
      modes?: Array<{
        mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
        distance?: number;
        frequency?: number;
      }>;
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
      .then((data) => {
        setFactors(data as { electricity?: number; gas?: number; units?: { gas?: string } });
      })
      .catch((error) => {
        console.error("[Quiz] Failed to load factors:", error);
        setFactors(null);
      });
  }, [selectedState]);

  // Auto-save quiz data when values change (for AI recommendations)
  useEffect(() => {
    // Don't auto-save during initial data loading
    if (isLoadingData) {
      return;
    }

    // Only save if we have meaningful data
    if (
      electricity !== undefined ||
      electricityBill !== undefined ||
      hotWaterSystem !== undefined ||
      appliancesUsage.length > 0 ||
      transportModes.length > 0
    ) {
      try {
        const payload = {
          // Original quiz data for AI recommendations
          location: { state: selectedState },
          electricity:
            electricity !== undefined
              ? // User entered exact usage
                { usage: electricity, timeUnit }
              : // User used estimation
                { bill: electricityBill, household: electricityHousehold, timeUnit },
          hotWater:
            hotWaterUsage !== undefined
              ? // User entered exact usage
                { system: hotWaterSystem, usage: hotWaterUsage, timeUnit }
              : // User using estimation
                { system: hotWaterSystem, household: hotWaterHousehold, timeUnit },
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
              electricityEmissions + hotWaterEmissions + appliancesEmissions + transportEmissions,
          },
          applianceBreakdown: applianceBreakdown || {},
          transportBreakdown: transportBreakdown || {},
          savedAt: new Date().toISOString(),
        };

        saveQuizDataWithEvent(payload);
      } catch (e) {
        console.error("[Quiz] Error auto-saving to localStorage:", e);
      }
    }
  }, [
    selectedState,
    electricity,
    electricityBill,
    electricityHousehold,
    hotWaterSystem,
    hotWaterUsage,
    hotWaterHousehold,
    appliancesUsage,
    transportModes,
    timeUnit,
    electricityEmissions,
    hotWaterEmissions,
    appliancesEmissions,
    transportEmissions,
    applianceBreakdown,
    transportBreakdown,
    isLoadingData, // Add dependency to prevent auto-save during loading
  ]);

  // Show loading state until data is loaded
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your saved data...</p>
        </div>
      </div>
    );
  }

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
            electricity={electricity}
            bill={electricityBill}
            household={electricityHousehold}
            factors={factors}
            onChange={(v) => {
              if (v.timeUnit) setTimeUnit(v.timeUnit);
              // Handle both modes - only update if explicitly provided
              if (v.electricity !== undefined) {
                // User is in exact usage mode
                if (v.electricity !== electricity) {
                  setElectricity(v.electricity);
                }
                if (electricityBill !== undefined) {
                  setElectricityBill(undefined);
                }
                if (electricityHousehold !== undefined) {
                  setElectricityHousehold(undefined);
                }
              } else if (v.bill !== undefined) {
                // User is in estimation mode
                if (electricity !== undefined) {
                  setElectricity(undefined);
                }
                if (v.bill !== electricityBill) {
                  setElectricityBill(v.bill);
                }
                if (v.household !== electricityHousehold) {
                  setElectricityHousehold(v.household);
                }
              }
              if (typeof v.electricityEmissionsKgYear === "number")
                setElectricityEmissions(v.electricityEmissionsKgYear);
            }}
          />
          <QuizHotWater
            timeUnit={timeUnit}
            factors={factors}
            system={hotWaterSystem}
            usage={hotWaterUsage}
            household={hotWaterHousehold}
            onChange={(v) => {
              if (v.timeUnit) setTimeUnit(v.timeUnit);
              if (v.system) setHotWaterSystem(v.system);

              // Handle both modes
              if (v.usage !== undefined) {
                // User entered exact usage
                if (v.usage !== hotWaterUsage) {
                  setHotWaterUsage(v.usage);
                }
                if (hotWaterHousehold !== undefined) {
                  setHotWaterHousehold(undefined);
                }
              } else if (v.household !== undefined) {
                // User using estimation
                if (hotWaterUsage !== undefined) {
                  setHotWaterUsage(undefined);
                }
                if (v.household !== hotWaterHousehold) {
                  setHotWaterHousehold(v.household);
                }
              }

              if (typeof v.hotWaterEmissionsKgYear === "number")
                setHotWaterEmissions(v.hotWaterEmissionsKgYear);
            }}
          />
          <QuizAppliances
            timeUnit={timeUnit}
            factors={{ electricity: factors?.electricity }}
            weeklyUsage={appliancesUsage}
            onChange={(v) => {
              if (v.weeklyUsage) setAppliancesUsage(v.weeklyUsage);
              if (typeof v.appliancesEmissionsKgYear === "number")
                setAppliancesEmissions(v.appliancesEmissionsKgYear);
              if (v.applianceBreakdownKgYear) setApplianceBreakdown(v.applianceBreakdownKgYear);
            }}
          />
          <QuizTransport
            timeUnit={timeUnit}
            factors={factors}
            initialModes={transportModes}
            onChange={handleTransportChange}
          />
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
              electricity:
                electricity !== undefined
                  ? // User entered exact usage
                    { usage: electricity, timeUnit }
                  : // User used estimation
                    { bill: electricityBill, household: electricityHousehold, timeUnit },
              hotWater:
                hotWaterUsage !== undefined
                  ? // User entered exact usage
                    { system: hotWaterSystem, usage: hotWaterUsage, timeUnit }
                  : // User using estimation
                    { system: hotWaterSystem, household: hotWaterHousehold, timeUnit },
              appliances: {
                weeklyUsage: appliancesUsage,
              },
              transport: {
                modes: transportModes,
              },
              // Emission factors for scientific calculations
              factors: factors,
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
                // Add all time units for consistency
                totalKgMonth:
                  (electricityEmissions +
                    hotWaterEmissions +
                    appliancesEmissions +
                    transportEmissions) /
                  12,
                totalKgWeek:
                  (electricityEmissions +
                    hotWaterEmissions +
                    appliancesEmissions +
                    transportEmissions) /
                  52.143,
                totalKgQuarter:
                  (electricityEmissions +
                    hotWaterEmissions +
                    appliancesEmissions +
                    transportEmissions) /
                  4,
              },
              applianceBreakdown: applianceBreakdown || {},
              transportBreakdown: transportBreakdown || {},
              savedAt: new Date().toISOString(),
            };

            saveQuizDataWithEvent(payload);
          } catch (e) {
            console.error("[Quiz] Error saving to localStorage:", e);
          }
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
          <button
            onClick={() => {
              // Save data to localStorage before navigating
              try {
                const payload = {
                  // Original quiz data for AI recommendations
                  location: { state: selectedState },
                  electricity:
                    electricity !== undefined
                      ? // User entered exact usage
                        { usage: electricity, timeUnit }
                      : // User used estimation
                        { bill: electricityBill, household: electricityHousehold, timeUnit },
                  hotWater:
                    hotWaterUsage !== undefined
                      ? // User entered exact usage
                        { system: hotWaterSystem, usage: hotWaterUsage, timeUnit }
                      : // User using estimation
                        { system: hotWaterSystem, household: hotWaterHousehold, timeUnit },
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
                  applianceBreakdown: applianceBreakdown || {},
                  transportBreakdown: transportBreakdown || {},
                  savedAt: new Date().toISOString(),
                };

                saveQuizDataWithEvent(payload);

                // Navigate to pledge page
                router.push("/pledge");
              } catch (e) {
                console.error("[Quiz] Error saving and navigating:", e);
                // Still navigate even if save fails
                router.push("/pledge");
              }
            }}
            className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 rounded-full shadow-2xl transition-all duration-300 ring-4 ring-emerald-300/20"
          >
            Create My Action Plan →
          </button>
        </div>
      </div>
    </div>
  );
}
