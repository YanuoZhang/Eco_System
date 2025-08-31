import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/environment", (_req: Request, res: Response) => {
  res.json({ env: process.env.NODE_ENV || "development" });
});

// Mock energy mix data approximated from Open Electricity dataset
// Supported sources: coal, gas, hydro, wind, solar
const energyMixByState: Record<
  string,
  Array<{ source: "coal" | "gas" | "hydro" | "wind" | "solar"; percentage: number; generation: number }>
> = {
  VIC: [
    { source: "coal", percentage: 63, generation: 4200 },
    { source: "gas", percentage: 6, generation: 400 },
    { source: "hydro", percentage: 6, generation: 400 },
    { source: "wind", percentage: 20, generation: 1300 },
    { source: "solar", percentage: 5, generation: 340 },
  ],
  NSW: [
    { source: "coal", percentage: 70, generation: 5200 },
    { source: "gas", percentage: 6, generation: 450 },
    { source: "hydro", percentage: 7, generation: 520 },
    { source: "wind", percentage: 8, generation: 600 },
    { source: "solar", percentage: 9, generation: 670 },
  ],
  QLD: [
    { source: "coal", percentage: 72, generation: 5400 },
    { source: "gas", percentage: 12, generation: 900 },
    { source: "hydro", percentage: 3, generation: 220 },
    { source: "wind", percentage: 2, generation: 150 },
    { source: "solar", percentage: 11, generation: 820 },
  ],
  SA: [
    { source: "coal", percentage: 0, generation: 0 },
    { source: "gas", percentage: 35, generation: 500 },
    { source: "hydro", percentage: 0, generation: 0 },
    { source: "wind", percentage: 45, generation: 650 },
    { source: "solar", percentage: 20, generation: 290 },
  ],
  TAS: [
    { source: "coal", percentage: 0, generation: 0 },
    { source: "gas", percentage: 0, generation: 0 },
    { source: "hydro", percentage: 80, generation: 900 },
    { source: "wind", percentage: 15, generation: 170 },
    { source: "solar", percentage: 5, generation: 60 },
  ],
  WA: [
    { source: "coal", percentage: 32, generation: 700 },
    { source: "gas", percentage: 42, generation: 920 },
    { source: "hydro", percentage: 0, generation: 0 },
    { source: "wind", percentage: 16, generation: 350 },
    { source: "solar", percentage: 10, generation: 220 },
  ],
};

// Mock greenhouse gas emissions data
// Based on historical data from Australian Department of Environment and Energy
// Units: Mt CO2-e (Million tonnes of CO2 equivalent)
const emissionsDataByState: Record<
  string,
  Array<{ year: number; value: number }>
