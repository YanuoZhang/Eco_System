// Community routes

import { Router, Request, Response } from "express";
import { CommunityService } from "../services/communityService";

const router = Router();

// GET /api/community/footprint - Public community data
router.get("/footprint", async (req: Request, res: Response) => {
  try {
    const footprint = await CommunityService.getCommunityFootprint();
    res.json(footprint);
  } catch (error) {
    console.error("Error fetching community footprint:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch community footprint data",
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/community/refresh - Admin refresh endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    // In production, add admin authentication here
    const footprint = await CommunityService.refreshCommunityData();
    res.json({
      success: true,
      message: "Community data refreshed successfully",
      data: footprint,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing community data:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to refresh community data",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
