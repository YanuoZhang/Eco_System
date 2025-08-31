import request from "supertest";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";

// Mock data service to simulate database layer
interface EmissionData {
  year: number;
  value: number;
}

interface EmissionsResponse {
  unit: string;
  latest: { year: number; value: number } | null;
  data: EmissionData[];
}

// Mock emissions data service
class EmissionsDataService {
  private data: Record<string, EmissionData[]> = {
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

  // Simulate database query
  async getEmissionsByState(state: string): Promise<EmissionData[]> {
    // Simulate async database call
    await new Promise((resolve) => setTimeout(resolve, 10));

    const stateData = this.data[state.toUpperCase()];
    if (!stateData) {
      throw new Error(`State '${state}' not found`);
    }

    return [...stateData]; // Return copy to prevent mutation
  }

  // Simulate empty data scenario
  async getEmptyEmissions(): Promise<EmissionData[]> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return [];
  }

  // Simulate data with future years (for testing edge cases)
  async getEmissionsWithFutureData(): Promise<EmissionData[]> {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return [
      { year: 2025, value: 40.0 }, // Future year
      { year: 2024, value: 41.0 }, // Future year
      { year: 2023, value: 42.7 },
    ];
  }
}

// Create mock service instance
const mockDataService = new EmissionsDataService();

// Mock data service for testing different scenarios
function createTestApp(customDataService?: EmissionsDataService) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  const dataService = customDataService || mockDataService;

  // GET /api/emissions?state=VIC&range=10y
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

      // Get emissions data for the state using mock service
      let allData: EmissionData[];
      try {
        allData = await dataService.getEmissionsByState(stateParam);
      } catch {
        return res.status(404).json({
          error: `Unsupported or unknown state '${stateParam}'`,
        });
      }

      // Filter data based on range
      let filteredData = [...allData];
      const currentYear = new Date().getFullYear();

      if (rangeParam === "5y") {
        filteredData = allData.filter((item) => item.year >= currentYear - 5);
      } else if (rangeParam === "10y") {
        filteredData = allData.filter((item) => item.year >= currentYear - 10);
      }
      // For "all", use all data (no filtering)

      // Sort data by year (most recent first)
      filteredData.sort((a, b) => b.year - a.year);

      // Get the latest emission data
      const latest = filteredData.length > 0 ? filteredData[0] : null;

      // Return response
      const response: EmissionsResponse = {
        unit: "Mt CO2-e",
        latest: latest ? { year: latest.year, value: latest.value } : null,
        data: filteredData.map((item) => ({ year: item.year, value: item.value })),
      };

      return res.json(response);
    } catch (error) {
      console.error("Unexpected error:", error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  });

  return app;
}

