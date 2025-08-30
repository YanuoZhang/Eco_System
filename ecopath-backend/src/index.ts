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
  },
} as const;

app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapiDoc));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiDoc));

app.listen(port, (err?: Error) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 API server listening on http://localhost:${port}`);
  console.log(`📚 OpenAPI docs available at: http://localhost:${port}/docs`);
  console.log(`📄 OpenAPI spec available at: http://localhost:${port}/openapi.json`);
});
