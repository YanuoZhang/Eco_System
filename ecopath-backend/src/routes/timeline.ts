// Timeline routes

import { Router, Request, Response } from "express";
import {
  getAllTimelineData,
  getTimelineByPeriod,
  getTimelineStats,
  getAvailablePeriods,
} from "../services/timelineService";

const router = Router();

// Climate Timeline API endpoint with fallback
router.get("/", (req: Request, res: Response) => {
  try {
    const data = getAllTimelineData();
    const stats = getTimelineStats();

    res.json({
      success: true,
      data,
      ...stats,
    });
  } catch (error) {
    console.error("Error in climate timeline API:", error);

    // Fallback: redirect to static JSON file
    res.redirect("/climate-timeline.json");
  }
});

// Climate Timeline by period endpoint
router.get("/:period", (req: Request, res: Response) => {
  try {
    const { period } = req.params;
    const periodIndex = parseInt(period);

    if (isNaN(periodIndex)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period",
        message: "Period must be a number",
        availablePeriods: getAvailablePeriods(),
      });
    }

    const timelinePeriod = getTimelineByPeriod(periodIndex);

    if (!timelinePeriod) {
      return res.status(400).json({
        success: false,
        error: "Invalid period",
        message: `Period must be between 0 and ${getAllTimelineData().length - 1}`,
        availablePeriods: getAvailablePeriods(),
      });
    }

    res.json({
      success: true,
      data: timelinePeriod,
      totalEvents: timelinePeriod.events.length,
    });
  } catch (error) {
    console.error("Error in climate timeline period API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch climate timeline period",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
