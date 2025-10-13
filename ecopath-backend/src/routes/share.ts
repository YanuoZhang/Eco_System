// Share link routes

import { Router, Request, Response } from "express";
import { ShareLinkService } from "../services/shareLinkService";

const router = Router();

// GET /api/share-link - Generate shareable link with optional QR code
router.get("/share-link", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const campaign = req.query.campaign as string | undefined;
    const includeQRCode = req.query.qr === "true" || req.query.includeQRCode === "true";
    const landingPage = (req.query.landingPage as string) || "/";

    const shareLink = await ShareLinkService.generateShareLink({
      userId,
      campaign,
      includeQRCode,
      landingPage,
    });

    res.json({
      success: true,
      data: shareLink,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate share link",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/share-link/qr - Generate public QR code (no tracking)
router.get("/share-link/qr", async (req: Request, res: Response) => {
  try {
    const landingPage = (req.query.landingPage as string) || "/";

    const qrCodeDataUrl = await ShareLinkService.generatePublicQRCode(landingPage);

    res.json({
      success: true,
      data: {
        qrCodeDataUrl,
        url: `${process.env.PUBLIC_URL || "https://ecopath.me"}${landingPage}?source=qr_public`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate QR code",
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/share-link/track - Track referral click
router.post("/share-link/track", async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        error: "Missing referralCode",
        message: "referralCode is required",
        timestamp: new Date().toISOString(),
      });
    }

    ShareLinkService.trackReferralClick(referralCode);

    res.json({
      success: true,
      message: "Referral click tracked",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error tracking referral click:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to track referral click",
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/share-link/analytics/:referralCode - Get referral analytics
router.get("/share-link/analytics/:referralCode", async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.params;

    const analytics = ShareLinkService.getReferralAnalytics(referralCode);

    if (!analytics) {
      return res.status(404).json({
        error: "Not found",
        message: "Referral code not found",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching referral analytics:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch referral analytics",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
