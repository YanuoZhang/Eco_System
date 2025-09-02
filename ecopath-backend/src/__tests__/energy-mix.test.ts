import request from "supertest";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";

// Mock energy mix data (copied from index.ts for testing)
const energyMixByState: Record<
  string,
  Array<{
    source: "coal" | "gas" | "hydro" | "wind" | "solar";
    percentage: number;
    generation: number;
  }>
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

function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  // GET /api/energy-mix?state=VIC
  app.get("/api/energy-mix", (req: Request, res: Response) => {
    const stateParam = String(req.query.state || "").toUpperCase();
    if (!stateParam) {
      return res
        .status(400)
        .json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }
    const data = energyMixByState[stateParam];
    if (!data) {
      return res.status(404).json({ error: `Unsupported or unknown state '${stateParam}'` });
    }
    return res.json(data);
  });

  return app;
}

describe("GET /api/energy-mix", () => {
  const supportedStates = ["VIC", "NSW", "QLD", "SA", "TAS", "WA"];
  const expectedSources = ["coal", "gas", "hydro", "wind", "solar"];

  describe("Valid state parameters", () => {
    supportedStates.forEach((state) => {
      it(`returns 200 and valid data for state=${state}`, async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/energy-mix").query({ state });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(5);

        // Validate each energy source
        res.body.forEach((item: any, _index: number) => {
          expect(item).toHaveProperty("source");
          expect(item).toHaveProperty("percentage");
          expect(item).toHaveProperty("generation");

          expect(expectedSources).toContain(item.source);
          expect(typeof item.percentage).toBe("number");
          expect(typeof item.generation).toBe("number");

          expect(item.percentage).toBeGreaterThanOrEqual(0);
          expect(item.percentage).toBeLessThanOrEqual(100);
          expect(item.generation).toBeGreaterThanOrEqual(0);

          // Check no null/undefined values
          expect(item.source).not.toBeNull();
          expect(item.source).not.toBeUndefined();
          expect(item.percentage).not.toBeNull();
          expect(item.percentage).not.toBeUndefined();
          expect(item.generation).not.toBeNull();
          expect(item.generation).not.toBeUndefined();
        });

        // Validate all 5 sources are present
        const sources = res.body.map((item: any) => item.source);
        expect(sources.sort()).toEqual(expectedSources.sort());
      });

      it(`percentages sum to approximately 100% for state=${state}`, async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/energy-mix").query({ state });

        const totalPercentage = res.body.reduce(
          (sum: number, item: any) => sum + item.percentage,
          0,
        );
        const tolerance = 0.01; // Allow for small floating point errors

        expect(totalPercentage).toBeGreaterThanOrEqual(100 - tolerance);
        expect(totalPercentage).toBeLessThanOrEqual(100 + tolerance);
      });
    });
  });

  describe("Invalid state parameters", () => {
    it("returns 400 when state parameter is missing", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/energy-mix");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Missing required query param 'state'");
    });

    it("returns 400 when state parameter is empty", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/energy-mix").query({ state: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Missing required query param 'state'");
    });

    it("returns 404 for unsupported state", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/energy-mix").query({ state: "XYZ" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Unsupported or unknown state 'XYZ'");
    });

    it("returns 404 for lowercase unsupported state", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/energy-mix").query({ state: "xyz" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Unsupported or unknown state 'XYZ'");
    });
  });

  describe("Schema validation", () => {
    it("matches OpenAPI schema structure", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/energy-mix").query({ state: "VIC" });

      expect(res.status).toBe(200);

      // Validate response is an array
      expect(Array.isArray(res.body)).toBe(true);

      // Validate each item has required properties
      res.body.forEach((item: any) => {
        expect(item).toHaveProperty("source");
        expect(item).toHaveProperty("percentage");
        expect(item).toHaveProperty("generation");

        // Validate source is one of the allowed values
        expect(["coal", "gas", "hydro", "wind", "solar"]).toContain(item.source);

        // Validate percentage constraints
        expect(typeof item.percentage).toBe("number");
        expect(item.percentage).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeLessThanOrEqual(100);

        // Validate generation constraints
        expect(typeof item.generation).toBe("number");
        expect(item.generation).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Edge cases", () => {
    it("handles case insensitive state parameter", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/energy-mix").query({ state: "vic" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(5);
    });

    it("returns consistent data for repeated calls", async () => {
      const app = createTestApp();

      // Make multiple calls to ensure consistency
      const responses = await Promise.all([
        request(app).get("/api/energy-mix").query({ state: "VIC" }),
        request(app).get("/api/energy-mix").query({ state: "VIC" }),
        request(app).get("/api/energy-mix").query({ state: "VIC" }),
      ]);

      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(5);
      });

      // All responses should be identical
      const firstResponse = responses[0].body;
      responses.forEach((res) => {
        expect(res.body).toEqual(firstResponse);
      });
    });
  });
});
