import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index";
import { pool } from "../config/database";

describe("States API", () => {
  beforeAll(async () => {
    // Ensure database connection
    try {
      await pool.query("SELECT 1");
    } catch {
      console.warn("Database not available for testing, skipping integration tests");
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /api/states", () => {
    it("should return all available states", async () => {
      const response = await request(app).get("/api/states").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check structure of each state
      response.body.forEach((state: any) => {
        expect(state).toHaveProperty("id");
        expect(state).toHaveProperty("name");
        expect(state).toHaveProperty("abbreviation");
        expect(state).toHaveProperty("displayName");

        expect(typeof state.id).toBe("string");
        expect(typeof state.name).toBe("string");
        expect(typeof state.abbreviation).toBe("string");
        expect(typeof state.displayName).toBe("string");

        expect(state.displayName).toBe(`${state.name} (${state.abbreviation})`);
      });
    });

    it("should return states in alphabetical order", async () => {
      const response = await request(app).get("/api/states").expect(200);

      const stateNames = response.body.map((state: any) => state.name);
      const sortedNames = [...stateNames].sort();

      expect(stateNames).toEqual(sortedNames);
    });

    it("should not include aggregate states", async () => {
      const response = await request(app).get("/api/states").expect(200);

      // Should not include Australia (AUS) aggregate
      const hasAggregate = response.body.some((state: any) => state.id === "AUS");
      expect(hasAggregate).toBe(false);
    });

    it("should include all major Australian states and territories", async () => {
      const response = await request(app).get("/api/states").expect(200);

      const stateIds = response.body.map((state: any) => state.id);
      // Only check for states that have energy data in the database
      const expectedStates = ["NSW", "VIC", "QLD", "SA", "WA", "TAS"];

      expectedStates.forEach((expectedState) => {
        expect(stateIds).toContain(expectedState);
      });
    });

    it("should have consistent data structure", async () => {
      const response = await request(app).get("/api/states").expect(200);

      response.body.forEach((state: any) => {
        // ID should be uppercase
        expect(state.id).toBe(state.id.toUpperCase());

        // Abbreviation should match ID
        expect(state.abbreviation).toBe(state.id);

        // Display name should be properly formatted
        expect(state.displayName).toMatch(/^.+ \(\w+\)$/);
      });
    });
  });
});
