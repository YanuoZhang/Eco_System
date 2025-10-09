import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../index";
import { UserPledgesService } from "../services/userPledgesService";
import { PledgesService } from "../services/pledgesService";

vi.mock("../services/userPledgesService", () => ({
  UserPledgesService: {
    list: vi.fn(),
  },
}));

vi.mock("../services/pledgesService", () => ({
  PledgesService: {
    getPledgeById: vi.fn(),
  },
}));

describe("GET /api/emissions/by-pledge", () => {
  const userId = "user-abc";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require authentication", async () => {
    const res = await request(app).get("/api/emissions/by-pledge");
    expect(res.status).toBe(401);
  });

  it("should return empty array when no user pledges", async () => {
    vi.mocked(UserPledgesService.list).mockReturnValue([]);

    const res = await request(app)
      .get("/api/emissions/by-pledge")
      .set("Authorization", `Bearer ${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should aggregate savings per pledge and sum duplicates", async () => {
    vi.mocked(UserPledgesService.list).mockReturnValue([
      { id: "1", userId, pledgeId: "p1", dateAdded: new Date().toISOString() } as any,
      { id: "2", userId, pledgeId: "p1", dateAdded: new Date().toISOString() } as any,
      { id: "3", userId, pledgeId: "p2", dateAdded: new Date().toISOString() } as any,
    ]);

    vi.mocked(PledgesService.getPledgeById).mockImplementation(async (id: string) => {
      if (id === "p1") return { id: "p1", title: "Use LED bulbs", category: "energy", estimatedCO2Reduction: "120kg CO2/year", isPublic: true, createdAt: "", updatedAt: "" } as any;
      if (id === "p2") return { id: "p2", title: "Public transport", category: "transport", estimatedCO2Reduction: "350kg CO2/year", isPublic: true, createdAt: "", updatedAt: "" } as any;
      return undefined;
    });

    const res = await request(app)
      .get("/api/emissions/by-pledge")
      .set("Authorization", `Bearer ${userId}`);

    expect(res.status).toBe(200);
    // p1 appears twice -> 120 + 120 = 240
    expect(res.body).toContainEqual({ name: "Use LED bulbs", saving: 240 });
    expect(res.body).toContainEqual({ name: "Public transport", saving: 350 });
  });

  it("should fallback to category defaults when no estimatedCO2Reduction", async () => {
    vi.mocked(UserPledgesService.list).mockReturnValue([
      { id: "1", userId, pledgeId: "p3", dateAdded: new Date().toISOString() } as any,
    ]);

    vi.mocked(PledgesService.getPledgeById).mockResolvedValue({
      id: "p3",
      title: "Cold wash laundry",
      category: "lifestyle",
      isPublic: true,
      createdAt: "",
      updatedAt: "",
    } as any);

    const res = await request(app)
      .get("/api/emissions/by-pledge")
      .set("Authorization", `Bearer ${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toContainEqual({ name: "Cold wash laundry", saving: 90 });
  });
});


