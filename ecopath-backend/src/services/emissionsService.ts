// Emissions calculation service with database integration

import { pool } from "../config/database";
import { EnergyData, TransportData, FactorOverrides } from "../types";
import { calculateEnergyEmissions, EMISSIONS_FACTORS } from "../utils/emissions";
import { UserPledgesService } from "./userPledgesService";

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
  metadata: {
    state: string;
    pledgesCount: number;
    forecastYears: number;
    totalBaselineReduction: number;
    totalPledgeReduction: number;
  };
}

// Pledge impact factors and decay rates over time
const PLEDGE_IMPACT_FACTORS = {
  // Energy category pledges
  energy: {
    baseReduction: 200, // kg CO2-e per year
    decayRate: 0.02, // 2% effectiveness decay per year
    maxYears: 10,
  },
  // Transport category pledges  
  transport: {
    baseReduction: 300, // kg CO2-e per year
    decayRate: 0.01, // 1% effectiveness decay per year (transport habits more stable)
    maxYears: 10,
  },
  // Lifestyle category pledges
  lifestyle: {
    baseReduction: 150, // kg CO2-e per year
    decayRate: 0.03, // 3% effectiveness decay per year (habits may change)
    maxYears: 8,
  },
  // Default for other categories
  default: {
    baseReduction: 100, // kg CO2-e per year
    decayRate: 0.025, // 2.5% effectiveness decay per year
    maxYears: 8,
  },
} as const;

// Baseline emissions growth rate (accounting for population growth, economic factors)
const BASELINE_GROWTH_RATE = 0.015; // 1.5% annual growth

export async function generateMultiYearForecast(
  userId: string,
  state: string,
  forecastYears: number = 5,
): Promise<MultiYearForecast> {
  // Validate forecast years
  const years = Math.min(Math.max(forecastYears, 1), 10);
  
  // Get current baseline
  const currentBaseline = await calculateBaselineEmissions(userId, state);
  
  // Get user pledges and categorize them
  const pledges = UserPledgesService.list(userId);
  
  // Generate year array
  const currentYear = new Date().getFullYear();
  const yearArray = Array.from({ length: years }, (_, i) => currentYear + i + 1);
  
  // Calculate baseline progression (with growth)
  const baselineProgression = yearArray.map((year, index) => {
    const yearsFromNow = index + 1;
    return Math.round(currentBaseline * Math.pow(1 + BASELINE_GROWTH_RATE, yearsFromNow));
  });
  
  // Calculate pledge impact over time for each category
  const pledgeImpactsByYear = yearArray.map((year, index) => {
    const yearsFromNow = index + 1;
    let totalPledgeReduction = 0;
    
    for (const pledge of pledges) {
      // Get pledge category (default to 'default' if not found)
      const category = (pledge as any).category || 'default';
      const factors = PLEDGE_IMPACT_FACTORS[category as keyof typeof PLEDGE_IMPACT_FACTORS] || PLEDGE_IMPACT_FACTORS.default;
      
      // Check if pledge is still effective
      if (yearsFromNow <= factors.maxYears) {
        // Apply decay rate: effectiveness decreases over time
        const decayFactor = Math.pow(1 - factors.decayRate, yearsFromNow - 1);
        const yearlyReduction = factors.baseReduction * decayFactor;
        totalPledgeReduction += yearlyReduction;
      }
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
  const totalBaselineReduction = baselineProgression[baselineProgression.length - 1] - currentBaseline;
  const totalPledgeReduction = pledgeImpactsByYear.reduce((sum, reduction) => sum + reduction, 0);
  
  return {
    years: yearArray,
    baseline: baselineProgression,
    withPledges: withPledgesProgression,
    unit: "kg CO2-e per year",
    timestamp: new Date().toISOString(),
    metadata: {
      state,
      pledgesCount: pledges.length,
      forecastYears: years,
      totalBaselineReduction: Math.round(totalBaselineReduction),
      totalPledgeReduction: Math.round(totalPledgeReduction),
    },
  };
}