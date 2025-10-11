import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../index";
import { UserImpactService } from "../services/userImpactService";
import { UserPledgesService } from "../services/userPledgesService";
import { PledgesService } from "../services/pledgesService";
import { CommunityService } from "../services/communityService";

// Mock the services
vi.mock("../services/userPledgesService");
vi.mock("../services/pledgesService");
vi.mock("../services/communityService");

describe("User Impact Summary API", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/users/me/impact-summary", () => {
    it("should require authentication", async () => {
      const res = await request(app).get("/api/users/me/impact-summary");
      expect(res.status).toBe(401);
    });

    it("should return impact summary for user with pledges", async () => {
      const mockUserPledges = [
        { id: "1", userId, pledgeId: "pledge1", dateAdded: new Date().toISOString() },
        { id: "2", userId, pledgeId: "pledge2", dateAdded: new Date().toISOString() },
        { id: "3", userId, pledgeId: "pledge3", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Bike to Work Twice Weekly", category: "transport", estimatedCO2Reduction: "300kg CO2/year" },
        { id: "pledge2", title: "Switch to LED Bulbs", category: "energy", estimatedCO2Reduction: "120kg CO2/year" },
        { id: "pledge3", title: "Meatless Monday", category: "diet", estimatedCO2Reduction: "200kg CO2/year" },
      ];

      const mockCommunityData = {
        totalCO2SavedKg: 125000,
        activeMembers: 4700,
        categories: [],
        lastUpdated: new Date().toISOString(),
      };

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue(mockCommunityData);

      const res = await request(app)
        .get("/api/users/me/impact-summary")
        .set("Authorization", `Bearer ${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.activePledges).toBe(3);
      expect(res.body.co2SavedKg).toBe(620); // 300 + 120 + 200
      expect(res.body.reductionPercent).toBe(4); // 620/15000 * 100
      expect(res.body.completedPledges).toEqual([
        "Bike to Work Twice Weekly",
        "Switch to LED Bulbs", 
        "Meatless Monday"
      ]);
      expect(res.body.communityCO2SavedKg).toBe(125000);
      
      // Check equivalent calculations
      // 620kg CO2 / 21kg per tree = 29.5 -> 30 trees
      expect(res.body.equivalents.treesPlanted).toBe(30);
      // 620kg CO2 / 0.411kg per mile = 1508.5 -> 1509 miles
      expect(res.body.equivalents.milesNotDriven).toBe(1509);
      // 620kg CO2 / 2.7kg per LED bulb = 229.6 -> 230 LED bulbs
      expect(res.body.equivalents.ledBulbs).toBe(230);
    });

    it("should return empty summary for user with no pledges", async () => {
      vi.mocked(UserPledgesService.list).mockReturnValue([]);
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
        totalCO2SavedKg: 125000,
        activeMembers: 4700,
        categories: [],
        lastUpdated: new Date().toISOString(),
      });

      const res = await request(app)
        .get("/api/users/me/impact-summary")
        .set("Authorization", `Bearer ${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.activePledges).toBe(0);
      expect(res.body.co2SavedKg).toBe(0);
      expect(res.body.reductionPercent).toBe(0);
      expect(res.body.completedPledges).toEqual([]);
      expect(res.body.equivalents.treesPlanted).toBe(0);
      expect(res.body.equivalents.milesNotDriven).toBe(0);
      expect(res.body.equivalents.ledBulbs).toBe(0);
    });

    it("should handle missing pledge definitions", async () => {
      const mockUserPledges = [
        { id: "1", userId, pledgeId: "nonexistent", dateAdded: new Date().toISOString() },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockResolvedValue(undefined);
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
        totalCO2SavedKg: 0,
        activeMembers: 0,
        categories: [],
        lastUpdated: new Date().toISOString(),
      });

      const res = await request(app)
        .get("/api/users/me/impact-summary")
        .set("Authorization", `Bearer ${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.activePledges).toBe(1);
      expect(res.body.co2SavedKg).toBe(0);
      expect(res.body.completedPledges).toEqual([]);
    });

    it("should handle community service failure gracefully", async () => {
      const mockUserPledges = [
        { id: "1", userId, pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Test Pledge", category: "energy", estimatedCO2Reduction: "100kg CO2/year" },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });
      vi.mocked(CommunityService.getCommunityFootprint).mockRejectedValue(new Error("Community service down"));

      const res = await request(app)
        .get("/api/users/me/impact-summary")
        .set("Authorization", `Bearer ${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.co2SavedKg).toBe(100);
      expect(res.body.communityCO2SavedKg).toBe(0); // Fallback when community service fails
    });

    it("should handle server errors", async () => {
      vi.mocked(UserPledgesService.list).mockImplementation(() => {
        throw new Error("Database error");
      });

      const res = await request(app)
        .get("/api/users/me/impact-summary")
        .set("Authorization", `Bearer ${userId}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });
});

describe("UserImpactService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("equivalent calculations", () => {
    it("should calculate equivalent metrics correctly", async () => {
      const mockUserPledges = [
        { id: "1", userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "High Impact Pledge", category: "transport", estimatedCO2Reduction: "1000kg CO2/year" },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
        totalCO2SavedKg: 50000,
        activeMembers: 1000,
        categories: [],
        lastUpdated: new Date().toISOString(),
      });

      const summary = await UserImpactService.getUserImpactSummary("user1");

      // 1000kg CO2 equivalents:
      // Trees: 1000 / 21 = 47.6 -> 48
      expect(summary.equivalents.treesPlanted).toBe(48);
      // Miles: 1000 / 0.411 = 2433.1 -> 2433
      expect(summary.equivalents.milesNotDriven).toBe(2433);
      // LED bulbs: 1000 / 2.7 = 370.4 -> 370
      expect(summary.equivalents.ledBulbs).toBe(370);
    });

    it("should handle reduction percentage calculation", async () => {
      const mockUserPledges = [
        { id: "1", userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "High Impact Pledge", category: "transport", estimatedCO2Reduction: "3000kg CO2/year" },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
        totalCO2SavedKg: 50000,
        activeMembers: 1000,
        categories: [],
        lastUpdated: new Date().toISOString(),
      });

      const summary = await UserImpactService.getUserImpactSummary("user1");

      // 3000kg / 15000kg baseline * 100 = 20%
      expect(summary.reductionPercent).toBe(20);
    });

    it("should clamp reduction percentage between 0-100%", async () => {
      const mockUserPledges = [
        { id: "1", userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Extreme Impact Pledge", category: "transport", estimatedCO2Reduction: "20000kg CO2/year" },
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
        totalCO2SavedKg: 50000,
        activeMembers: 1000,
        categories: [],
        lastUpdated: new Date().toISOString(),
      });

      const summary = await UserImpactService.getUserImpactSummary("user1");

      // Should be clamped to 100% even though 20000/15000 * 100 = 133%
      expect(summary.reductionPercent).toBe(100);
    });

    it("should handle pledges without estimatedCO2Reduction", async () => {
      const mockUserPledges = [
        { id: "1", userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
      ];

      const mockPledges = [
        { id: "pledge1", title: "Transport Pledge", category: "transport" }, // No estimatedCO2Reduction
      ];

      vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
      vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
        return mockPledges.find(p => p.id === id) as any;
      });
      vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
        totalCO2SavedKg: 50000,
        activeMembers: 1000,
        categories: [],
        lastUpdated: new Date().toISOString(),
      });

      const summary = await UserImpactService.getUserImpactSummary("user1");

      // Should use fallback value for transport category (350kg)
      expect(summary.co2SavedKg).toBe(350);
    });

    it("should parse different CO2 reduction formats", async () => {
      const testCases = [
        { input: "500kg CO2/year", expected: 500 },
        { input: "1.5t CO2/year", expected: 1500 },
        { input: "250 kg", expected: 250 },
        { input: "2T", expected: 2000 },
      ];

      for (const testCase of testCases) {
        const mockUserPledges = [
          { id: "1", userId: "user1", pledgeId: "pledge1", dateAdded: new Date().toISOString() },
        ];

        const mockPledges = [
          { id: "pledge1", title: "Test Pledge", category: "transport", estimatedCO2Reduction: testCase.input },
        ];

        vi.mocked(UserPledgesService.list).mockReturnValue(mockUserPledges as any);
        vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
          return mockPledges.find(p => p.id === id) as any;
        });
        vi.mocked(CommunityService.getCommunityFootprint).mockResolvedValue({
          totalCO2SavedKg: 50000,
          activeMembers: 1000,
          categories: [],
          lastUpdated: new Date().toISOString(),
        });

        const summary = await UserImpactService.getUserImpactSummary("user1");
        expect(summary.co2SavedKg).toBe(testCase.expected);
      }
    });
  });
});
