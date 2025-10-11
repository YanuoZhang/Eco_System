import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../index";
import { CommunityService } from "../services/communityService";
import { UserPledgesService } from "../services/userPledgesService";
import { PledgesService } from "../services/pledgesService";

// Mock the services
vi.mock("../services/userPledgesService");
vi.mock("../services/pledgesService");

describe("Community Footprint API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/community/footprint", () => {
    it("should return community footprint data", async () => {
      const mockFootprint = {
        totalCO2SavedKg: 125000,
        activeMembers: 4700,
        categories: [
          { name: "Transport", kg: 43000, percentage: 34 },
          { name: "Energy", kg: 35000, percentage: 28 },
          { name: "Diet", kg: 28000, percentage: 22 },
          { name: "Water", kg: 19000, percentage: 16 },
        ],
        lastUpdated: "2025-01-09T12:00:00.000Z",
      };

      vi.spyOn(CommunityService, "getCommunityFootprint").mockResolvedValue(mockFootprint);

      const res = await request(app).get("/api/community/footprint");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockFootprint);
    });

    it("should handle empty data gracefully", async () => {
      const emptyFootprint = {
        totalCO2SavedKg: 0,
        activeMembers: 0,
        categories: [],
        lastUpdated: expect.any(String),
      };

      vi.spyOn(CommunityService, "getCommunityFootprint").mockResolvedValue(emptyFootprint);

      const res = await request(app).get("/api/community/footprint");

      expect(res.status).toBe(200);
      expect(res.body.totalCO2SavedKg).toBe(0);
      expect(res.body.activeMembers).toBe(0);
      expect(res.body.categories).toEqual([]);
    });

    it("should handle server errors", async () => {
      vi.spyOn(CommunityService, "getCommunityFootprint").mockRejectedValue(new Error("Database error"));

      const res = await request(app).get("/api/community/footprint");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });

  describe("POST /api/community/refresh", () => {
    it("should refresh community data", async () => {
      const mockFootprint = {
        totalCO2SavedKg: 125000,
        activeMembers: 4700,
        categories: [
          { name: "Transport", kg: 43000, percentage: 34 },
          { name: "Energy", kg: 35000, percentage: 28 },
        ],
        lastUpdated: "2025-01-09T12:00:00.000Z",
      };

      vi.spyOn(CommunityService, "refreshCommunityData").mockResolvedValue(mockFootprint);

      const res = await request(app).post("/api/community/refresh");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockFootprint);
    });

    it("should handle refresh errors", async () => {
      vi.spyOn(CommunityService, "refreshCommunityData").mockRejectedValue(new Error("Refresh failed"));

      const res = await request(app).post("/api/community/refresh");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });
});

describe("CommunityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any global mocks
    vi.restoreAllMocks();
  });

  describe("percentage calculation", () => {
    it("should ensure percentages sum to 100%", async () => {
      // Mock data that would result in percentages not summing to 100
      const mockUserPledges = [
        { userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
        { userId: "user2", pledgeId: "pledge2", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Transport pledge", category: "transport", estimatedCO2Reduction: "100kg CO2/year" },
        { id: "pledge2", title: "Energy pledge", category: "energy", estimatedCO2Reduction: "200kg CO2/year" },
      ];

      // Mock the getAllUserPledges method to return our test data
      vi.spyOn(CommunityService as any, "getAllUserPledges").mockReturnValue(mockUserPledges);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });

      const footprint = await CommunityService.refreshCommunityData();
      
      // Calculate total percentage
      const totalPercentage = footprint.categories.reduce((sum, cat) => sum + cat.percentage, 0);
      expect(totalPercentage).toBe(100);
    });

    it("should handle zero total CO2", async () => {
      vi.spyOn(CommunityService as any, "getAllUserPledges").mockReturnValue([]);
      
      const footprint = await CommunityService.refreshCommunityData();
      
      expect(footprint.totalCO2SavedKg).toBe(0);
      expect(footprint.activeMembers).toBe(0);
      expect(footprint.categories).toEqual([]);
    });

    it("should format category names correctly", async () => {
      const mockUserPledges = [
        { userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Test pledge", category: "transport", estimatedCO2Reduction: "100kg CO2/year" },
      ];

      vi.spyOn(CommunityService as any, "getAllUserPledges").mockReturnValue(mockUserPledges);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });

      const footprint = await CommunityService.refreshCommunityData();
      
      expect(footprint.categories[0].name).toBe("Transport");
    });

    it("should handle missing pledge definitions", async () => {
      const mockUserPledges = [
        { userId: "user1", pledgeId: "nonexistent", dateAdded: new Date().toISOString() },
      ];

      vi.spyOn(CommunityService as any, "getAllUserPledges").mockReturnValue(mockUserPledges);
      vi.mocked(PledgesService.getPledgeById).mockResolvedValue(undefined);

      const footprint = await CommunityService.refreshCommunityData();
      
      expect(footprint.totalCO2SavedKg).toBe(0);
      expect(footprint.activeMembers).toBe(0);
    });

    it("should handle pledges without estimatedCO2Reduction", async () => {
      const mockUserPledges = [
        { userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Energy pledge", category: "energy" }, // No estimatedCO2Reduction
      ];

      vi.spyOn(CommunityService as any, "getAllUserPledges").mockReturnValue(mockUserPledges);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });

      const footprint = await CommunityService.refreshCommunityData();
      
      // Should use fallback value for energy category (120)
      expect(footprint.totalCO2SavedKg).toBe(120);
      expect(footprint.categories[0].kg).toBe(120);
    });

    it("should parse CO2 reduction values correctly", async () => {
      const testCases = [
        { input: "100kg CO2/year", expected: 100 },
        { input: "1.5t CO2/year", expected: 1500 },
        { input: "250 kg", expected: 250 },
        { input: "2T", expected: 2000 },
        { input: "invalid format", expected: 350 }, // fallback for transport category
      ];

      for (const testCase of testCases) {
        const mockUserPledges = [
          { userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
        ];

        const mockPledges = [
          { 
            id: "pledge1", 
            title: "Test pledge", 
            category: "transport", 
            estimatedCO2Reduction: testCase.input 
          },
        ];

        vi.spyOn(CommunityService as any, "getAllUserPledges").mockReturnValue(mockUserPledges);
        vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
          return mockPledges.find(p => p.id === id) as any;
        });

        const footprint = await CommunityService.refreshCommunityData();
        
        expect(footprint.totalCO2SavedKg).toBe(testCase.expected);
      }
    });
  });
});
