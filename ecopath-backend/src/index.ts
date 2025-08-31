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
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      database: "error",
      error: error instanceof Error ? error.message : "Unknown error"
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
      return res.status(400).json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }

    // Query real data from database
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
      return res.status(404).json({ error: `No data found for state '${stateParam}'` });
    }

    const data = result.rows.map(row => ({
      source: row.energy_type,
      percentage: Math.round(row.percentage),
      generation: row.generation_gwh
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error fetching energy mix data:', error);
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
        error: "Missing required query param 'state' (e.g., ?state=VIC&range=10y)"
      });
    }

    // Validate range parameter
    const validRanges = ["5y", "10y", "all"];
    if (!validRanges.includes(rangeParam)) {
      return res.status(400).json({
        error: `Invalid range parameter. Must be one of: ${validRanges.join(", ")}`
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
    
    query += " ORDER BY year DESC";

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No emissions data found for state '${stateParam}'` });
    }

    const data = result.rows.map(row => ({ year: row.year, value: row.value }));
    const latest = data.length > 0 ? data[0] : null;

    const response = {
      unit: "Mt CO2-e",
      latest: latest ? { year: latest.year, value: latest.value } : null,
      data: data
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching emissions data:', error);
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
                        enum: ["coal", "gas", "hydro", "wind", "solar", "bioenergy", "distillate", "battery"],
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
            description: "Time range filter: 5y (last 5 years), 10y (last 10 years), all (all available data).",
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
  },
} as const;

app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapiDoc));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiDoc));

app.listen(port, async (err?: Error) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`🚀 API server listening on http://localhost:${port}`);
  console.log(`📚 OpenAPI docs available at: http://localhost:${port}/docs`);
  console.log(`🔍 OpenAPI spec available at: http://localhost:${port}/openapi.json`);
  
  // Test database connection
  try {
    await testConnection();
  } catch (error) {
    console.warn('⚠️  Database connection failed. Some endpoints may not work properly.');
  }
});
