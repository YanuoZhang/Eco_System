// Emissions routes

import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { EmissionsCalculationRequest, EmissionsCalculationResponse } from "../types";
import {
  calculateTotalEmissions,
  getDbElectricityFactorKgPerKwh,
  getDbGasFactorKgPerGJ,
  getDbCarKgPerKm,
} from "../services/emissionsService";
import { EMISSIONS_FACTORS } from "../utils/emissions";
import { requireUser } from "../middleware/auth";
import { UserPledgesService } from "../services/userPledgesService";
import { PledgesService } from "../services/pledgesService";
import { calculateBaselineEmissions, calculateSavedEmissions, generateMultiYearForecast } from "../services/emissionsService";

const router = Router();

// GET /api/emissions?state=VIC&range=10y - Now using real database data
router.get("/", async (req: Request, res: Response) => {
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

// POST /api/emissions/calculate
router.post("/calculate", async (req: Request, res: Response) => {
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

    // Load DB-backed factors if available
    const [dbElec, dbGas] = await Promise.all([
      getDbElectricityFactorKgPerKwh(requestData.state),
      getDbGasFactorKgPerGJ(requestData.state),
    ]);

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
    }

    const { totalEmissions, breakdown } = await calculateTotalEmissions(
      requestData.energy,
      requestData.transport,
      requestData.state,
    );

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

// GET /api/emissions/factors
router.get("/factors", async (req: Request, res: Response) => {
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
      electricity:
        dbElec ??
        (EMISSIONS_FACTORS.electricity[state as keyof typeof EMISSIONS_FACTORS.electricity] ||
          0.75),
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
router.get("/supported-units", (_req: Request, res: Response) => {
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

export default router;

// In-memory per-user cache and rate limit tracker
const comparisonCache = new Map<string, { data: any; expiresAt: number }>();
const lastRequestAt = new Map<string, number>();

// GET /api/emissions/comparison
router.get("/comparison", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const state = (req.query.state as string) || "VIC"; // optional, default VIC

    // Rate limit: 1 request per 10s per user
    const now = Date.now();
    const prev = lastRequestAt.get(userId) || 0;
    if (now - prev < 10_000) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Please wait before requesting emissions comparison again",
        retryAfterSeconds: Math.ceil((10_000 - (now - prev)) / 1000),
        timestamp: new Date().toISOString(),
      });
    }
    lastRequestAt.set(userId, now);

    // Cache lookup
    const key = `${userId}:${state}`;
    const cached = comparisonCache.get(key);
    if (cached && cached.expiresAt > now) {
      return res.json({ ...cached.data, cached: true });
    }

    // Retrieve user pledges and estimate annual CO2 reduction
    const pledges = UserPledgesService.list(userId);
    // Simple heuristic: parse numbers like "Reduce 300kg CO2/year" if present on pledge
    // Falls back to a small per-pledge constant if metadata missing
    let pledgedKgPerYearReduction = 0;
    for (const p of pledges) {
      const meta = p as any;
      const text: string | undefined = meta?.estimatedCO2Reduction || meta?.co2 || meta?.impact;
      if (text) {
        const m = String(text).match(/(\d+(?:\.\d+)?)\s*(kg|t)/i);
        if (m) {
          const val = parseFloat(m[1]);
          const unit = m[2].toLowerCase();
          pledgedKgPerYearReduction += unit === "t" ? val * 1000 : val;
          continue;
        }
      }
      pledgedKgPerYearReduction += 50; // default 50 kg/year if not specified
    }

    const baseline = await calculateBaselineEmissions(userId, state);
    const withPledges = Math.max(0, baseline - Math.round(pledgedKgPerYearReduction));
    const saved = calculateSavedEmissions(baseline, withPledges);

    const response = {
      baseline,
      withPledges,
      saved,
      unit: "kg CO2-e per year",
      timestamp: new Date().toISOString(),
      metadata: {
        state,
        pledgesCount: pledges.length,
        pledgedKgPerYearReduction: Math.round(pledgedKgPerYearReduction),
      },
    };

    // Cache for 10s
    comparisonCache.set(key, { data: response, expiresAt: Date.now() + 10_000 });

    return res.json(response);
  } catch (error) {
    console.error("Error in emissions comparison:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to compute emissions comparison",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/emissions/by-pledge - per-pledge estimated annual CO2 savings
router.get("/by-pledge", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    // Fetch user's saved pledges (in-memory backing with file persistence)
    const userPledges = UserPledgesService.list(userId);

    if (!userPledges.length) {
      return res.json([]);
    }

    // Aggregate savings by pledge title
    const savingsByName = new Map<string, number>();

    for (const up of userPledges) {
      const pledge = await PledgesService.getPledgeById(up.pledgeId);
      // Skip if pledge definition not found
      if (!pledge) continue;

      const name = pledge.title || up.title || up.pledgeId;

      // Try to parse estimatedCO2Reduction like "Reduce 300kg CO2/year" or "300 kg"
      let savingKg = 0;
      if (pledge.estimatedCO2Reduction) {
        const m = String(pledge.estimatedCO2Reduction).match(/(\d+(?:\.\d+)?)\s*(kg|t)/i);
        if (m) {
          const val = parseFloat(m[1]);
          const unit = m[2].toLowerCase();
          savingKg = unit === "t" ? val * 1000 : val;
        }
      }

      // Fallback coefficients by category if not specified
      if (!savingKg) {
        const category = pledge.category || "default";
        const fallback: Record<string, number> = {
          energy: 120, // e.g., LED bulbs or thermostat tweaks
          transport: 350, // e.g., public transport / cycling
          lifestyle: 90, // e.g., cold-wash laundry / reduce food waste
          default: 100,
        };
        savingKg = fallback[category] ?? fallback.default;
      }

      // Aggregate duplicates by summing
      savingsByName.set(name, (savingsByName.get(name) || 0) + Math.round(savingKg));
    }

    const result = Array.from(savingsByName.entries()).map(([name, saving]) => ({ name, saving }));
    return res.json(result);
  } catch (error) {
    console.error("Error generating per-pledge savings:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to compute per-pledge savings",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/emissions/forecast-multiyear
router.get("/forecast-multiyear", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const state = (req.query.state as string) || "VIC"; // optional, default VIC
    const years = parseInt((req.query.years as string) || "5", 10); // optional, default 5

    // Validate years parameter
    if (years < 1 || years > 10) {
      return res.status(400).json({
        error: "Invalid years parameter",
        message: "Years must be between 1 and 10",
        timestamp: new Date().toISOString(),
      });
    }

    // Rate limit: 1 request per 30s per user (longer than comparison due to complexity)
    const now = Date.now();
    const prev = lastRequestAt.get(userId) || 0;
    if (now - prev < 30_000) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Please wait before requesting multi-year forecast again",
        retryAfterSeconds: Math.ceil((30_000 - (now - prev)) / 1000),
        timestamp: new Date().toISOString(),
      });
    }
    lastRequestAt.set(userId, now);

    // Generate forecast
    const forecast = await generateMultiYearForecast(userId, state, years);

    return res.json(forecast);
  } catch (error) {
    console.error("Error in multi-year emissions forecast:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate multi-year forecast",
      timestamp: new Date().toISOString(),
    });
  }
});
