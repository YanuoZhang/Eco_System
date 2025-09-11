import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";
import { pool, testConnection } from "./config/database";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5001;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "EcoPath Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/healthz",
      energyMix: "/api/energy-mix?state=VIC",
      emissions: "/api/emissions?state=VIC&range=10y",
      states: "/api/states",
      climateTargets: "/api/climate-targets?state=VIC",
      emissionsFactors: "/api/emissions/factors?state=VIC",
      supportedUnits: "/api/emissions/supported-units",
      calculateEmissions: "/api/emissions/calculate",
    },
  });
});

// Test database connection on startup
app.get("/healthz", async (_req: Request, res: Response) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({
      status: "ok",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/environment", (_req: Request, res: Response) => {
  res.json({ env: process.env.NODE_ENV || "development" });
});

// GET /api/energy-mix?state=VIC - Now using real database data
app.get("/api/energy-mix", async (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    if (!stateParam) {
      return res
        .status(400)
        .json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }

    // Query real data from database (no trend calculation due to limited historical data)
    const query = `
      SELECT 
        energy_type,
        ROUND(AVG(generation_gwh), 2) as generation_gwh,
        ROUND(AVG(generation_gwh) * 100.0 / SUM(AVG(generation_gwh)) OVER (), 2) as percentage
      FROM generation_mix 
      WHERE state_id = $1 
      GROUP BY energy_type
      ORDER BY generation_gwh DESC
    `;
    const result = await pool.query(query, [stateParam]);

    if (result.rows.length === 0) {
      // Check if state exists in the state table
      const stateCheck = await pool.query(
        "SELECT state_name FROM state WHERE state_id = $1 AND is_aggregate = FALSE",
        [stateParam],
      );

      if (stateCheck.rows.length === 0) {
        return res.status(404).json({ error: `State '${stateParam}' not found` });
      } else {
        // State exists but no generation data available
        return res.status(404).json({
          error: `No generation data available for ${stateCheck.rows[0].state_name}`,
          state: stateParam,
          stateName: stateCheck.rows[0].state_name,
        });
      }
    }

    const data = result.rows.map((row) => ({
      source: row.energy_type,
      percentage: Math.round(row.percentage),
      generation: row.generation_gwh,
    }));

    return res.json(data);
  } catch (error) {
    console.error("Error fetching energy mix data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/emissions?state=VIC&range=10y - Now using real database data
app.get("/api/emissions", async (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    const rangeParam = String(req.query.range || "all");

    // Validate state parameter
    if (!stateParam) {
      return res.status(400).json({
        error: "Missing required query param 'state' (e.g., ?state=VIC&range=10y)",
      });
    }

    // Validate range parameter
    const validRanges = ["5y", "10y", "all"];
    if (!validRanges.includes(rangeParam)) {
      return res.status(400).json({
        error: `Invalid range parameter. Must be one of: ${validRanges.join(", ")}`,
      });
    }

    // Build query based on range
    let query = `
      SELECT year, emissions_mt as value
      FROM emission_total 
      WHERE state_id = $1
    `;

    const params = [stateParam];

    if (rangeParam === "5y") {
      query += " AND year >= EXTRACT(YEAR FROM CURRENT_DATE) - 5";
    } else if (rangeParam === "10y") {
      query += " AND year >= EXTRACT(YEAR FROM CURRENT_DATE) - 10";
    }

    query += " ORDER BY year ASC";

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No emissions data found for state '${stateParam}'` });
    }

    const data = result.rows.map((row) => ({ year: row.year, value: row.value }));
    const latest = data.length > 0 ? data[0] : null;

    const response = {
      unit: "Mt CO2-e",
      latest: latest ? { year: latest.year, value: latest.value } : null,
      data: data,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error fetching emissions data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/climate-targets?state=VIC - Get climate targets and progress for a state
app.get("/api/climate-targets", async (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    if (!stateParam) {
      return res
        .status(400)
        .json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }

    // Query climate targets from database
    const targetsQuery = `
      SELECT 
        si.target_year,
        si.baseline_year,
        si.target_value_pct,
        si.notes,
        s.state_name
      FROM state_initiatives si
      JOIN state s ON si.state_id = s.state_id
      WHERE si.state_id = $1
      ORDER BY si.target_year ASC
    `;

    const targetsResult = await pool.query(targetsQuery, [stateParam]);

    if (targetsResult.rows.length === 0) {
      return res.status(404).json({ error: `No climate targets found for state '${stateParam}'` });
    }

    // Get latest emissions data to calculate progress
    const emissionsQuery = `
      SELECT 
        year,
        emissions_mt
      FROM emission_total 
      WHERE state_id = $1
      ORDER BY year DESC
      LIMIT 1
    `;

    const emissionsResult = await pool.query(emissionsQuery, [stateParam]);
    const latestEmissions = emissionsResult.rows[0];

    // Get baseline emissions for progress calculation
    const baselineQuery = `
      SELECT 
        year,
        emissions_mt
      FROM emission_total 
      WHERE state_id = $1 AND year = $2
    `;

    // Helper to coerce DB value to number, stripping any non-numeric chars like "%"
    const toNumber = (value: unknown): number => {
      if (typeof value === "number") return value;
      const n = parseFloat(String(value).replace(/[^0-9+\-.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    const targets = targetsResult.rows.map((target) => {
      let progress = 0;
      let progressDescription = "No baseline data available";

      if (latestEmissions) {
        // Get baseline emissions for this target
        return pool
          .query(baselineQuery, [stateParam, target.baseline_year])
          .then((baselineResult) => {
            const baselineEmissions = baselineResult.rows[0];

            if (baselineEmissions && latestEmissions) {
              // Calculate progress: (baseline - current) / baseline * 100
              const reduction =
                ((baselineEmissions.emissions_mt - latestEmissions.emissions_mt) /
                  baselineEmissions.emissions_mt) *
                100;
              progress = Math.max(0, Math.round(reduction * 10) / 10); // Round to 1 decimal place
              progressDescription = `Achieved: ${progress}%`;
            }

            return {
              targetYear: target.target_year,
              baselineYear: target.baseline_year,
              targetValuePct: toNumber(target.target_value_pct),
              planName: `${target.state_name} ${target.target_year} Climate Target`,
              progress: progress,
              progressDescription: progressDescription,
              latestEmissions: latestEmissions
                ? {
                    year: latestEmissions.year,
                    value: latestEmissions.emissions_mt,
                  }
                : null,
              notes: target.notes,
            };
          });
      } else {
        return {
          targetYear: target.target_year,
          baselineYear: target.baseline_year,
          targetValuePct: toNumber(target.target_value_pct),
          planName: `${target.state_name} ${target.target_year} Climate Target`,
          progress: 0,
          progressDescription: "No emissions data available",
          latestEmissions: null,
          notes: target.notes,
        };
      }
    });

    // Wait for all promises to resolve
    const resolvedTargets = await Promise.all(targets);

    // Return the primary target (usually 2030) or the first one
    const primaryTarget = resolvedTargets.find((t) => t.targetYear === 2030) || resolvedTargets[0];

    return res.json(primaryTarget);
  } catch (error) {
    console.error("Error fetching climate targets data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/states - Get all available states that have energy data
app.get("/api/states", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT
        s.state_id,
        s.state_name,
        s.abbrev,
        s.is_aggregate
      FROM state s
      INNER JOIN generation_mix gm ON s.state_id = gm.state_id
      WHERE s.is_aggregate = FALSE
      ORDER BY s.state_name ASC
    `;

    const result = await pool.query(query);

    const states = result.rows.map((row) => ({
      id: row.state_id,
      name: row.state_name,
      abbreviation: row.abbrev,
      displayName: `${row.state_name} (${row.abbrev})`,
    }));

    return res.json(states);
  } catch (error) {
    console.error("Error fetching states data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Emissions Calculator API
// Types for emissions calculation
interface EnergyData {
  electricity?: number; // kWh
  gas?: number; // MJ or kWh equivalent
  timeUnit: "month" | "quarter" | "year";
}

interface TransportData {
  mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
  distance: number; // km
  timeUnit: "day" | "week" | "month" | "year";
  frequency?: number; // trips per time unit
}

interface EmissionsCalculationRequest {
  energy?: EnergyData;
  transport?: TransportData;
  state: string; // For energy mix calculations
}

interface EmissionsCalculationResponse {
  totalEmissions: number; // kg CO2-e
  breakdown: {
    energy?: {
      electricity: number;
      gas: number;
      total: number;
    };
    transport?: {
      [key: string]: number; // mode-specific emissions
      total: number;
    };
  };
  timeUnit: string;
  calculationDate: string;
}

// Emissions factors (kg CO2-e per unit)
// Fixed combustion factor for natural gas Scope 1 (kg CO2-e per GJ)
const GAS_SCOPE1_KG_PER_GJ = 51.5;
const EMISSIONS_FACTORS = {
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
function convertToAnnual(value: number, timeUnit: string): number {
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
function getElectricityEmissionsFactor(state: string): number {
  return EMISSIONS_FACTORS.electricity[state as keyof typeof EMISSIONS_FACTORS.electricity] || 0.75;
}

// DB-backed factors helpers
async function getDbElectricityFactorKgPerKwh(state: string): Promise<number | null> {
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

async function getDbGasFactorKgPerGJ(state: string): Promise<number | null> {
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
      return scope3Num + GAS_SCOPE1_KG_PER_GJ;
    }
    return null;
  } catch {
    return null;
  }
}

type FactorOverrides = {
  electricityKgPerKwh?: number | null;
  gasKgPerGJ?: number | null;
};

// Calculate emissions from energy usage (optionally with DB-backed factors)
function calculateEnergyEmissions(energy: EnergyData, state: string, overrides?: FactorOverrides) {
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

// Calculate emissions from transport
// Attempt to compute car emissions using DB fuel economy when available
async function getDbCarKgPerKm(state: string): Promise<number | null> {
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

async function calculateTransportEmissions(transport: TransportData, state: string) {
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

// POST /api/emissions/calculate
app.post("/api/emissions/calculate", async (req: Request, res: Response) => {
  try {
    const requestData: EmissionsCalculationRequest = req.body;

    // Validate required fields
    if (!requestData.state) {
      return res.status(400).json({
        error: "Missing required field 'state'",
        message: "Please provide your state for accurate emissions calculations",
      });
    }

    if (!requestData.energy && !requestData.transport) {
      return res.status(400).json({
        error: "Missing data",
        message: "Please provide either energy or transport data (or both) for calculation",
      });
    }

    // Validate state
    const validStates = Object.keys(EMISSIONS_FACTORS.electricity);
    if (!validStates.includes(requestData.state)) {
      return res.status(400).json({
        error: "Invalid state",
        message: `Unsupported state '${requestData.state}'. Supported states: ${validStates.join(", ")}`,
        supportedStates: validStates,
      });
    }

    let totalEmissions = 0;
    const breakdown: any = {};

    // Load DB-backed factors if available
    const [dbElec, dbGas] = await Promise.all([
      getDbElectricityFactorKgPerKwh(requestData.state),
      getDbGasFactorKgPerGJ(requestData.state),
    ]);
    const overrides: FactorOverrides = {
      electricityKgPerKwh: dbElec ?? undefined,
      gasKgPerGJ: dbGas ?? undefined,
    };

    // Calculate energy emissions if provided
    if (requestData.energy) {
      // Strict requirement: if user provided electricity, we must have DB electricity factor
      if (requestData.energy.electricity != null && dbElec == null) {
        return res.status(424).json({
          error: "Missing data",
          message: `No electricity emissions factor found in database for state '${requestData.state}'.`,
          state: requestData.state,
          missing: ["electricity_factor_by_state"],
        });
      }
      // Strict requirement: if user provided gas, we must have DB gas factor
      if (requestData.energy.gas != null && dbGas == null) {
        return res.status(424).json({
          error: "Missing data",
          message: `No gas emissions factor found in database for state '${requestData.state}'.`,
          state: requestData.state,
          missing: ["gas_factor_by_state"],
        });
      }
      const energyEmissions = calculateEnergyEmissions(
        requestData.energy,
        requestData.state,
        overrides,
      );
      breakdown.energy = energyEmissions;
      totalEmissions += energyEmissions.total;
    }

    // Calculate transport emissions if provided
    if (requestData.transport) {
      // Strict requirement for car mode: must have DB fuel economy
      if (requestData.transport.mode === "car") {
        const dbCar = await getDbCarKgPerKm(requestData.state);
        if (dbCar == null) {
          return res.status(424).json({
            error: "Missing data",
            message: `No fuel economy data found in database for state '${requestData.state}'.`,
            state: requestData.state,
            missing: ["fuel_economy_raw"],
          });
        }
      } else if (["bus", "train", "tram"].includes(requestData.transport.mode)) {
        // For electric transport modes, we need electricity factor from database
        const electricityFactor = await getDbElectricityFactorKgPerKwh(requestData.state);
        if (electricityFactor == null) {
          return res.status(424).json({
            error: "Missing data",
            message: `No electricity emissions factor found in database for state '${requestData.state}' to calculate electric transport emissions.`,
            state: requestData.state,
            mode: requestData.transport.mode,
            missing: ["electricity_factor_by_state"],
          });
        }
      }
      const transportEmissions = await calculateTransportEmissions(
        requestData.transport,
        requestData.state,
      );
      breakdown.transport = transportEmissions;
      totalEmissions += transportEmissions.total;
    }

    // Determine overall time unit for response
    let responseTimeUnit = "year";
    if (requestData.energy) {
      responseTimeUnit = requestData.energy.timeUnit;
    } else if (requestData.transport) {
      responseTimeUnit = requestData.transport.timeUnit;
    }

    // Only include breakdown sections that were actually calculated
    const filteredBreakdown: any = {};
    if (requestData.energy && breakdown.energy) {
      filteredBreakdown.energy = breakdown.energy;
    }
    if (requestData.transport && breakdown.transport) {
      filteredBreakdown.transport = breakdown.transport;
    }

    const response: EmissionsCalculationResponse = {
      totalEmissions: Math.round(totalEmissions * 100) / 100, // Round to 2 decimal places
      breakdown: filteredBreakdown,
      timeUnit: responseTimeUnit,
      calculationDate: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error in emissions calculation:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while calculating emissions. Please try again.",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/emissions/state-average
app.get("/api/emissions/state-average", async (req: Request, res: Response) => {
  try {
    const state = (req.query.state as string) || "";
    const year = parseInt((req.query.year as string) || "2023");

    if (!state) {
      return res.status(400).json({
        error: "Missing state parameter",
        message: "Please provide a state code (e.g., VIC, NSW, QLD)",
      });
    }

    // Get state emissions and population for the year
    const emissionsQuery = `
      SELECT emissions_mt 
      FROM emission_total 
      WHERE state_id = $1 AND year = $2
    `;

    const populationQuery = `
      SELECT population 
      FROM population 
      WHERE state_id = $1 AND year = $2
    `;

    const [emissionsResult, populationResult] = await Promise.all([
      pool.query(emissionsQuery, [state, year]),
      pool.query(populationQuery, [state, year]),
    ]);

    if (
      emissionsResult.rows.length === 0 ||
      populationResult.rows.length === 0 ||
      !emissionsResult.rows[0].emissions_mt ||
      !populationResult.rows[0].population
    ) {
      return res.status(404).json({
        error: "Data not found",
        message: `No data available for state ${state} in year ${year}`,
        state,
        year,
      });
    }

    const totalEmissionsMt = emissionsResult.rows[0].emissions_mt;
    const totalPopulation = populationResult.rows[0].population;

    // Calculate per capita emissions in tonnes CO2-e
    const perCapitaEmissionsTonnes = (totalEmissionsMt * 1000000) / totalPopulation; // Convert Mt to tonnes

    res.json({
      state,
      year,
      totalEmissionsMt: Math.round(totalEmissionsMt * 100) / 100,
      totalPopulation,
      perCapitaEmissionsTonnes: Math.round(perCapitaEmissionsTonnes * 10) / 10,
      dataSource: "Australian Government emissions and population data",
    });
  } catch (error) {
    console.error("Error fetching state average:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch state average emissions data",
    });
  }
});

// GET /api/emissions/australian-average
app.get("/api/emissions/australian-average", async (req: Request, res: Response) => {
  try {
    const year = parseInt((req.query.year as string) || "2023");

    // Calculate Australian total emissions and population by aggregating all states
    const emissionsQuery = `
      SELECT SUM(emissions_mt) as total_emissions_mt
      FROM emission_total 
      WHERE year = $1 AND state_id != 'AUS'
    `;

    const populationQuery = `
      SELECT SUM(population) as total_population
      FROM population 
      WHERE year = $1 AND state_id != 'AUS'
    `;

    const [emissionsResult, populationResult] = await Promise.all([
      pool.query(emissionsQuery, [year]),
      pool.query(populationQuery, [year]),
    ]);

    if (
      emissionsResult.rows.length === 0 ||
      populationResult.rows.length === 0 ||
      !emissionsResult.rows[0].total_emissions_mt ||
      !populationResult.rows[0].total_population
    ) {
      return res.status(404).json({
        error: "Data not found",
        message: `No data available for Australian average in year ${year}`,
        year,
      });
    }

    const totalEmissionsMt = emissionsResult.rows[0].total_emissions_mt;
    const totalPopulation = populationResult.rows[0].total_population;

    // Calculate per capita emissions in tonnes CO2-e
    const perCapitaEmissionsTonnes = (totalEmissionsMt * 1000000) / totalPopulation; // Convert Mt to tonnes

    res.json({
      year,
      totalEmissionsMt: Math.round(totalEmissionsMt * 100) / 100,
      totalPopulation,
      perCapitaEmissionsTonnes: Math.round(perCapitaEmissionsTonnes * 10) / 10,
      dataSource: "Australian Government emissions and population data (aggregated from states)",
    });
  } catch (error) {
    console.error("Error fetching Australian average:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch Australian average emissions data",
    });
  }
});

// GET /api/emissions/factors
app.get("/api/emissions/factors", async (req: Request, res: Response) => {
  try {
    const state = (req.query.state as string) || "";

    if (!state) {
      return res.status(400).json({
        error: "Missing state parameter",
        message: "Please provide a state parameter to get emissions factors",
      });
    }

    const validStates = Object.keys(EMISSIONS_FACTORS.electricity);
    if (!validStates.includes(state)) {
      return res.status(400).json({
        error: "Invalid state",
        message: `Unsupported state '${state}'. Supported states: ${validStates.join(", ")}`,
        supportedStates: validStates,
      });
    }

    const [dbElec, dbGas] = await Promise.all([
      getDbElectricityFactorKgPerKwh(state),
      getDbGasFactorKgPerGJ(state),
    ]);

    const factors = {
      state,
      electricity: dbElec ?? getElectricityEmissionsFactor(state),
      // For gas, expose DB native unit kg/GJ if available; keep legacy unit label otherwise
      gas: dbGas ?? EMISSIONS_FACTORS.gas,
      transport: EMISSIONS_FACTORS.transport,
      units: {
        electricity: "kg CO2-e per kWh",
        gas: dbGas != null ? "kg CO2-e per GJ" : "kg CO2-e per kWh equivalent",
        transport: "kg CO2-e per km",
      },
    };

    res.json(factors);
  } catch (error) {
    console.error("Error getting emissions factors:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while retrieving emissions factors. Please try again.",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/emissions/supported-units
app.get("/api/emissions/supported-units", (_req: Request, res: Response) => {
  try {
    const supportedUnits = {
      energy: {
        timeUnits: ["month", "quarter", "year"],
        units: {
          electricity: "kWh",
          gas: "MJ or kWh equivalent",
        },
      },
      transport: {
        timeUnits: ["day", "week", "month", "year"],
        modes: ["car", "bus", "train", "tram", "bicycle", "walking"],
        units: {
          distance: "km",
          frequency: "trips per time unit",
        },
      },
    };

    res.json(supportedUnits);
  } catch (error) {
    console.error("Error getting supported units:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while retrieving supported units. Please try again.",
      timestamp: new Date().toISOString(),
    });
  }
});

// Minimal OpenAPI 3.0 schema
const openapiDoc = {
  openapi: "3.0.3",
  info: { title: "EcoPath API", version: "0.1.0" },
  servers: [{ url: "http://localhost:" + port }],
  paths: {
    "/api/energy-mix": {
      get: {
        summary: "Energy mix by state",
        description:
          "Returns the % share and generation amount by energy source for a given Australian state from real database data.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State code (e.g., VIC, NSW, QLD, SA, TAS, WA).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["source", "percentage", "generation"],
                    properties: {
                      source: {
                        type: "string",
                        enum: [
                          "coal",
                          "gas",
                          "hydro",
                          "wind",
                          "solar",
                          "bioenergy",
                          "distillate",
                          "battery",
                        ],
                      },
                      percentage: { type: "number", format: "float", minimum: 0, maximum: 100 },
                      generation: {
                        type: "number",
                        format: "float",
                        minimum: 0,
                        description: "GWh (Gigawatt hours)",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "Unknown state or no data found" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/emissions": {
      get: {
        summary: "Greenhouse gas emissions by state",
        description:
          "Returns yearly greenhouse gas emissions data for a given Australian state with optional time range filtering from real database data.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State code (e.g., VIC, NSW, QLD, SA, TAS, WA).",
          },
          {
            name: "range",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["5y", "10y", "all"], default: "all" },
            description:
              "Time range filter: 5y (last 5 years), 10y (last 10 years), all (all available data).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["unit", "latest", "data"],
                  properties: {
                    unit: {
                      type: "string",
                      example: "Mt CO2-e",
                      description: "Unit of measurement for emissions values",
                    },
                    latest: {
                      type: "object",
                      nullable: true,
                      properties: {
                        year: { type: "number", example: 2023 },
                        value: { type: "number", format: "float", example: 42.7 },
                      },
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["year", "value"],
                        properties: {
                          year: { type: "number", example: 2023 },
                          value: { type: "number", format: "float", example: 42.7 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing required parameter or invalid range" },
          "404": { description: "Unknown state or no data found" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/climate-targets": {
      get: {
        summary: "Climate targets and progress by state",
        description:
          "Returns climate targets, progress percentage, and related information for a given Australian state from real database data.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State code (e.g., VIC, NSW, QLD, SA, TAS, WA).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "targetYear",
                    "baselineYear",
                    "targetValuePct",
                    "planName",
                    "progress",
                    "progressDescription",
                  ],
                  properties: {
                    targetYear: {
                      type: "number",
                      example: 2030,
                      description: "Target year for the climate goal",
                    },
                    baselineYear: {
                      type: "number",
                      example: 2005,
                      description: "Baseline year for emissions comparison",
                    },
                    targetValuePct: {
                      type: "number",
                      example: 50,
                      description: "Target reduction percentage",
                    },
                    planName: {
                      type: "string",
                      example: "Victoria 2030 Climate Target",
                      description: "Name of the climate plan",
                    },
                    progress: {
                      type: "number",
                      example: 18.5,
                      description: "Current progress percentage achieved",
                    },
                    progressDescription: {
                      type: "string",
                      example: "Achieved: 18.5%",
                      description: "Human-readable progress description",
                    },
                    latestEmissions: {
                      type: "object",
                      nullable: true,
                      properties: {
                        year: { type: "number", example: 2023 },
                        value: { type: "number", format: "float", example: 42.7 },
                      },
                      description: "Latest emissions data used for progress calculation",
                    },
                    notes: {
                      type: "string",
                      example: "Victoria 2030 climate target",
                      description: "Additional notes about the target",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "Unknown state or no climate targets found" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/states": {
      get: {
        summary: "Get all available states",
        description:
          "Returns a list of all available Australian states and territories from the database.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "name", "abbreviation", "displayName"],
                    properties: {
                      id: {
                        type: "string",
                        example: "VIC",
                        description: "State ID code",
                      },
                      name: {
                        type: "string",
                        example: "Victoria",
                        description: "Full state name",
                      },
                      abbreviation: {
                        type: "string",
                        example: "VIC",
                        description: "State abbreviation",
                      },
                      displayName: {
                        type: "string",
                        example: "Victoria (VIC)",
                        description: "Formatted display name",
                      },
                    },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/renewable-growth": {
      get: {
        summary: "Renewable energy growth data by state",
        description:
          "Returns renewable energy growth rates and current generation data for wind, solar, and hydro power.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State name or code (e.g., Victoria, VIC, NSW, QLD).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "state",
                    "renewableData",
                    "totalRenewablePercentage",
                    "totalRenewableGrowth",
                  ],
                  properties: {
                    state: { type: "string", example: "VIC" },
                    renewableData: {
                      type: "array",
                      items: {
                        type: "object",
                        required: [
                          "energyType",
                          "currentGeneration",
                          "previousGeneration",
                          "growthRate",
                        ],
                        properties: {
                          energyType: { type: "string", enum: ["wind", "solar", "hydro"] },
                          currentGeneration: {
                            type: "number",
                            description: "Average generation in GWh (last 6 months)",
                          },
                          previousGeneration: {
                            type: "number",
                            description: "Average generation in GWh (6-12 months ago)",
                          },
                          growthRate: { type: "number", description: "Growth rate percentage" },
                        },
                      },
                    },
                    totalRenewablePercentage: {
                      type: "number",
                      description: "Current renewable energy percentage of total generation",
                    },
                    totalRenewableGrowth: {
                      type: "number",
                      description: "Overall renewable energy growth rate",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "State not found" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/storage-grid": {
      get: {
        summary: "Storage and grid stability data by state",
        description:
          "Returns battery storage, pumped hydro, and grid stability metrics for a given state.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State name or code (e.g., Victoria, VIC, NSW, QLD).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["state", "batteryStorage", "pumpedHydro", "gridStability"],
                  properties: {
                    state: { type: "string", example: "VIC" },
                    batteryStorage: {
                      type: "object",
                      required: [
                        "averageGeneration",
                        "maxGeneration",
                        "minGeneration",
                        "capacityEstimate",
                      ],
                      properties: {
                        averageGeneration: {
                          type: "number",
                          description: "Average battery generation in GWh",
                        },
                        maxGeneration: {
                          type: "number",
                          description: "Maximum battery generation in GWh",
                        },
                        minGeneration: {
                          type: "number",
                          description: "Minimum battery generation in GWh",
                        },
                        capacityEstimate: {
                          type: "number",
                          description: "Estimated battery capacity in GWh",
                        },
                      },
                    },
                    pumpedHydro: {
                      type: "object",
                      required: [
                        "averageGeneration",
                        "maxGeneration",
                        "minGeneration",
                        "capacityEstimate",
                      ],
                      properties: {
                        averageGeneration: {
                          type: "number",
                          description: "Average hydro generation in GWh",
                        },
                        maxGeneration: {
                          type: "number",
                          description: "Maximum hydro generation in GWh",
                        },
                        minGeneration: {
                          type: "number",
                          description: "Minimum hydro generation in GWh",
                        },
                        capacityEstimate: {
                          type: "number",
                          description: "Estimated hydro capacity in GWh",
                        },
                      },
                    },
                    gridStability: {
                      type: "object",
                      required: ["reliability", "averageDailyGeneration", "generationVariability"],
                      properties: {
                        reliability: { type: "number", description: "Grid reliability percentage" },
                        averageDailyGeneration: {
                          type: "number",
                          description: "Average daily generation in GWh",
                        },
                        generationVariability: {
                          type: "number",
                          description: "Generation variability (standard deviation)",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "State not found" },
          "500": { description: "Internal server error" },
        },
      },
    },

    "/api/emissions/calculate": {
      post: {
        summary: "Calculate total emissions based on energy and transport data",
        description:
          "Calculates the total greenhouse gas emissions (CO2-e) based on energy usage and transport activities for a given state.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["state"],
                properties: {
                  energy: {
                    type: "object",
                    properties: {
                      electricity: {
                        type: "number",
                        description: "Electricity usage in kWh",
                        example: 100,
                      },
                      gas: {
                        type: "number",
                        description: "Gas usage in MJ or kWh equivalent",
                        example: 50,
                      },
                      timeUnit: {
                        type: "string",
                        enum: ["month", "quarter", "year"],
                        description: "Time unit for energy usage",
                        example: "month",
                      },
                    },
                  },
                  transport: {
                    type: "object",
                    properties: {
                      mode: {
                        type: "string",
                        enum: ["car", "bus", "train", "tram", "bicycle", "walking"],
                        description: "Transport mode",
                        example: "car",
                      },
                      distance: {
                        type: "number",
                        description: "Distance traveled in km",
                        example: 10,
                      },
                      timeUnit: {
                        type: "string",
                        enum: ["day", "week", "month", "year"],
                        description: "Time unit for transport",
                        example: "month",
                      },
                      frequency: {
                        type: "number",
                        description: "Number of trips per time unit",
                        example: 1,
                      },
                    },
                  },
                  state: {
                    type: "string",
                    description:
                      "Australian state code (e.g., VIC, NSW, QLD, SA, TAS, WA, ACT, NT)",
                    example: "VIC",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["totalEmissions", "breakdown", "timeUnit", "calculationDate"],
                  properties: {
                    totalEmissions: {
                      type: "number",
                      description: "Total emissions in kg CO2-e",
                      example: 1000,
                    },
                    breakdown: {
                      type: "object",
                      properties: {
                        energy: {
                          type: "object",
                          properties: {
                            electricity: {
                              type: "number",
                              description: "Electricity emissions in kg CO2-e",
                              example: 500,
                            },
                            gas: {
                              type: "number",
                              description: "Gas emissions in kg CO2-e",
                              example: 500,
                            },
                            total: {
                              type: "number",
                              description: "Total energy emissions in kg CO2-e",
                              example: 1000,
                            },
                          },
                        },
                        transport: {
                          type: "object",
                          properties: {
                            car: {
                              type: "number",
                              description: "Car emissions in kg CO2-e",
                              example: 200,
                            },
                            bus: {
                              type: "number",
                              description: "Bus emissions in kg CO2-e",
                              example: 100,
                            },
                            train: {
                              type: "number",
                              description: "Train emissions in kg CO2-e",
                              example: 50,
                            },
                            tram: {
                              type: "number",
                              description: "Tram emissions in kg CO2-e",
                              example: 30,
                            },
                            bicycle: {
                              type: "number",
                              description: "Bicycle emissions in kg CO2-e",
                              example: 0,
                            },
                            walking: {
                              type: "number",
                              description: "Walking emissions in kg CO2-e",
                              example: 0,
                            },
                            total: {
                              type: "number",
                              description: "Total transport emissions in kg CO2-e",
                              example: 1000,
                            },
                          },
                        },
                      },
                    },
                    timeUnit: {
                      type: "string",
                      description: "Time unit for which emissions are calculated",
                      example: "month",
                    },
                    calculationDate: {
                      type: "string",
                      description: "Date of the calculation",
                      example: "2023-10-27T10:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message"],
                  properties: {
                    error: { type: "string", example: "Missing required field 'state'" },
                    message: {
                      type: "string",
                      example: "Please provide your state for accurate emissions calculations",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Unsupported state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "supportedStates"],
                  properties: {
                    error: { type: "string", example: "Invalid state" },
                    message: {
                      type: "string",
                      example:
                        "Unsupported state 'VIC'. Supported states: VIC, NSW, QLD, SA, TAS, WA, ACT, NT",
                    },
                    supportedStates: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Internal server error" },
                    message: {
                      type: "string",
                      example: "An error occurred while calculating emissions. Please try again.",
                    },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/emissions/factors": {
      get: {
        summary: "Get emissions factors for a specific state",
        description:
          "Returns the emissions factors (kg CO2-e per unit) for a given Australian state.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "Australian state code (e.g., VIC, NSW, QLD, SA, TAS, WA, ACT, NT).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["state", "electricity", "gas", "transport", "units"],
                  properties: {
                    state: { type: "string", example: "VIC" },
                    electricity: {
                      type: "number",
                      description: "Emissions factor for electricity (kg CO2-e per kWh)",
                      example: 0.85,
                    },
                    gas: {
                      type: "number",
                      description: "Emissions factor for gas (kg CO2-e per kWh equivalent)",
                      example: 0.18,
                    },
                    transport: {
                      type: "object",
                      properties: {
                        car: {
                          type: "number",
                          description: "Emissions factor for car (kg CO2-e per km)",
                          example: 0.21,
                        },
                        bus: {
                          type: "number",
                          description: "Emissions factor for bus (kg CO2-e per km)",
                          example: 0.08,
                        },
                        train: {
                          type: "number",
                          description: "Emissions factor for train (kg CO2-e per km)",
                          example: 0.04,
                        },
                        tram: {
                          type: "number",
                          description: "Emissions factor for tram (kg CO2-e per km)",
                          example: 0.03,
                        },
                        bicycle: {
                          type: "number",
                          description: "Emissions factor for bicycle (kg CO2-e per km)",
                          example: 0,
                        },
                        walking: {
                          type: "number",
                          description: "Emissions factor for walking (kg CO2-e per km)",
                          example: 0,
                        },
                      },
                    },
                    units: {
                      type: "object",
                      properties: {
                        electricity: { type: "string", example: "kg CO2-e per kWh" },
                        gas: { type: "string", example: "kg CO2-e per kWh equivalent" },
                        transport: { type: "string", example: "kg CO2-e per km" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message"],
                  properties: {
                    error: { type: "string", example: "Missing state parameter" },
                    message: {
                      type: "string",
                      example: "Please provide a state parameter to get emissions factors",
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Unsupported state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "supportedStates"],
                  properties: {
                    error: { type: "string", example: "Invalid state" },
                    message: {
                      type: "string",
                      example:
                        "Unsupported state 'VIC'. Supported states: VIC, NSW, QLD, SA, TAS, WA, ACT, NT",
                    },
                    supportedStates: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Internal server error" },
                    message: {
                      type: "string",
                      example:
                        "An error occurred while retrieving emissions factors. Please try again.",
                    },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/emissions/supported-units": {
      get: {
        summary: "Get supported time units and units for energy and transport",
        description:
          "Returns the supported time units and units for energy (kWh, MJ or kWh equivalent) and transport (km, trips per time unit).",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["energy", "transport"],
                  properties: {
                    energy: {
                      type: "object",
                      properties: {
                        timeUnits: { type: "array", items: { type: "string", example: "month" } },
                        units: {
                          type: "object",
                          properties: {
                            electricity: { type: "string", example: "kWh" },
                            gas: { type: "string", example: "MJ or kWh equivalent" },
                          },
                        },
                      },
                    },
                    transport: {
                      type: "object",
                      properties: {
                        timeUnits: { type: "array", items: { type: "string", example: "month" } },
                        modes: { type: "array", items: { type: "string", example: "car" } },
                        units: {
                          type: "object",
                          properties: {
                            distance: { type: "string", example: "km" },
                            frequency: { type: "string", example: "trips per time unit" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Internal server error" },
                    message: {
                      type: "string",
                      example:
                        "An error occurred while retrieving supported units. Please try again.",
                    },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapiDoc));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiDoc));

// Export app for testing
export { app };

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(port, async () => {
    console.log(`🚀 API server listening on http://localhost:${port}`);
    console.log(`📚 OpenAPI docs available at http://localhost:${port}/docs`);
    console.log(`🔍 OpenAPI spec available at http://localhost:${port}/openapi.json`);

    // Test database connection
    try {
      await testConnection();
    } catch {
      console.warn("⚠️  Database connection failed. Some endpoints may not work properly.");
    }
  });
}
