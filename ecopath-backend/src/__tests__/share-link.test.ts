import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../index";
import { ShareLinkService } from "../services/shareLinkService";

describe("Share Link API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/share-link", () => {
    it("should generate a basic share link without QR code", async () => {
      const res = await request(app).get("/api/share-link");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain("source=qr_share");
      expect(res.body.data.qrCodeDataUrl).toBeUndefined();
    });

    it("should generate share link with QR code when requested", async () => {
      const res = await request(app).get("/api/share-link?qr=true");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBeDefined();
      expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it("should generate share link with user tracking", async () => {
      const res = await request(app).get("/api/share-link?userId=user123&qr=false");

      expect(res.status).toBe(200);
      expect(res.body.data.url).toContain("ref=");
      expect(res.body.data.referralCode).toBeDefined();
      expect(res.body.data.referralCode).toMatch(/^[a-f0-9]{8}[a-z0-9]+$/); // hash + timestamp
    });

    it("should include campaign parameter when provided", async () => {
      const res = await request(app).get("/api/share-link?campaign=summer2025");

      expect(res.status).toBe(200);
      expect(res.body.data.url).toContain("campaign=summer2025");
    });

    it("should support custom landing pages", async () => {
      const res = await request(app).get("/api/share-link?landingPage=/quiz");

      expect(res.status).toBe(200);
      expect(res.body.data.url).toContain("/quiz");
    });

    it("should handle errors gracefully", async () => {
      // Mock ShareLinkService to throw error
      vi.spyOn(ShareLinkService, "generateShareLink").mockRejectedValueOnce(
        new Error("QR generation failed")
      );

      const res = await request(app).get("/api/share-link");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });

  describe("GET /api/share-link/qr", () => {
    it("should generate public QR code without tracking", async () => {
      const res = await request(app).get("/api/share-link/qr");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(res.body.data.url).toContain("source=qr_public");
      expect(res.body.data.url).not.toContain("ref=");
    });

    it("should support custom landing page for public QR", async () => {
      const res = await request(app).get("/api/share-link/qr?landingPage=/start");

      expect(res.status).toBe(200);
      expect(res.body.data.url).toContain("/start");
    });
  });

  describe("POST /api/share-link/track", () => {
    it("should track referral clicks", async () => {
      // First generate a share link
      const generateRes = await request(app).get("/api/share-link?userId=user123");
      const referralCode = generateRes.body.data.referralCode;

      // Track a click
      const res = await request(app)
        .post("/api/share-link/track")
        .send({ referralCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Referral click tracked");
    });

    it("should require referralCode parameter", async () => {
      const res = await request(app).post("/api/share-link/track").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Missing referralCode");
    });
  });

  describe("GET /api/share-link/analytics/:referralCode", () => {
    it("should return analytics for valid referral code", async () => {
      // Generate a share link first
      const generateRes = await request(app).get("/api/share-link?userId=user123");
      const referralCode = generateRes.body.data.referralCode;

      // Track some clicks
      await request(app).post("/api/share-link/track").send({ referralCode });
      await request(app).post("/api/share-link/track").send({ referralCode });

      // Get analytics
      const res = await request(app).get(`/api/share-link/analytics/${referralCode}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clicks).toBe(2);
      expect(res.body.data.createdAt).toBeDefined();
    });

    it("should return 404 for invalid referral code", async () => {
      const res = await request(app).get("/api/share-link/analytics/invalid-code");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Not found");
    });
  });
});

describe("ShareLinkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateShareLink", () => {
    it("should generate link without tracking", async () => {
      const result = await ShareLinkService.generateShareLink({});

      expect(result.url).toBeDefined();
      expect(result.url).toContain("source=qr_share");
      expect(result.referralCode).toBeUndefined();
      expect(result.qrCodeDataUrl).toBeUndefined();
    });

    it("should generate link with anonymous referral code", async () => {
      const result = await ShareLinkService.generateShareLink({ userId: "user123" });

      expect(result.referralCode).toBeDefined();
      expect(result.url).toContain(`ref=${result.referralCode}`);
      // Referral code should NOT contain the actual userId
      expect(result.referralCode).not.toContain("user123");
    });

    it("should generate QR code when requested", async () => {
      const result = await ShareLinkService.generateShareLink({ includeQRCode: true });

      expect(result.qrCodeDataUrl).toBeDefined();
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it("should include campaign in URL", async () => {
      const result = await ShareLinkService.generateShareLink({ campaign: "test-campaign" });

      expect(result.url).toContain("campaign=test-campaign");
    });

    it("should use custom landing page", async () => {
      const result = await ShareLinkService.generateShareLink({ landingPage: "/custom" });

      expect(result.url).toContain("/custom");
    });

    it("should generate different referral codes for different users", async () => {
      const result1 = await ShareLinkService.generateShareLink({ userId: "user1" });
      const result2 = await ShareLinkService.generateShareLink({ userId: "user2" });

      expect(result1.referralCode).not.toBe(result2.referralCode);
    });

    it("should generate different referral codes for same user at different times", async () => {
      const result1 = await ShareLinkService.generateShareLink({ userId: "user1" });
      
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = await ShareLinkService.generateShareLink({ userId: "user1" });

      expect(result1.referralCode).not.toBe(result2.referralCode);
    });
  });

  describe("generatePublicQRCode", () => {
    it("should generate QR code for default landing page", async () => {
      const qrCode = await ShareLinkService.generatePublicQRCode();

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it("should generate QR code for custom landing page", async () => {
      const qrCode = await ShareLinkService.generatePublicQRCode("/start");

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("trackReferralClick", () => {
    it("should increment click count for valid referral code", async () => {
      // Generate link first
      const { referralCode } = await ShareLinkService.generateShareLink({ userId: "user123" });

      // Track clicks
      ShareLinkService.trackReferralClick(referralCode!);
      ShareLinkService.trackReferralClick(referralCode!);

      const analytics = ShareLinkService.getReferralAnalytics(referralCode!);
      expect(analytics?.clicks).toBe(2);
    });

    it("should handle invalid referral code gracefully", () => {
      // Should not throw error
      expect(() => {
        ShareLinkService.trackReferralClick("invalid-code");
      }).not.toThrow();
    });
  });

  describe("getReferralAnalytics", () => {
    it("should return null for non-existent referral code", () => {
      const analytics = ShareLinkService.getReferralAnalytics("non-existent");
      expect(analytics).toBeNull();
    });

    it("should return analytics with click count and creation time", async () => {
      const { referralCode } = await ShareLinkService.generateShareLink({ userId: "user123" });

      const analytics = ShareLinkService.getReferralAnalytics(referralCode!);

      expect(analytics).not.toBeNull();
      expect(analytics?.clicks).toBe(0);
      expect(analytics?.createdAt).toBeDefined();
    });
  });
});
