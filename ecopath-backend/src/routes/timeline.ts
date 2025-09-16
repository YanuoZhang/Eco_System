// Timeline routes

import { Router, Request, Response } from "express";
import { getAllTimelineData, getTimelineStats } from "../services/timelineService";

const router = Router();

// Climate Timeline API endpoint
router.get("/", (req: Request, res: Response) => {
  try {
    let data = getAllTimelineData();
    // Normalize: ensure array of periods
    if (!Array.isArray(data)) {
      data = data ? [data as unknown as ReturnType<typeof getAllTimelineData>[number]] : [];
    }
    const stats = getTimelineStats();

    res.json({
      success: true,
      data,
      ...stats,
    });
  } catch (error) {
    console.error("Error in climate timeline API:", error);
    res.status(500).json({ success: false, error: "Failed to fetch climate timeline" });
  }
});

export default router;
