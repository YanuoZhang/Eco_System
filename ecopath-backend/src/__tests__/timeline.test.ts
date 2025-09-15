import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";

// Mock the timeline API endpoints
const app = express();
app.use(express.json());

// Mock timeline data
const mockTimelineData = [
  {
    period: "Early Industrial Era",
    years: "1880–1950",
    events: [
      {
        year: 1896,
        title: "Arrhenius Discovers Greenhouse Effect",
        description:
          "Swedish scientist Svante Arrhenius first calculates how changes in atmospheric CO2 could affect Earth's temperature, laying the foundation for modern climate science.",
        icon: "🔬",
        category: "scientific",
      },
      {
        year: 1938,
        title: "Callendar Links CO2 to Warming",
        description:
          "British engineer Guy Callendar publishes evidence showing that CO2 levels had increased and global temperatures were rising, connecting human activities to climate change.",
        icon: "📊",
        category: "scientific",
      },
      {
        year: 1950,
        title: "Keeling Curve Begins",
        description:
          "Charles David Keeling starts measuring atmospheric CO2 at Mauna Loa Observatory, establishing the longest continuous record of atmospheric CO2 concentrations.",
        icon: "📈",
        category: "scientific",
      },
    ],
  },
  {
    period: "Environmental Awakening",
    years: "1951–1980",
    events: [
      {
        year: 1962,
        title: "Silent Spring Published",
        description:
          "Rachel Carson's groundbreaking book exposes the environmental damage caused by pesticides, sparking the modern environmental movement.",
        icon: "📚",
        category: "environmental",
      },
      {
        year: 1970,
        title: "First Earth Day",
        description:
          "20 million Americans participate in the first Earth Day, marking the birth of the modern environmental movement and raising awareness about environmental issues.",
        icon: "🌍",
        category: "social",
      },
    ],
  },
];

// Mock endpoints
app.get("/api/timeline", (req, res) => {
  res.json({
    success: true,
    data: mockTimelineData,
    totalPeriods: mockTimelineData.length,
    totalEvents: mockTimelineData.reduce((sum, period) => sum + period.events.length, 0),
    lastUpdated: new Date().toISOString(),
    source: "api",
  });
});

app.get("/api/timeline/:period", (req, res) => {
  const { period } = req.params;
  const periodIndex = parseInt(period);

  if (isNaN(periodIndex) || periodIndex < 0 || periodIndex >= mockTimelineData.length) {
    return res.status(400).json({
      success: false,
      error: "Invalid period",
      message: `Period must be between 0 and ${mockTimelineData.length - 1}`,
      availablePeriods: mockTimelineData.map((p, index) => ({
        index,
        period: p.period,
        years: p.years,
      })),
    });
  }

  const timelinePeriod = mockTimelineData[periodIndex];

  res.json({
    success: true,
    data: timelinePeriod,
    totalEvents: timelinePeriod.events.length,
  });
});

describe("Climate Timeline API", () => {
  describe("GET /api/timeline", () => {
    it("should return all timeline periods", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.totalPeriods).toBe(2);
      expect(response.body.totalEvents).toBe(5);
      expect(response.body.source).toBe("api");
    });

    it("should have correct data structure", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      const firstPeriod = response.body.data[0];
      expect(firstPeriod).toHaveProperty("period");
      expect(firstPeriod).toHaveProperty("years");
      expect(firstPeriod).toHaveProperty("events");
      expect(Array.isArray(firstPeriod.events)).toBe(true);
    });

    it("should have valid event structure", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      const firstEvent = response.body.data[0].events[0];
      expect(firstEvent).toHaveProperty("year");
      expect(firstEvent).toHaveProperty("title");
      expect(firstEvent).toHaveProperty("description");
      expect(firstEvent).toHaveProperty("icon");
      expect(firstEvent).toHaveProperty("category");
      expect(typeof firstEvent.year).toBe("number");
      expect(typeof firstEvent.title).toBe("string");
      expect(typeof firstEvent.description).toBe("string");
    });
  });

  describe("GET /api/timeline/:period", () => {
    it("should return specific period by index", async () => {
      const response = await request(app).get("/api/timeline/0").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe("Early Industrial Era");
      expect(response.body.data.years).toBe("1880–1950");
      expect(response.body.totalEvents).toBe(3);
    });

    it("should return second period by index", async () => {
      const response = await request(app).get("/api/timeline/1").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe("Environmental Awakening");
      expect(response.body.data.years).toBe("1951–1980");
      expect(response.body.totalEvents).toBe(2);
    });

    it("should return 400 for invalid period index", async () => {
      const response = await request(app).get("/api/timeline/999").expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid period");
      expect(response.body.message).toContain("Period must be between 0 and 1");
    });

    it("should return 400 for non-numeric period", async () => {
      const response = await request(app).get("/api/timeline/invalid").expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid period");
    });
  });

  describe("Timeline data validation", () => {
    it("should have valid categories", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      const validCategories = [
        "scientific",
        "political",
        "environmental",
        "technological",
        "social",
      ];

      response.body.data.forEach((period: any) => {
        period.events.forEach((event: any) => {
          expect(validCategories).toContain(event.category);
        });
      });
    });

    it("should have events in chronological order within periods", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      response.body.data.forEach((period: any) => {
        const years = period.events.map((event: any) => event.year);
        const sortedYears = [...years].sort((a, b) => a - b);
        expect(years).toEqual(sortedYears);
      });
    });

    it("should have meaningful descriptions", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      response.body.data.forEach((period: any) => {
        period.events.forEach((event: any) => {
          expect(event.description.length).toBeGreaterThan(50);
          expect(event.description).toMatch(/[a-zA-Z]/);
        });
      });
    });
  });
});
