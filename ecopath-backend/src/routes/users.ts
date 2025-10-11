// User routes

import { Router, Request, Response } from "express";
import { requireUser } from "../middleware/auth";
import { UserImpactService } from "../services/userImpactService";

const router = Router();

// GET /api/users/me/impact-summary - User's climate impact summary
router.get("/me/impact-summary", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    
    const impactSummary = await UserImpactService.getUserImpactSummary(userId);
    
    res.json(impactSummary);
  } catch (error) {
    console.error("Error fetching user impact summary:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user impact summary",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
