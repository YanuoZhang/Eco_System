import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";
import { testConnection } from "./config/database";
import * as cron from "node-cron";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createOpenApiDoc } from "./config/openapi";
import { performWeeklyNewsUpdate } from "./services/newsService";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5001;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://www.ecopath.me",
      "https://ecopath.me",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "Accept",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Methods",
    ],
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));

// API routes
app.use("/api", apiRoutes);

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
      news: "/api/news/climate",
      newsByCategory: "/api/news/climate/category/:category",
      individualNews: "/api/news/climate/:id",
      updateNews: "POST /api/news/climate/update",
      timeline: "/api/timeline",
      timelinePeriod: "/api/timeline/:period",
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

// OpenAPI documentation
const openapiDoc = createOpenApiDoc(port);
app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapiDoc));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiDoc));

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Export app for testing
export { app };

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(port, async () => {
    console.log(`API server listening on http://localhost:${port}`);
    console.log(`OpenAPI docs available at http://localhost:${port}/docs`);
    console.log(`OpenAPI spec available at http://localhost:${port}/openapi.json`);

    // Test database connection
    try {
      await testConnection();
    } catch {
      console.warn("Database connection failed. Some endpoints may not work properly.");
    }

    // Schedule weekly news updates (every Monday at 9:00 AM)
    cron.schedule(
      "0 9 * * 1",
      () => {
        performWeeklyNewsUpdate();
      },
      {
        timezone: "Australia/Sydney",
      },
    );

    // Also perform initial news fetch on startup
    console.log("Performing initial news fetch...");
    performWeeklyNewsUpdate();

    console.log("Weekly news updates scheduled for every Monday at 9:00 AM (Sydney time)");
  });
}