describe("Greenhouse Gas Emissions API - Unit Tests", () => {
  const supportedStates = ["VIC", "NSW", "QLD", "SA", "TAS", "WA"];

  describe("Acceptance Criteria: Valid state and range returns correct data", () => {
    supportedStates.forEach((state) => {
      describe(`State: ${state}`, () => {
        it("returns 200 and correctly formatted emissions data with default range", async () => {
          const app = createTestApp();
          const res = await request(app).get("/api/emissions").query({ state });

          expect(res.status).toBe(200);

          // Verify response structure
          expect(res.body).toHaveProperty("unit", "Mt CO2-e");
          expect(res.body).toHaveProperty("latest");
          expect(res.body).toHaveProperty("data");
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);

          // Verify data types and values
          res.body.data.forEach((item: EmissionData) => {
            expect(typeof item.year).toBe("number");
            expect(typeof item.value).toBe("number");
            expect(item.year).toBeGreaterThan(2009); // All data from 2010+
            expect(item.value).toBeGreaterThan(0); // All emissions values positive
          });

          // Verify latest data structure
          if (res.body.latest) {
            expect(res.body.latest).toHaveProperty("year");
            expect(res.body.latest).toHaveProperty("value");
            expect(typeof res.body.latest.year).toBe("number");
            expect(typeof res.body.latest.value).toBe("number");
          }
        });

        ["5y", "10y", "all"].forEach((range) => {
          it(`returns filtered data for range=${range}`, async () => {
            const app = createTestApp();
            const res = await request(app).get("/api/emissions").query({ state, range });

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            // Verify range filtering logic
            const currentYear = new Date().getFullYear();
            const data = res.body.data;

            if (range === "5y") {
              data.forEach((item: EmissionData) => {
                expect(item.year).toBeGreaterThanOrEqual(currentYear - 5);
                expect(item.year).toBeLessThanOrEqual(currentYear);
              });
              expect(data.length).toBeGreaterThan(0);
            } else if (range === "10y") {
              data.forEach((item: EmissionData) => {
                expect(item.year).toBeGreaterThanOrEqual(currentYear - 10);
                expect(item.year).toBeLessThanOrEqual(currentYear);
              });
              expect(data.length).toBeGreaterThan(0);
            }
            // For "all", verify we get all available data
            else if (range === "all") {
              expect(data.length).toBeGreaterThan(10); // Should have at least 10+ years of data
            }
          });
        });
      });
    });
  });

  describe("Acceptance Criteria: Invalid input returns appropriate error", () => {
    describe("Missing or invalid parameters", () => {
      it("returns 400 when state parameter is missing", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions");

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Missing required query param 'state'");
        expect(res.body.error).toContain("VIC");
      });

      it("returns 400 when state parameter is empty string", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Missing required query param 'state'");
      });

      it("returns 400 for invalid range parameter", async () => {
        const app = createTestApp();
        const res = await request(app)
          .get("/api/emissions")
          .query({ state: "VIC", range: "invalid" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid range parameter");
        expect(res.body.error).toContain("5y, 10y, all");
      });

      it("returns 400 for numeric range parameter", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "VIC", range: "3y" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Invalid range parameter");
      });
    });

    describe("Unsupported states", () => {
      const invalidStates = ["XYZ", "ABC", "USA", "123"];

      invalidStates.forEach((invalidState) => {
        it(`returns 404 for unsupported state: ${invalidState}`, async () => {
          const app = createTestApp();
          const res = await request(app).get("/api/emissions").query({ state: invalidState });

          expect(res.status).toBe(404);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toContain(
            `Unsupported or unknown state '${invalidState.toUpperCase()}'`,
          );
        });
      });

      it("handles lowercase unsupported state correctly", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "xyz" });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toContain("Unsupported or unknown state 'XYZ'");
      });
    });
  });

  describe("Data Logic Validation: Ordering and Latest Value Extraction", () => {
    supportedStates.forEach((state) => {
      describe(`State: ${state}`, () => {
        it("returns data sorted by year (most recent first)", async () => {
          const app = createTestApp();
          const res = await request(app).get("/api/emissions").query({ state });

          expect(res.status).toBe(200);
          const data = res.body.data;

          // Verify data is sorted in descending order (newest first)
          for (let i = 1; i < data.length; i++) {
            expect(data[i - 1].year).toBeGreaterThan(data[i].year);
          }

          // Verify the first item has the most recent year
          expect(data[0].year).toBeGreaterThan(data[data.length - 1].year);
        });

        it("latest data correctly extracts the most recent year/value", async () => {
          const app = createTestApp();
          const res = await request(app).get("/api/emissions").query({ state });

          expect(res.status).toBe(200);
          expect(res.body.latest).not.toBeNull();

          const firstDataItem = res.body.data[0];
          const latestData = res.body.latest;

          // Latest should match the first (most recent) item in sorted data
          expect(latestData.year).toBe(firstDataItem.year);
          expect(latestData.value).toBe(firstDataItem.value);

          // Latest should be the most recent year in the dataset
          const allYears = res.body.data.map((item: EmissionData) => item.year);
          const maxYear = Math.max(...allYears);
          expect(latestData.year).toBe(maxYear);
        });

        it("all emission values are positive finite numbers", async () => {
          const app = createTestApp();
          const res = await request(app).get("/api/emissions").query({ state });

          expect(res.status).toBe(200);

          // Check all data values
          res.body.data.forEach((item: EmissionData) => {
            expect(item.value).toBeGreaterThan(0);
            expect(Number.isFinite(item.value)).toBe(true);
            expect(typeof item.value).toBe("number");
          });

          // Check latest value if present
          if (res.body.latest) {
            expect(res.body.latest.value).toBeGreaterThan(0);
            expect(Number.isFinite(res.body.latest.value)).toBe(true);
            expect(typeof res.body.latest.value).toBe("number");
          }
        });
      });
    });
  });

  describe("Range Filtering Logic: 5y, 10y, all", () => {
    const currentYear = new Date().getFullYear();

    describe("5y range filtering", () => {
      it("returns only data from the last 5 years", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "VIC", range: "5y" });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        res.body.data.forEach((item: EmissionData) => {
          expect(item.year).toBeGreaterThanOrEqual(currentYear - 5);
          expect(item.year).toBeLessThanOrEqual(currentYear);
        });

        // Verify sorting is maintained
        for (let i = 1; i < res.body.data.length; i++) {
          expect(res.body.data[i - 1].year).toBeGreaterThan(res.body.data[i].year);
        }
      });

      it("latest value reflects the most recent year within 5y range", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "VIC", range: "5y" });

        expect(res.status).toBe(200);
        expect(res.body.latest).not.toBeNull();

        const latestYear = res.body.latest.year;
        expect(latestYear).toBeGreaterThanOrEqual(currentYear - 5);
        expect(latestYear).toBeLessThanOrEqual(currentYear);
      });
    });

    describe("10y range filtering", () => {
      it("returns only data from the last 10 years", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "VIC", range: "10y" });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        res.body.data.forEach((item: EmissionData) => {
          expect(item.year).toBeGreaterThanOrEqual(currentYear - 10);
          expect(item.year).toBeLessThanOrEqual(currentYear);
        });
      });

      it("includes more data than 5y range", async () => {
        const app = createTestApp();
        const res5y = await request(app).get("/api/emissions").query({ state: "VIC", range: "5y" });
        const res10y = await request(app)
          .get("/api/emissions")
          .query({ state: "VIC", range: "10y" });

        expect(res10y.body.data.length).toBeGreaterThanOrEqual(res5y.body.data.length);
      });
    });

    describe("all range (default)", () => {
      it("returns all available historical data", async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: "VIC", range: "all" });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(14); // VIC has 14 years of data (2010-2023)
      });

      it("default range behavior matches explicit 'all' range", async () => {
        const app = createTestApp();
        const resWithRange = await request(app)
          .get("/api/emissions")
          .query({ state: "VIC", range: "all" });
        const resWithoutRange = await request(app).get("/api/emissions").query({ state: "VIC" });

        expect(resWithRange.body.data).toEqual(resWithoutRange.body.data);
        expect(resWithRange.body.latest).toEqual(resWithoutRange.body.latest);
      });
    });
  });

  describe("Case Insensitive State Handling", () => {
    const testCases = [
      { input: "vic", expected: "VIC" },
      { input: "ViC", expected: "VIC" },
      { input: "NSW", expected: "NSW" },
      { input: "nsw", expected: "NSW" },
      { input: "qld", expected: "QLD" },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`handles case insensitive state: ${input} -> ${expected}`, async () => {
        const app = createTestApp();
        const res = await request(app).get("/api/emissions").query({ state: input });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Verify that the same data is returned regardless of case
        const resUpper = await request(app).get("/api/emissions").query({ state: expected });
        expect(res.body.data).toEqual(resUpper.body.data);
      });
    });
  });

  describe("Mock Data Service: Database Layer Simulation", () => {
    describe("Normal data scenarios", () => {
      it("uses mock service to simulate database calls", async () => {
        const customDataService = new EmissionsDataService();
        const app = createTestApp(customDataService);

        const res = await request(app).get("/api/emissions").query({ state: "VIC" });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.unit).toBe("Mt CO2-e");
      });

      it("handles async database operations correctly", async () => {
        const app = createTestApp();

        const startTime = Date.now();
        const res = await request(app).get("/api/emissions").query({ state: "VIC" });
        const endTime = Date.now();

        expect(res.status).toBe(200);
        // Verify async operation took some time (simulating DB call)
        expect(endTime - startTime).toBeGreaterThanOrEqual(10);
      });
    });

    describe("Empty data scenarios", () => {
      it("returns valid response with empty array when no data available", async () => {
        // Create a custom mock service that returns empty data
        const emptyDataService = new EmissionsDataService();
        emptyDataService.getEmissionsByState = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return [];
        };

        const app = createTestApp(emptyDataService);
        const res = await request(app).get("/api/emissions").query({ state: "VIC" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("unit", "Mt CO2-e");
        expect(res.body).toHaveProperty("latest", null);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
      });

      it("latest is null when no data is available", async () => {
        const emptyDataService = new EmissionsDataService();
        emptyDataService.getEmissionsByState = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return [];
        };

        const app = createTestApp(emptyDataService);
        const res = await request(app).get("/api/emissions").query({ state: "VIC" });

        expect(res.body.latest).toBeNull();
        expect(res.body.data).toEqual([]);
      });
    });

    describe("Edge cases with mock data", () => {
      it("handles future years data correctly", async () => {
        const futureDataService = new EmissionsDataService();
        futureDataService.getEmissionsByState = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return [
            { year: 2025, value: 40.0 },
            { year: 2024, value: 41.0 },
            { year: 2023, value: 42.7 },
          ];
        };

        const app = createTestApp(futureDataService);
        const res = await request(app).get("/api/emissions").query({ state: "VIC" });

        expect(res.status).toBe(200);
        expect(res.body.latest.year).toBe(2025); // Most recent year
        expect(res.body.latest.value).toBe(40.0);
        expect(res.body.data[0].year).toBe(2025); // First item is most recent
      });

      it("handles single data point correctly", async () => {
        const singleDataService = new EmissionsDataService();
        singleDataService.getEmissionsByState = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return [{ year: 2023, value: 42.7 }];
        };

        const app = createTestApp(singleDataService);
        const res = await request(app).get("/api/emissions").query({ state: "VIC" });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.latest.year).toBe(2023);
        expect(res.body.latest.value).toBe(42.7);
      });
    });
  });

  describe("Response Format Consistency", () => {
    it("maintains consistent response structure across all supported states", async () => {
      const app = createTestApp();

      for (const state of supportedStates) {
        const res = await request(app).get("/api/emissions").query({ state });

        expect(res.status).toBe(200);

        // Verify required properties exist
        expect(res.body).toHaveProperty("unit");
        expect(res.body).toHaveProperty("latest");
        expect(res.body).toHaveProperty("data");

        // Verify data types
        expect(typeof res.body.unit).toBe("string");
        expect(Array.isArray(res.body.data)).toBe(true);

        // Latest can be null for empty data, but should be object for valid data
        if (res.body.data.length > 0) {
          expect(res.body.latest).not.toBeNull();
          expect(typeof res.body.latest.year).toBe("number");
          expect(typeof res.body.latest.value).toBe("number");
        }
      }
    });

    it("response format remains consistent across different ranges", async () => {
      const app = createTestApp();
      const ranges = ["5y", "10y", "all"];

      for (const range of ranges) {
        const res = await request(app).get("/api/emissions").query({ state: "VIC", range });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("unit", "Mt CO2-e");
        expect(Array.isArray(res.body.data)).toBe(true);

        // Verify data array contains objects with year and value
        if (res.body.data.length > 0) {
          res.body.data.forEach((item: EmissionData) => {
            expect(item).toHaveProperty("year");
            expect(item).toHaveProperty("value");
            expect(typeof item.year).toBe("number");
            expect(typeof item.value).toBe("number");
          });
        }
      }
    });
  });
});
