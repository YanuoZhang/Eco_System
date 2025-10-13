// Emissions routes

import { Router, Request, Response } from "express";
import { calculatePledgeImpact as unifiedCalculatePledgeImpact } from "../utils/pledgeCalculator";

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
import {
  calculateBaselineEmissions,
  calculateSavedEmissions,
  generateMultiYearForecast,
} from "../services/emissionsService";
// Note: Using database pledges directly instead of pledgeImpacts.ts
import { predictionCache } from "../services/predictionCache";

const router = Router();

// Calculate real baseline emissions using ML predictions (same as forecast API)
async function calculateRealBaselineEmissions(state: string): Promise<number> {
  try {
    // Get ML predictions for the state
    const mlPredictions = await predictionCache.getPredictionsForState(state);

    if (mlPredictions.length > 0) {
      // Get state population
      const popQuery = `
        SELECT population FROM population 
        WHERE state_id = $1 
        ORDER BY year DESC LIMIT 1
      `;
      const popResult = await pool.query(popQuery, [state.toUpperCase()]);
      const statePopulation = popResult.rows[0]?.population
        ? parseInt(String(popResult.rows[0].population))
        : 6700000;

      // Use 2026 prediction (first year)
      const prediction2026 = mlPredictions.find((p) => p.year === 2026);
      if (prediction2026) {
        const emissionMt = Number(
          (prediction2026.predicted_emission_mt as any)?.predicted_emission_mt ??
            prediction2026.predicted_emission_mt ??
            0,
        );
        // Convert Mt to per-person kg: (Mt * 1,000,000,000 kg) / population
        return Math.round((emissionMt * 1000000000) / statePopulation);
      }
    }
  } catch (error) {
    console.error("Error calculating real baseline emissions:", error);
  }

  // Fallback to old calculation if ML predictions unavailable
  return await calculateBaselineEmissions("anonymous", state);
}

// Calculate user's personal baseline from quiz results (stored in localStorage)
// Since there's no user login system, we'll use ML predictions as baseline
async function calculateUserPersonalBaseline(userId: string, state: string): Promise<number> {
  // Note: Without user login system, personal data is only stored in localStorage
  // on the client side. The backend cannot access localStorage directly.
  //
  // For now, we'll use ML predictions as the baseline.
  // In the future, if user login is implemented, this could be enhanced
  // to store and retrieve personal carbon footprint data from the database.

  console.log(`📊 Using ML predictions as baseline for ${state} (no user login system)`);
  return await calculateRealBaselineEmissions(state);
}

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
    const quizData = req.query.quizData
      ? JSON.parse(decodeURIComponent(req.query.quizData as string))
      : null;

    // Rate limit: 1 request per 1s per user (very relaxed for development)
    const now = Date.now();
    const prev = lastRequestAt.get(userId) || 0;
    if (now - prev < 1_000) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Please wait before requesting emissions comparison again",
        retryAfterSeconds: Math.ceil((1_000 - (now - prev)) / 1000),
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

    // Use user's personal carbon footprint from quiz results as baseline
    let baseline: number;
    if (quizData && quizData.totals && quizData.totals.totalKgYear) {
      // Use personal quiz data as baseline
      baseline = quizData.totals.totalKgYear;
      console.log(`📊 Using personal quiz baseline: ${baseline} kg/year`);
    } else {
      // Fallback to ML predictions
      baseline = await calculateUserPersonalBaseline(userId, state);
      console.log(`📊 Using ML prediction baseline: ${baseline} kg/year`);
    }

    // Retrieve user pledges and calculate real CO2 reduction using scientific values
    const pledges = await UserPledgesService.list(userId);

    // Calculate total pledge reduction using universal calculation system
    let pledgedKgPerYearReduction = 0;
    for (const pledge of pledges) {
      const title = (pledge as any).title?.toLowerCase() || "";
      const category = (pledge as any).category?.toLowerCase() || "other";

      // Use unified pledge calculation logic
      const savingsPerPledge = unifiedCalculatePledgeImpact(title, category);

      pledgedKgPerYearReduction += savingsPerPledge;
    }

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
    console.log(`🔍 Fetching pledge savings for user: ${userId}`);

    // Fetch user's saved pledges from database
    const userPledges = await UserPledgesService.list(userId);
    console.log(
      `📊 Found ${userPledges.length} user pledges:`,
      userPledges.map((p) => ({ title: p.title, category: p.category })),
    );

    if (!userPledges.length) {
      console.log(`⚠️ No pledges found for user ${userId}`);
      return res.json([]);
    }

    // Aggregate savings by pledge title using direct calculation
    const savingsByName = new Map<string, number>();

    for (const up of userPledges) {
      const name = up.title || up.pledgeId;
      const category = up.category || "default";

      // Use unified pledge calculation logic
      const savingKg = unifiedCalculatePledgeImpact(name, category);

      console.log(`💰 Calculating savings for "${name}" (${category}): ${savingKg} kg`);

      // Aggregate duplicates by summing
      savingsByName.set(name, (savingsByName.get(name) || 0) + Math.round(savingKg));
    }

    const result = Array.from(savingsByName.entries()).map(([name, saving]) => ({ name, saving }));
    console.log(`✅ Returning pledge savings:`, result);
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
    const quizData = req.query.quizData
      ? JSON.parse(decodeURIComponent(req.query.quizData as string))
      : null;

    // Validate years parameter
    if (years < 1 || years > 10) {
      return res.status(400).json({
        error: "Invalid years parameter",
        message: "Years must be between 1 and 10",
        timestamp: new Date().toISOString(),
      });
    }

    // Rate limit: 1 request per 1s per user (very relaxed for development)
    const now = Date.now();
    const prev = lastRequestAt.get(userId) || 0;
    if (now - prev < 1_000) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Please wait before requesting multi-year forecast again",
        retryAfterSeconds: Math.ceil((1_000 - (now - prev)) / 1000),
        timestamp: new Date().toISOString(),
      });
    }
    lastRequestAt.set(userId, now);

    // Generate forecast (pass quizData if available)
    const forecast = await generateMultiYearForecast(userId, state, years, quizData);

    // Transform to match frontend expectations
    const yearlyForecast = forecast.years.map((year, index) => ({
      year,
      baseline: forecast.baseline[index],
      withPledges: forecast.withPledges[index],
      saved: forecast.baseline[index] - forecast.withPledges[index],
    }));

    const response = {
      userId,
      state,
      forecastYears: years,
      currentBaseline: forecast.baseline[0] || 0,
      currentWithPledges: forecast.withPledges[0] || 0,
      currentSaved: forecast.baseline[0] - forecast.withPledges[0] || 0,
      yearlyForecast,
      metadata: {
        pledgesCount: forecast.metadata.pledgesCount,
        pledgedKgPerYearReduction: forecast.metadata.totalPledgeReduction,
        generatedAt: forecast.timestamp,
      },
    };

    return res.json(response);
  } catch (error) {
    console.error("Error in multi-year emissions forecast:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate multi-year forecast",
      timestamp: new Date().toISOString(),
    });
  }
});
