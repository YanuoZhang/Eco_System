import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index";
import { pool } from "../config/database";

describe("Climate Targets API", () => {
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

  describe("GET /api/climate-targets", () => {
    it("should return climate targets for VIC", async () => {
      const response = await request(app).get("/api/climate-targets?state=VIC").expect(200);

      expect(response.body).toHaveProperty("targetYear");
      expect(response.body).toHaveProperty("baselineYear");
      expect(response.body).toHaveProperty("targetValuePct");
      expect(response.body).toHaveProperty("planName");
      expect(response.body).toHaveProperty("progress");
      expect(response.body).toHaveProperty("progressDescription");
      expect(response.body).toHaveProperty("notes");

      expect(response.body.targetYear).toBe(2030);
      expect(response.body.baselineYear).toBe(2005);
      expect(response.body.targetValuePct).toBe(50);
      expect(response.body.planName).toContain("Victoria");
    });

    it("should return climate targets for NSW", async () => {
      const response = await request(app).get("/api/climate-targets?state=NSW").expect(200);

      expect(response.body.targetYear).toBe(2030);
      expect(response.body.baselineYear).toBe(2005);
      expect(response.body.targetValuePct).toBe(50);
      expect(response.body.planName).toContain("New South Wales");
    });

    it("should return climate targets for QLD", async () => {
      const response = await request(app).get("/api/climate-targets?state=QLD").expect(200);

      expect(response.body.targetYear).toBe(2030);
      expect(response.body.baselineYear).toBe(2005);
      expect(response.body.targetValuePct).toBe(30);
      expect(response.body.planName).toContain("Queensland");
    });

    it("should return climate targets for TAS", async () => {
      const response = await request(app).get("/api/climate-targets?state=TAS").expect(200);

      expect(response.body.targetYear).toBe(2030);
      expect(response.body.baselineYear).toBe(2005);
      expect(response.body.targetValuePct).toBe(100);
      expect(response.body.planName).toContain("Tasmania");
    });

    it("should return 400 for missing state parameter", async () => {
      const response = await request(app).get("/api/climate-targets").expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing required query param");
    });

    it("should return 400 for empty state parameter", async () => {
      const response = await request(app).get("/api/climate-targets?state=").expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing required query param");
    });

    it("should return 404 for unknown state", async () => {
      const response = await request(app).get("/api/climate-targets?state=UNKNOWN").expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("No climate targets found");
    });

    it("should handle case insensitive state codes", async () => {
      const response = await request(app).get("/api/climate-targets?state=vic").expect(200);

      expect(response.body.planName).toContain("Victoria");
    });

    it("should calculate progress correctly", async () => {
      const response = await request(app).get("/api/climate-targets?state=VIC").expect(200);

      expect(response.body).toHaveProperty("progress");
      expect(response.body).toHaveProperty("progressDescription");
      expect(typeof response.body.progress).toBe("number");
      expect(response.body.progressDescription).toContain("Achieved:");
    });
  });
});
