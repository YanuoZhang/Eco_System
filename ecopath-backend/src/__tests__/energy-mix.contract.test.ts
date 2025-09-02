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

// OpenAPI schema for energy mix response
const energyMixSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["source", "percentage", "generation"],
    properties: {
      source: {
        type: "string",
        enum: ["coal", "gas", "hydro", "wind", "solar"],
      },
      percentage: {
        type: "number",
        minimum: 0,
        maximum: 100,
      },
      generation: {
        type: "number",
        minimum: 0,
      },
    },
  },
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

// Simple JSON schema validator
function validateAgainstSchema(data: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (schema.type === "array") {
    if (!Array.isArray(data)) {
      errors.push("Expected array");
      return { valid: false, errors };
    }

    data.forEach((item, index) => {
      const itemValidation = validateObjectAgainstSchema(item, schema.items, `item[${index}]`);
      errors.push(...itemValidation.errors);
    });
  } else if (schema.type === "object") {
    return validateObjectAgainstSchema(data, schema, "");
  }

  return { valid: errors.length === 0, errors };
}

function validateObjectAgainstSchema(
  data: any,
  schema: any,
  path: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const currentPath = path ? `${path}.` : "";

  // Check required properties
  if (schema.required) {
    schema.required.forEach((requiredProp: string) => {
      if (
        !(requiredProp in data) ||
        data[requiredProp] === null ||
        data[requiredProp] === undefined
      ) {
        errors.push(`Missing required property: ${currentPath}${requiredProp}`);
      }
    });
  }

  // Validate properties
  if (schema.properties) {
    Object.keys(schema.properties).forEach((prop) => {
      if (prop in data) {
        const propSchema = schema.properties[prop];
        const propPath = `${currentPath}${prop}`;
        const value = data[prop];

        // Type validation
        if (propSchema.type === "string" && typeof value !== "string") {
          errors.push(`Property ${propPath} should be string, got ${typeof value}`);
        } else if (propSchema.type === "number" && typeof value !== "number") {
          errors.push(`Property ${propPath} should be number, got ${typeof value}`);
        }

        // Enum validation
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          errors.push(
            `Property ${propPath} should be one of [${propSchema.enum.join(", ")}], got ${value}`,
          );
        }

        // Range validation
        if (propSchema.minimum !== undefined && value < propSchema.minimum) {
          errors.push(`Property ${propPath} should be >= ${propSchema.minimum}, got ${value}`);
        }
        if (propSchema.maximum !== undefined && value > propSchema.maximum) {
          errors.push(`Property ${propPath} should be <= ${propSchema.maximum}, got ${value}`);
        }
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

describe("Contract Tests - Energy Mix API", () => {
  const supportedStates = ["VIC", "NSW", "QLD", "SA", "TAS", "WA"];

  describe("OpenAPI Schema Compliance", () => {
    supportedStates.forEach((state) => {
      it(`response for state=${state} complies with OpenAPI schema`, async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/energy-mix").query({ state });

        expect(res.status).toBe(200);

        // Validate against schema
        const validation = validateAgainstSchema(res.body, energyMixSchema);
        expect(validation.valid).toBe(true);

        if (validation.errors.length > 0) {
          console.error("Schema validation errors:", validation.errors);
        }
        expect(validation.errors).toHaveLength(0);
      });
    });
  });

  describe("API Contract Compliance", () => {
    it("returns exactly 5 energy sources for each state", async () => {
      const app = createTestApp();

      for (const state of supportedStates) {
        const res = await request(app).get("/api/energy-mix").query({ state });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(5);

        // Ensure all sources are unique
        const sources = res.body.map((item: any) => item.source);
        const uniqueSources = new Set(sources);
        expect(uniqueSources.size).toBe(5);
      }
    });

    it("all energy sources are from the defined enum", async () => {
      const app = createTestApp();
      const allowedSources = ["coal", "gas", "hydro", "wind", "solar"];

      for (const state of supportedStates) {
        const res = await request(app).get("/api/energy-mix").query({ state });

        res.body.forEach((item: any) => {
          expect(allowedSources).toContain(item.source);
        });
      }
    });

    it("percentage values are within valid range", async () => {
      const app = createTestApp();

      for (const state of supportedStates) {
        const res = await request(app).get("/api/energy-mix").query({ state });

        res.body.forEach((item: any) => {
          expect(item.percentage).toBeGreaterThanOrEqual(0);
          expect(item.percentage).toBeLessThanOrEqual(100);
          expect(Number.isFinite(item.percentage)).toBe(true);
        });
      }
    });

    it("generation values are non-negative", async () => {
      const app = createTestApp();

      for (const state of supportedStates) {
        const res = await request(app).get("/api/energy-mix").query({ state });

        res.body.forEach((item: any) => {
          expect(item.generation).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(item.generation)).toBe(true);
        });
      }
    });

    it("error responses follow consistent format", async () => {
      const app = createTestApp();

      // Test 400 error
      const res400 = await request(app).get("/api/energy-mix");
      expect(res400.status).toBe(400);
      expect(res400.body).toHaveProperty("error");
      expect(typeof res400.body.error).toBe("string");

      // Test 404 error
      const res404 = await request(app).get("/api/energy-mix").query({ state: "INVALID" });
      expect(res404.status).toBe(404);
      expect(res404.body).toHaveProperty("error");
      expect(typeof res404.body.error).toBe("string");
    });
  });

  describe("Business Logic Validation", () => {
    it("percentages sum to 100% within tolerance for all states", async () => {
      const app = createTestApp();
      const tolerance = 0.01; // 0.01% tolerance for floating point precision

      for (const state of supportedStates) {
        const res = await request(app).get("/api/energy-mix").query({ state });

        const total = res.body.reduce((sum: number, item: any) => sum + item.percentage, 0);
        expect(Math.abs(total - 100)).toBeLessThanOrEqual(tolerance);
      }
    });

    it("no state has negative generation for non-zero percentage sources", async () => {
      const app = createTestApp();

      for (const state of supportedStates) {
        const res = await request(app).get("/api/energy-mix").query({ state });

        res.body.forEach((item: any) => {
          if (item.percentage > 0) {
            expect(item.generation).toBeGreaterThan(0);
          }
        });
      }
    });
  });
});