> = {
  VIC: [
    { year: 2023, value: 42.7 },
    { year: 2022, value: 44.1 },
    { year: 2021, value: 45.3 },
    { year: 2020, value: 43.8 },
    { year: 2019, value: 47.2 },
    { year: 2018, value: 48.9 },
    { year: 2017, value: 50.1 },
    { year: 2016, value: 52.3 },
    { year: 2015, value: 53.7 },
    { year: 2014, value: 55.2 },
    { year: 2013, value: 56.8 },
    { year: 2012, value: 58.3 },
    { year: 2011, value: 59.9 },
    { year: 2010, value: 61.4 },
  ],
  NSW: [
    { year: 2023, value: 68.9 },
    { year: 2022, value: 71.2 },
    { year: 2021, value: 73.4 },
    { year: 2020, value: 70.8 },
    { year: 2019, value: 75.6 },
    { year: 2018, value: 77.9 },
    { year: 2017, value: 79.3 },
    { year: 2016, value: 81.7 },
    { year: 2015, value: 83.2 },
    { year: 2014, value: 84.8 },
    { year: 2013, value: 86.3 },
    { year: 2012, value: 87.9 },
    { year: 2011, value: 89.4 },
    { year: 2010, value: 91.1 },
  ],
  QLD: [
    { year: 2023, value: 58.3 },
    { year: 2022, value: 60.1 },
    { year: 2021, value: 61.8 },
    { year: 2020, value: 59.7 },
    { year: 2019, value: 63.9 },
    { year: 2018, value: 65.7 },
    { year: 2017, value: 67.2 },
    { year: 2016, value: 69.3 },
    { year: 2015, value: 70.8 },
    { year: 2014, value: 72.3 },
    { year: 2013, value: 73.9 },
    { year: 2012, value: 75.4 },
    { year: 2011, value: 76.9 },
    { year: 2010, value: 78.4 },
  ],
  SA: [
    { year: 2023, value: 12.8 },
    { year: 2022, value: 13.2 },
    { year: 2021, value: 13.5 },
    { year: 2020, value: 13.1 },
    { year: 2019, value: 14.0 },
    { year: 2018, value: 14.3 },
    { year: 2017, value: 14.7 },
    { year: 2016, value: 15.1 },
    { year: 2015, value: 15.4 },
    { year: 2014, value: 15.8 },
    { year: 2013, value: 16.2 },
    { year: 2012, value: 16.6 },
    { year: 2011, value: 17.0 },
    { year: 2010, value: 17.4 },
  ],
  TAS: [
    { year: 2023, value: 3.2 },
    { year: 2022, value: 3.3 },
    { year: 2021, value: 3.4 },
    { year: 2020, value: 3.3 },
    { year: 2019, value: 3.5 },
    { year: 2018, value: 3.6 },
    { year: 2017, value: 3.7 },
    { year: 2016, value: 3.8 },
    { year: 2015, value: 3.9 },
    { year: 2014, value: 4.0 },
    { year: 2013, value: 4.1 },
    { year: 2012, value: 4.2 },
    { year: 2011, value: 4.3 },
    { year: 2010, value: 4.4 },
  ],
  WA: [
    { year: 2023, value: 35.6 },
    { year: 2022, value: 36.8 },
    { year: 2021, value: 37.9 },
    { year: 2020, value: 36.7 },
    { year: 2019, value: 39.3 },
    { year: 2018, value: 40.4 },
    { year: 2017, value: 41.6 },
    { year: 2016, value: 42.8 },
    { year: 2015, value: 44.0 },
    { year: 2014, value: 45.2 },
    { year: 2013, value: 46.4 },
    { year: 2012, value: 47.6 },
    { year: 2011, value: 48.8 },
    { year: 2010, value: 50.0 },
  ],
};

// GET /api/energy-mix?state=VIC
app.get("/api/energy-mix", (req: Request, res: Response) => {
  const stateParam = String(req.query.state || "").toUpperCase();
  if (!stateParam) {
    return res.status(400).json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
  }
  const data = energyMixByState[stateParam];
  if (!data) {
    return res.status(404).json({ error: `Unsupported or unknown state '${stateParam}'` });
  }
  return res.json(data);
});

// GET /api/emissions?state=VIC&range=10y
app.get("/api/emissions", (req: Request, res: Response) => {
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

  // Get emissions data for the state
  const allData = emissionsDataByState[stateParam];
  if (!allData) {
    return res.status(404).json({ error: `Unsupported or unknown state '${stateParam}'` });
  }

  // Filter data based on range
  let filteredData = allData;
  const currentYear = new Date().getFullYear();

  if (rangeParam === "5y") {
    filteredData = allData.filter(item => item.year >= currentYear - 5);
  } else if (rangeParam === "10y") {
    filteredData = allData.filter(item => item.year >= currentYear - 10);
  }
  // For "all", use all data (no filtering)

  // Sort data by year (most recent first)
  filteredData.sort((a, b) => b.year - a.year);

  // Get the latest emission data
  const latest = filteredData.length > 0 ? filteredData[0] : null;

      // Return response
    const response = {
      unit: "Mt CO2-e",
      latest: latest ? { year: latest.year, value: latest.value } : null,
      data: filteredData.map(item => ({ year: item.year, value: item.value }))
    };

  return res.json(response);
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
          "Returns the % share and generation amount by energy source for a given Australian state.",
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
                        enum: ["coal", "gas", "hydro", "wind", "solar"],
                      },
                      percentage: { type: "number", format: "float", minimum: 0, maximum: 100 },
                      generation: {
                        type: "number",
                        format: "float",
                        minimum: 0,
                        description: "MW or MWh (mock units)",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "Unknown state" },
        },
      },
    },
    "/api/emissions": {
      get: {
        summary: "Greenhouse gas emissions by state",
        description:
          "Returns yearly greenhouse gas emissions data for a given Australian state with optional time range filtering.",
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
          "404": { description: "Unknown state" },
        },
      },
    },
  },
} as const;

app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapiDoc));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiDoc));

app.listen(port, (err?: Error) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`API server listening on http://localhost:${port}`);
  console.log(`OpenAPI docs available at: http://localhost:${port}/docs`);
  console.log(`OpenAPI spec available at: http://localhost:${port}/openapi.json`);
});
