import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";

// Mock the timeline API endpoints
const app = express();
app.use(express.json());

// Mock timeline data matching real structure
const mockTimelineData = [
  {
    period: "Early Industrial Era",
    years: "1880-1950",
    title: "Industrial Revolution Begins",
    dramaticText:
      "The machines awakened. Steam and steel promised progress, but the atmosphere began remembering every smokestack.",
    childPerspective:
      "Children of this era watched the first smokestacks rise, unknowing that these tall towers would forever change the world.",
    visual:
      "https://readdy.ai/api/search-image?query=Industrial%20revolution%20scene%20with%20steam-powered%20factories%2C%20coal%20smokestacks%20belching%20black%20smoke%20into%20clear%20sky%2C0workers%20in%20early%20industrial%20setting%2C%20children%20watching%20from%20distance%2C%20dramatic%20contrast%20between%20human%20progress%20and%20environmental%20impact&width=600&height=300&seq=story-industrial-1&orientation=landscape",
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
    period: "The Great Acceleration",
    years: "1950-1990",
    title: "The Great Acceleration",
    dramaticText:
      "We built a world of abundance, not knowing we were writing stories of scarcity for our children.",
    childPerspective:
      "Baby boomers grew up believing progress meant prosperity, while their children would inherit a warming world.",
    visual:
      "https://readdy.ai/api/search-image?query=1950s%20suburban%20boom%20with%20cars%2C%20highways%2C%20factories%2C%20families%20with%20children%20enjoying%20modern%20lifestyle%20contrasted%20with%20early%20climate%20scientists%20studying%20atmospheric%20data%2C%20showing%20the%20acceleration%20of%20human%20impact&width=600&height=300&seq=story-acceleration-2&orientation=landscape",
    events: [
      {
        year: 1962,
        title: "Silent Spring Published",
        description:
          "Rachel Carson's groundbreaking book exposes the environmental damage caused by pesticides, sparking the modern environmental movement.",
        icon: "🌱",
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
      expect(firstPeriod).toHaveProperty("title");
      expect(firstPeriod).toHaveProperty("dramaticText");
      expect(firstPeriod).toHaveProperty("childPerspective");
      expect(firstPeriod).toHaveProperty("visual");
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

    it("should have valid dramatic text and child perspective", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      response.body.data.forEach((period: any) => {
        expect(period.dramaticText).toBeDefined();
        expect(period.dramaticText.length).toBeGreaterThan(20);
        expect(period.childPerspective).toBeDefined();
        expect(period.childPerspective.length).toBeGreaterThan(20);
        expect(period.visual).toBeDefined();
        expect(period.visual).toMatch(/^https?:\/\//);
      });
    });

    it("should have valid titles", async () => {
      const response = await request(app).get("/api/timeline").expect(200);

      response.body.data.forEach((period: any) => {
        expect(period.title).toBeDefined();
        expect(period.title.length).toBeGreaterThan(5);
        expect(period.title).toMatch(/[a-zA-Z]/);
      });
    });
  });
});
