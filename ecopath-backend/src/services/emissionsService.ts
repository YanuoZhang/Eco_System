// Emissions calculation service with database integration

import { pool } from "../config/database";
import { EnergyData, TransportData, FactorOverrides } from "../types";
import { calculateEnergyEmissions, EMISSIONS_FACTORS } from "../utils/emissions";
import { UserPledgesService } from "./userPledgesService";
import { predictionCache } from "./predictionCache";
// Note: Using database pledges directly instead of pledgeImpacts.ts

// DB-backed factors helpers
export async function getDbElectricityFactorKgPerKwh(state: string): Promise<number | null> {
  try {
    const q = `
      SELECT direct_emission_factor_kg_per_kwh
      FROM electricity_factor_by_state
      WHERE state_id = $1
      ORDER BY year DESC
      LIMIT 1
    `;
    const r = await pool.query(q, [state]);
    if (r.rows.length > 0) {
      const v = r.rows[0].direct_emission_factor_kg_per_kwh;
      return typeof v === "number" ? v : Number(v);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getDbGasFactorKgPerGJ(state: string): Promise<number | null> {
  try {
    const q = `
      SELECT AVG(kg_co2e_per_gj) AS avg_kg_per_gj
      FROM gas_factor_by_state
      WHERE state_id = $1
    `;
    const r = await pool.query(q, [state]);
    if (r.rows.length > 0 && r.rows[0].avg_kg_per_gj != null) {
      const scope3 = r.rows[0].avg_kg_per_gj;
      const scope3Num = typeof scope3 === "number" ? scope3 : Number(scope3);
      // Return total factor: Scope1 (combustion) + Scope3 (upstream)
      return scope3Num + 51.5; // GAS_SCOPE1_KG_PER_GJ
    }
    return null;
  } catch {
    return null;
  }
}

// Attempt to compute car emissions using DB fuel economy when available
export async function getDbCarKgPerKm(state: string): Promise<number | null> {
  try {
    // Use average across vehicle types for the state (liters/100km), convert to kg/km
    const q = `
      SELECT
        AVG(NULLIF(petrol_l_per_100km, 0)) AS petrol_l_per_100km,
        AVG(NULLIF(diesel_l_per_100km, 0)) AS diesel_l_per_100km
      FROM fuel_economy_raw
      WHERE year = 2024 AND state_id = $1
    `;
    const r = await pool.query(q, [state]);
    if (r.rows.length === 0) return null;
    const petrol = r.rows[0].petrol_l_per_100km as number | null;
    const diesel = r.rows[0].diesel_l_per_100km as number | null;

    // Standard CO2 factors (kg CO2-e per liter) as fallback constants
    const KG_PER_L_PETROL = 2.31;
    const KG_PER_L_DIESEL = 2.68;

    const petrolKgPerKm = petrol != null ? (petrol / 100) * KG_PER_L_PETROL : null;
    const dieselKgPerKm = diesel != null ? (diesel / 100) * KG_PER_L_DIESEL : null;

    if (petrolKgPerKm == null && dieselKgPerKm == null) return null;
    if (petrolKgPerKm != null && dieselKgPerKm != null) return (petrolKgPerKm + dieselKgPerKm) / 2;
    return (petrolKgPerKm ?? dieselKgPerKm)!;
  } catch {
    return null;
  }
}

export async function calculateTransportEmissions(transport: TransportData, state: string) {
  const { convertToAnnual } = await import("../utils/emissions");
  const annualDistance = convertToAnnual(transport.distance, transport.timeUnit);
  const frequency = transport.frequency || 1;
  const totalAnnualDistance = annualDistance * frequency;

  if (transport.mode === "car") {
    const dbKgPerKm = await getDbCarKgPerKm(state);
    if (dbKgPerKm != null) {
      const modeEmissions = totalAnnualDistance * dbKgPerKm;
      return { car: modeEmissions, total: modeEmissions } as const;
    }
  }

  // For electric transport modes (bus, train, tram), calculate based on electricity factor
  if (["bus", "train", "tram"].includes(transport.mode)) {
    const electricityFactor = await getDbElectricityFactorKgPerKwh(state);
    if (electricityFactor != null) {
      // Electric transport energy consumption per km (kWh/km)
      const energyConsumptionPerKm = {
        bus: 1.2, // kWh/km for electric bus
        train: 0.8, // kWh/km for electric train
        tram: 0.6, // kWh/km for electric tram
      };

      const energyConsumption =
        totalAnnualDistance *
        energyConsumptionPerKm[transport.mode as keyof typeof energyConsumptionPerKm];
      const modeEmissions = energyConsumption * electricityFactor;
      return { [transport.mode]: modeEmissions, total: modeEmissions } as const;
    }
  }

  const modeEmissions = totalAnnualDistance * EMISSIONS_FACTORS.transport[transport.mode];
  return { [transport.mode]: modeEmissions, total: modeEmissions } as const;
}

export async function calculateTotalEmissions(
  energy: EnergyData | undefined,
  transport: TransportData | undefined,
  state: string,
) {
  // Load DB-backed factors if available
  const [dbElec, dbGas] = await Promise.all([
    getDbElectricityFactorKgPerKwh(state),
    getDbGasFactorKgPerGJ(state),
  ]);
  const overrides: FactorOverrides = {
    electricityKgPerKwh: dbElec ?? undefined,
    gasKgPerGJ: dbGas ?? undefined,
  };

  let totalEmissions = 0;
  const breakdown: any = {};

  // Calculate energy emissions if provided
  if (energy) {
    const energyEmissions = calculateEnergyEmissions(energy, state, overrides);
    breakdown.energy = energyEmissions;
    totalEmissions += energyEmissions.total;
  }

  // Calculate transport emissions if provided
  if (transport) {
    const transportEmissions = await calculateTransportEmissions(transport, state);
    breakdown.transport = transportEmissions;
    totalEmissions += transportEmissions.total;
  }

  return { totalEmissions, breakdown };
}

// --- Comparison calculators ---

// Reasonable default baseline assumptions for a typical household (annualized)
const DEFAULT_BASELINE = {
  electricityKwhPerYear: 5000, // kWh/year
  gasMjPerYear: 20000, // MJ/year
  carKmPerYear: 12000, // km/year
} as const;

export async function calculateBaselineEmissions(userId: string, state: string) {
  // For now, baseline is derived from defaults; can be replaced with user profile later
  const energy = {
    electricity: DEFAULT_BASELINE.electricityKwhPerYear,
    gas: DEFAULT_BASELINE.gasMjPerYear,
    timeUnit: "year" as const,
  };
  const transport = {
    mode: "car" as const,
    distance: DEFAULT_BASELINE.carKmPerYear,
    timeUnit: "year" as const,
    frequency: 1,
  };

  const { totalEmissions } = await calculateTotalEmissions(energy, transport, state);
  return Math.round(totalEmissions);
}

export async function calculateWithPledgesEmissions(
  userId: string,
  state: string,
  pledgedKgPerYearReduction: number,
) {
  const baseline = await calculateBaselineEmissions(userId, state);
  const withPledges = Math.max(0, baseline - pledgedKgPerYearReduction);
  return {
    baseline,
    withPledges,
    saved: baseline - withPledges,
  };
}

export function calculateSavedEmissions(baseline: number, withPledges: number) {
  return Math.max(0, Math.round(baseline - withPledges));
}

// --- Multi-year forecast calculators ---

export interface MultiYearForecast {
  years: number[];
  baseline: number[];
  withPledges: number[];
  unit: string;
  timestamp: string;
  currentBaseline?: number;
  currentWithPledges?: number;
  currentSaved?: number;
  metadata: {
    state: string;
    pledgesCount: number;
    forecastYears: number;
    totalBaselineReduction: number;
    totalPledgeReduction: number;
    source?: string;
  };
}

// Note: Pledge impact calculations now use database pledges directly

// Baseline emissions growth rate (accounting for population growth, economic factors)
const BASELINE_GROWTH_RATE = 0.015; // 1.5% annual growth

export async function generateMultiYearForecast(
  userId: string,
  state: string,
  forecastYears: number = 5,
  quizData?: any,
): Promise<MultiYearForecast> {
  // Validate forecast years
  const years = Math.min(Math.max(forecastYears, 1), 10);

  // Get user pledges
  const pledges = await UserPledgesService.list(userId);

  try {
    // 🎯 Use ML predictions for baseline, but calculate saved values based on quiz data if available
    const personalSavingsPerYear =
      quizData && quizData.totals && quizData.totals.totalKgYear
        ? (() => {
            console.log(
              `📊 Calculating personal savings based on quiz baseline: ${quizData.totals.totalKgYear} kg/year`,
            );

            // Calculate pledge impact using the same logic as emissions.ts
            const calculatePledgeImpact = (
              title: string,
              category: string,
              baseline: number,
            ): number => {
              // Energy-related keywords
              if (title.includes("led") || title.includes("bulb") || title.includes("light")) {
                return Math.round(baseline * 0.09); // 9% of baseline
              }
              if (
                title.includes("air-dry") ||
                title.includes("laundry") ||
                title.includes("dryer")
              ) {
                return Math.round(baseline * 0.08); // 8% of baseline
              }

              // Water-related keywords
              if (title.includes("shower")) {
                return Math.round(baseline * 0.03); // 3% of baseline
              }
              if (title.includes("water")) {
                return Math.round(baseline * 0.01); // 1% of baseline
              }

              // Transport-related keywords
              if (title.includes("bike") || title.includes("cycling")) {
                return Math.round(baseline * 0.12); // 12% of baseline
              }
              if (title.includes("walk") || title.includes("walking")) {
                return Math.round(baseline * 0.08); // 8% of baseline
              }

              // Fallback to category-based calculation
              const categoryImpacts = {
                energy: 0.05, // 5% of baseline
                water: 0.02, // 2% of baseline
                transport: 0.1, // 10% of baseline
                food: 0.03, // 3% of baseline
                waste: 0.01, // 1% of baseline
                lifestyle: 0.01, // 1% of baseline
                daily: 0.01, // 1% of baseline
                other: 0.01, // 1% of baseline
              };
              const categoryImpact =
                categoryImpacts[category as keyof typeof categoryImpacts] || 0.01;
              return Math.round(baseline * categoryImpact);
            };

            // Calculate personal savings based on quiz baseline
            let personalSavings = 0;
            for (const pledge of pledges) {
              const title = (pledge as any).title?.toLowerCase() || "";
              const category = (pledge as any).category?.toLowerCase() || "other";
              personalSavings += calculatePledgeImpact(
                title,
                category,
                quizData.totals.totalKgYear,
              );
            }

            return personalSavings;
          })()
        : null;

    // 🔥 Fallback to ML predictions for state-level baseline
    const mlPredictions = await predictionCache.getPredictionsForState(state);

    if (mlPredictions.length > 0) {
      console.log(`✅ Using real ML predictions for ${state}`);

      // Get state population for per-person calculations
      const popQuery = `
        SELECT population FROM population 
        WHERE state_id = $1 
        ORDER BY year DESC LIMIT 1
      `;
      const popResult = await pool.query(popQuery, [state.toUpperCase()]);
      const statePopulation = popResult.rows[0]?.population
        ? parseInt(String(popResult.rows[0].population))
        : 6700000;

      // Calculate total pledge reduction per person per year using database pledges
      // Use the same intelligent calculation as emissions.ts
      const calculatePledgeImpact = (title: string, category: string, baseline: number): number => {
        // Energy-related keywords
        if (title.includes("led") || title.includes("bulb") || title.includes("light")) {
          return Math.round(baseline * 0.09); // 9% of baseline
        }
        if (title.includes("air-dry") || title.includes("laundry") || title.includes("dryer")) {
          return Math.round(baseline * 0.08); // 8% of baseline
        }

        // Water-related keywords
        if (title.includes("shower")) {
          return Math.round(baseline * 0.03); // 3% of baseline
        }
        if (title.includes("water")) {
          return Math.round(baseline * 0.01); // 1% of baseline
        }

        // Transport-related keywords
        if (title.includes("bike") || title.includes("cycling")) {
          return Math.round(baseline * 0.12); // 12% of baseline
        }
        if (title.includes("walk") || title.includes("walking")) {
          return Math.round(baseline * 0.08); // 8% of baseline
        }

        // Fallback to category-based calculation
        const categoryImpacts = {
          energy: 0.05, // 5% of baseline
          water: 0.02, // 2% of baseline
          transport: 0.1, // 10% of baseline
          food: 0.03, // 3% of baseline
          waste: 0.01, // 1% of baseline
          lifestyle: 0.01, // 1% of baseline
          daily: 0.01, // 1% of baseline
          other: 0.01, // 1% of baseline
        };
        const categoryImpact = categoryImpacts[category as keyof typeof categoryImpacts] || 0.01;
        return Math.round(baseline * categoryImpact);
      };

      // Extract years and convert ML predictions to per-person kg
      const yearArray = mlPredictions.slice(0, years).map((p) => p.year);
      const baselineProgression = mlPredictions.slice(0, years).map((p) => {
        const emissionMt = Number(
          (p.predicted_emission_mt as any)?.predicted_emission_mt ?? p.predicted_emission_mt ?? 0,
        );
        // Convert Mt to per-person kg: (Mt * 1,000,000,000 kg) / population
        return Math.round((emissionMt * 1000000000) / statePopulation);
      });

      // Calculate total pledge reduction using personal quiz baseline if available
      const personalBaselineForSavings =
        quizData && quizData.totals && quizData.totals.totalKgYear
          ? quizData.totals.totalKgYear
          : baselineProgression[0];

      let totalPledgeReductionKgPerYear = 0;
      for (const pledge of pledges) {
        const title = (pledge as any).title?.toLowerCase() || "";
        const category = (pledge as any).category?.toLowerCase() || "other";
        const savingsPerPledge = calculatePledgeImpact(title, category, personalBaselineForSavings);
        totalPledgeReductionKgPerYear += savingsPerPledge;
      }

      // Calculate withPledges using time-decaying pledge effectiveness from database
      const withPledgesProgression = baselineProgression.map((baseline, yearIndex) => {
        let yearlyPledgeReduction = 0;

        // Calculate pledge reduction for this specific year (with decay)
        for (const pledge of pledges) {
          const title = (pledge as any).title?.toLowerCase() || "";
          const category = (pledge as any).category?.toLowerCase() || "other";

          // Use personal quiz baseline for savings calculation, not ML baseline
          let baseSavingsPerPledge = calculatePledgeImpact(
            title,
            category,
            personalBaselineForSavings,
          );

          // Apply decay rate: effectiveness decreases over time (2-3% per year)
          const decayRate = category === "transport" ? 0.01 : 0.025; // Transport habits more stable
          const decayFactor = Math.pow(1 - decayRate, yearIndex);
          const yearlyReduction = baseSavingsPerPledge * decayFactor;
          yearlyPledgeReduction += yearlyReduction;
        }

        return Math.max(0, baseline - Math.round(yearlyPledgeReduction));
      });

      // Calculate current baseline for metadata
      const currentBaseline = baselineProgression[0] || 15200;
      const totalBaselineReduction =
        baselineProgression[baselineProgression.length - 1] - currentBaseline;
      const totalPledgeReduction = Math.round(totalPledgeReductionKgPerYear * years);

      // Use personal quiz savings if available, otherwise use ML-based savings
      const currentSaved = personalSavingsPerYear || Math.round(totalPledgeReductionKgPerYear);
      const currentWithPledges = currentBaseline - currentSaved;

      return {
        years: yearArray,
        baseline: baselineProgression,
        withPledges: withPledgesProgression,
        unit: "kg CO2-e per year",
        timestamp: new Date().toISOString(),
        currentBaseline,
        currentWithPledges,
        currentSaved,
        metadata: {
          state,
          pledgesCount: pledges.length,
          forecastYears: years,
          totalBaselineReduction: Math.round(totalBaselineReduction),
          totalPledgeReduction: Math.round(totalPledgeReduction),
          source: personalSavingsPerYear ? "quiz" : "ml",
        },
      };
    }
  } catch (error) {
    console.error("⚠️  ML predictions unavailable, using fallback calculation:", error);
  }

  // 🔄 Fallback: Use calculated baseline if ML predictions are unavailable
  console.log(`⚠️  Using fallback calculation for ${state}`);
  const currentBaseline = await calculateBaselineEmissions(userId, state);

  // Generate year array
  const currentYear = new Date().getFullYear();
  const yearArray = Array.from({ length: years }, (_, i) => currentYear + i + 1);

  // Calculate baseline progression (with growth)
  const baselineProgression = yearArray.map((year, index) => {
    const yearsFromNow = index + 1;
    return Math.round(currentBaseline * Math.pow(1 + BASELINE_GROWTH_RATE, yearsFromNow));
  });

  // Calculate pledge impact over time using database pledges
  const pledgeImpactsByYear = yearArray.map((year, index) => {
    const yearsFromNow = index + 1;
    let totalPledgeReduction = 0;

    for (const pledge of pledges) {
      const title = (pledge as any).title?.toLowerCase() || "";
      const category = (pledge as any).category?.toLowerCase() || "other";
      let baseSavingsPerPledge = 300; // default

      // Use intelligent calculation based on pledge title (same logic as above)
      if (title.includes("led") || title.includes("bulb") || title.includes("light")) {
        baseSavingsPerPledge = Math.round(currentBaseline * 0.12 * 0.75);
      } else if (
        title.includes("air-dry") ||
        title.includes("laundry") ||
        title.includes("dryer")
      ) {
        baseSavingsPerPledge = Math.round(currentBaseline * 0.08);
      } else if (title.includes("shower") || title.includes("water")) {
        baseSavingsPerPledge = Math.round(currentBaseline * 0.15);
      } else if (title.includes("bottle") || title.includes("water")) {
        baseSavingsPerPledge = 150;
      } else {
        // Fallback to category-based calculation
        switch (category) {
          case "transport":
            baseSavingsPerPledge = Math.round(currentBaseline * 0.1);
            break;
          case "energy":
            baseSavingsPerPledge = Math.round(currentBaseline * 0.05);
            break;
          case "food":
            baseSavingsPerPledge = 400;
            break;
          case "water":
            baseSavingsPerPledge = Math.round(currentBaseline * 0.08);
            break;
          case "lifestyle":
            baseSavingsPerPledge = 150;
            break;
          case "daily":
            baseSavingsPerPledge = 150;
            break;
          case "waste":
            baseSavingsPerPledge = 200;
            break;
        }
      }

      // Apply decay rate: effectiveness decreases over time (2-3% per year)
      const decayRate = category === "transport" ? 0.01 : 0.025; // Transport habits more stable
      const decayFactor = Math.pow(1 - decayRate, yearsFromNow - 1);
      const yearlyReduction = baseSavingsPerPledge * decayFactor;
      totalPledgeReduction += yearlyReduction;
    }

    return Math.round(totalPledgeReduction);
  });

  // Calculate withPledges progression
  const withPledgesProgression = yearArray.map((_, index) => {
    const baseline = baselineProgression[index];
    const pledgeReduction = pledgeImpactsByYear[index];
    return Math.max(0, baseline - pledgeReduction);
  });

  // Calculate totals for metadata
  const totalBaselineReduction =
    baselineProgression[baselineProgression.length - 1] - currentBaseline;
  const totalPledgeReduction = pledgeImpactsByYear.reduce((sum, reduction) => sum + reduction, 0);

  // Use personal quiz savings if available, otherwise use fallback savings
  const fallbackSaved = Math.round(pledgeImpactsByYear[0]);
  const currentSaved =
    quizData && quizData.totals && quizData.totals.totalKgYear
      ? (() => {
          // Recalculate personal savings for fallback case
          const calculatePledgeImpact = (
            title: string,
            category: string,
            baseline: number,
          ): number => {
            if (title.includes("led") || title.includes("bulb") || title.includes("light")) {
              return Math.round(baseline * 0.09);
            }
            if (title.includes("air-dry") || title.includes("laundry") || title.includes("dryer")) {
              return Math.round(baseline * 0.08);
            }
            if (title.includes("shower")) {
              return Math.round(baseline * 0.03);
            }
            if (title.includes("water")) {
              return Math.round(baseline * 0.01);
            }
            if (title.includes("bike") || title.includes("cycling")) {
              return Math.round(baseline * 0.12);
            }
            if (title.includes("walk") || title.includes("walking")) {
              return Math.round(baseline * 0.08);
            }
            const categoryImpacts = {
              energy: 0.05,
              water: 0.02,
              transport: 0.1,
              food: 0.03,
              waste: 0.01,
              lifestyle: 0.01,
              daily: 0.01,
              other: 0.01,
            };
            const categoryImpact =
              categoryImpacts[category as keyof typeof categoryImpacts] || 0.01;
            return Math.round(baseline * categoryImpact);
          };

          let personalSavings = 0;
          for (const pledge of pledges) {
            const title = (pledge as any).title?.toLowerCase() || "";
            const category = (pledge as any).category?.toLowerCase() || "other";
            personalSavings += calculatePledgeImpact(title, category, quizData.totals.totalKgYear);
          }
          return personalSavings;
        })()
      : fallbackSaved;

  const currentWithPledges = currentBaseline - currentSaved;

  return {
    years: yearArray,
    baseline: baselineProgression,
    withPledges: withPledgesProgression,
    unit: "kg CO2-e per year",
    timestamp: new Date().toISOString(),
    currentBaseline,
    currentWithPledges,
    currentSaved,
    metadata: {
      state,
      pledgesCount: pledges.length,
      forecastYears: years,
      totalBaselineReduction: Math.round(totalBaselineReduction),
      totalPledgeReduction: Math.round(totalPledgeReduction),
      source: quizData && quizData.totals && quizData.totals.totalKgYear ? "quiz" : "fallback",
    },
  };
}
