import { describe, it, expect, beforeEach, vi } from "vitest";
import * as emissionsService from "../services/emissionsService";
import { UserPledgesService } from "../services/userPledgesService";

// Mock UserPledgesService
vi.mock("../services/userPledgesService", () => ({
  UserPledgesService: {
    list: vi.fn(),
  },
}));

// Mock calculateBaselineEmissions
vi.mock("../services/emissionsService", async () => {
  const actual = await vi.importActual("../services/emissionsService");
  return {
    ...actual,
    calculateBaselineEmissions: vi.fn(),
  };
});

describe("Multi-year Emissions Forecast", () => {
  const mockUserId = "test-user-123";
  const mockState = "VIC";

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Date.now() mock if any
    vi.useRealTimers();
  });

  describe("calculateSavedEmissions", () => {
    it("should calculate saved emissions correctly", () => {
      const result = emissionsService.calculateSavedEmissions(3200, 2800);
      expect(result).toBe(400);
    });

    it("should return 0 when withPledges is greater than baseline", () => {
      const result = emissionsService.calculateSavedEmissions(2800, 3200);
      expect(result).toBe(0);
    });

    it("should round results", () => {
      const result = emissionsService.calculateSavedEmissions(3200.7, 2800.3);
      expect(result).toBe(400);
    });
  });

  describe("generateMultiYearForecast", () => {
    it("should generate 5-year forecast with no pledges", async () => {
      // Mock no pledges
      vi.mocked(UserPledgesService.list).mockReturnValue([]);

      // Mock baseline calculation
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 5);

      expect(result.years).toHaveLength(5);
      expect(result.years[0]).toBe(2026); // Current year is 2025, so first forecast year is 2026
      expect(result.years[4]).toBe(2030);

      // Baseline should grow with 1.5% annual growth
      expect(result.baseline[0]).toBeGreaterThan(3200);
      expect(result.withPledges[0]).toBe(result.baseline[0]); // No pledges = no reduction
      expect(result.unit).toBe("kg CO2-e per year");
      expect(result.metadata.state).toBe(mockState);
      expect(result.metadata.pledgesCount).toBe(0);
      expect(result.metadata.forecastYears).toBe(5);
    });

    it("should generate forecast with energy pledges", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "energy-pledge-1",
          category: "energy",
          dateAdded: new Date().toISOString(),
        },
        {
          id: "pledge-2",
          userId: mockUserId,
          pledgeId: "energy-pledge-2",
          category: "energy",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 3);

      expect(result.years).toHaveLength(3);
      expect(result.metadata.pledgesCount).toBe(2);

      // WithPledges should be less than baseline due to energy pledges
      expect(result.withPledges[0]).toBeLessThan(result.baseline[0]);
      expect(result.withPledges[0]).toBeGreaterThan(0);
    });

    it("should generate forecast with transport pledges", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "transport-pledge-1",
          category: "transport",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 2);

      expect(result.withPledges[0]).toBeLessThan(result.baseline[0]);
      // Transport pledges have higher base reduction (300kg) but lower decay (1%)
      expect(result.metadata.totalPledgeReduction).toBeGreaterThan(0);
    });

    it("should apply decay factors over time", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "lifestyle-pledge-1",
          category: "lifestyle",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 5);

      // Lifestyle pledges have 3% decay rate, so effectiveness should decrease over time
      // First year: 150kg reduction
      // Second year: 150 * (1 - 0.03) = 145.5kg reduction
      // Third year: 150 * (1 - 0.03)^2 = 141.135kg reduction

      const year1Reduction = result.baseline[0] - result.withPledges[0];
      const year2Reduction = result.baseline[1] - result.withPledges[1];
      const year3Reduction = result.baseline[2] - result.withPledges[2];

      // Reductions should generally decrease over time due to decay
      expect(year2Reduction).toBeLessThanOrEqual(year1Reduction);
      expect(year3Reduction).toBeLessThanOrEqual(year2Reduction);
    });

    it("should limit forecast to 10 years maximum", async () => {
      vi.mocked(UserPledgesService.list).mockReturnValue([]);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 15);

      expect(result.years).toHaveLength(10);
      expect(result.metadata.forecastYears).toBe(10);
    });

    it("should handle minimum 1 year forecast", async () => {
      vi.mocked(UserPledgesService.list).mockReturnValue([]);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 0);

      expect(result.years).toHaveLength(1);
      expect(result.metadata.forecastYears).toBe(1);
    });

    it("should handle pledges with unknown categories", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "unknown-pledge-1",
          category: "unknown_category",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 2);

      // Should use default factors for unknown categories
      expect(result.withPledges[0]).toBeLessThan(result.baseline[0]);
      expect(result.metadata.pledgesCount).toBe(1);
    });

    it("should handle pledges without category", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "no-category-pledge-1",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 2);

      // Should use default factors when category is missing
      expect(result.withPledges[0]).toBeLessThan(result.baseline[0]);
      expect(result.metadata.pledgesCount).toBe(1);
    });

    it("should ensure withPledges never goes below 0", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "massive-pledge-1",
          category: "energy",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      // Mock a very low baseline
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(100);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 3);

      // WithPledges should never be negative
      result.withPledges.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });

    it("should include proper metadata", async () => {
      const mockPledges = [
        {
          id: "pledge-1",
          userId: mockUserId,
          pledgeId: "test-pledge-1",
          category: "energy",
          dateAdded: new Date().toISOString(),
        },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockPledges as any);
      vi.mocked(emissionsService.calculateBaselineEmissions).mockResolvedValue(3200);

      const result = await emissionsService.generateMultiYearForecast(mockUserId, mockState, 5);

      expect(result.metadata).toEqual({
        state: mockState,
        pledgesCount: 1,
        forecastYears: 5,
        totalBaselineReduction: expect.any(Number),
        totalPledgeReduction: expect.any(Number),
      });

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
