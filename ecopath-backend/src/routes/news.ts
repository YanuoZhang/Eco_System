// News routes

import { Router, Request, Response } from "express";
import {
  getNewsData,
  getNewsByCategory,
  getNewsById,
  performWeeklyNewsUpdate,
  getCacheInfo,
} from "../services/newsService";
import { summarizeText } from "../gemini";

const router = Router();

// Climate-related news API endpoint (filtered)
router.get("/climate", async (req: Request, res: Response) => {
  try {
    const newsItems = await getNewsData();
    const cacheInfo = getCacheInfo();

    res.json({
      success: true,
      data: newsItems,
      cached: cacheInfo.isCacheValid,
      lastUpdated: new Date(cacheInfo.lastFetchTime).toISOString(),
    });
  } catch (error) {
    console.error("Error in climate news API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch climate news",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// News by category endpoint
router.get("/climate/category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const validCategories = ["Critical", "High Risk", "Warning", "Update", "Positive", "Neutral"];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: "Invalid category",
        message: `Category must be one of: ${validCategories.join(", ")}`,
      });
    }

    const filteredNews = await getNewsByCategory(category);

    res.json({
      success: true,
      data: filteredNews,
      category,
      count: filteredNews.length,
    });
  } catch (error) {
    console.error("Error in climate news category API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch climate news by category",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Individual news item endpoint
router.get("/climate/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsItem = await getNewsById(id);

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        error: "News item not found",
        message: `No news item found with ID: ${id}`,
      });
    }

    res.json({
      success: true,
      data: newsItem,
    });
  } catch (error) {
    console.error("Error in individual news API:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Manual news update endpoint
router.post("/climate/update", async (req: Request, res: Response) => {
  try {
    console.log("Manual news update triggered via API...");
    await performWeeklyNewsUpdate();
    const cacheInfo = getCacheInfo();

    res.json({
      success: true,
      message: "News update completed successfully",
      lastUpdated: new Date(cacheInfo.lastFetchTime).toISOString(),
      articleCount: cacheInfo.articleCount,
    });
  } catch (error) {
    console.error("Error in manual news update:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update news",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Summarize arbitrary text via Gemini
router.post("/summarize", async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text?: string };
    if (!text) {
      return res.status(400).json({ success: false, error: "Missing text" });
    }

    const summary = await summarizeText(text);
    res.json({ success: true, summary });
  } catch (err) {
    console.error("Summarization API error:", err);
    res.status(500).json({ success: false, error: "Summarization failed" });
  }
});

export default router;
