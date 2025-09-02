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
              targetValuePct: target.target_value_pct,
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
          targetValuePct: target.target_value_pct,
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
