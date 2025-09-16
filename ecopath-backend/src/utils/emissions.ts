// Emissions calculation utilities

import { EnergyData, FactorOverrides } from "../types";

// Emissions factors (kg CO2-e per unit)
// Fixed combustion factor for natural gas Scope 1 (kg CO2-e per GJ)
export const GAS_SCOPE1_KG_PER_GJ = 51.5;

export const EMISSIONS_FACTORS = {
  // Energy emissions factors (kg CO2-e per kWh)
  electricity: {
    VIC: 0.85, // Victoria has higher coal dependency
    NSW: 0.89, // NSW also coal-heavy
    QLD: 0.92, // Queensland highest coal dependency
    SA: 0.45, // South Australia more renewable
    TAS: 0.12, // Tasmania mostly hydro
    WA: 0.65, // Western Australia mixed
    ACT: 0.45, // ACT similar to SA
    NT: 0.75, // Northern Territory mixed
  },
  gas: 0.18, // kg CO2-e per kWh equivalent

  // Transport emissions factors (kg CO2-e per km)
  transport: {
    car: 0.21, // Average car
    bus: 0.08, // Public bus
    train: 0.04, // Electric train
    tram: 0.03, // Electric tram
    bicycle: 0, // No emissions
    walking: 0, // No emissions
  },
};

// Helper function to convert time units to annual equivalent
export function convertToAnnual(value: number, timeUnit: string): number {
  switch (timeUnit) {
    case "day":
      return value * 365;
    case "week":
      return value * 52;
    case "month":
      return value * 12;
    case "quarter":
      return value * 4;
    case "year":
      return value;
    default:
      return value;
  }
}

// Helper function to get electricity emissions factor for a state
export function getElectricityEmissionsFactor(state: string): number {
  return EMISSIONS_FACTORS.electricity[state as keyof typeof EMISSIONS_FACTORS.electricity] || 0.75;
}

// Calculate emissions from energy usage (optionally with DB-backed factors)
export function calculateEnergyEmissions(
  energy: EnergyData,
  state: string,
  overrides?: FactorOverrides,
) {
  const annualElectricity = energy.electricity
    ? convertToAnnual(energy.electricity, energy.timeUnit)
    : 0;
  const annualGasMJ = energy.gas ? convertToAnnual(energy.gas, energy.timeUnit) : 0;

  const elecFactor = overrides?.electricityKgPerKwh ?? getElectricityEmissionsFactor(state);
  const electricityEmissions = annualElectricity * elecFactor;

  let gasEmissions = 0;
  if (overrides?.gasKgPerGJ != null) {
    // Convert MJ to GJ, then multiply by kg/GJ
    const annualGasGJ = annualGasMJ / 1000;
    gasEmissions = annualGasGJ * overrides.gasKgPerGJ;
  } else {
    // Fallback to legacy constant assuming kWh equivalent
    gasEmissions = annualGasMJ * EMISSIONS_FACTORS.gas; // EMISSIONS_FACTORS.gas interpreted per kWh-eq
  }

  return {
    electricity: electricityEmissions,
    gas: gasEmissions,
    total: electricityEmissions + gasEmissions,
  };
}
