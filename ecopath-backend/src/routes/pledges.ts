import { Router, Request, Response } from "express";
import { PledgesService } from "../services/pledgesService";
import { AIRecommendationService } from "../services/aiRecommendationService";
import {
  ApiResponse,
  QuizData,
  RescheduleUserPledgeRequest,
  SaveUserPledgesRequest,
} from "../types";
import { UserPledgesService } from "../services/userPledgesService";
import { CompletedPledgesService } from "../services/completedPledgesService";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const category = (req.query.category as string) || undefined;
  const difficulty = (req.query.difficulty as string) || undefined;
  const impact = (req.query.impact as string) || undefined;
  const result = await PledgesService.getPublicPledges(page, limit, category, difficulty, impact);
  res.json(result);
});

router.get("/categories", async (_req: Request, res: Response) => {
  const categories = await PledgesService.getCategories();
  res.json({ success: true, data: categories, timestamp: new Date().toISOString() } as ApiResponse);
});

router.get("/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  if (!q)
    return res
      .status(400)
      .json({ success: false, error: "Search query is required" } as ApiResponse);
  const data = await PledgesService.searchPledges(q);
  res.json({ success: true, data, timestamp: new Date().toISOString() } as ApiResponse);
});

router.post("/ai-recommendations", async (req: Request, res: Response) => {
  const quizData = req.body as QuizData;
  const out = await AIRecommendationService.generateRecommendations(quizData);
  res.status(out.success ? 200 : 400).json(out);
});

// User pledges CRUD (database-backed)

router.get("/user", async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "anonymous";
  const type = req.query.type as string;

  if (type === "completed") {
    // Get completed pledges (is_achievement = true)
    const data = await UserPledgesService.list(userId);
    const completedPledges = data.filter((pledge) => pledge.isAchievement);
    res.json({
      success: true,
      data: completedPledges,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  } else if (type === "completed-stats") {
    const data = await UserPledgesService.list(userId);
    const completedPledges = data.filter((pledge) => pledge.isAchievement);
    const stats = {
      totalCompleted: completedPledges.length,
      completedByCategory: completedPledges.reduce(
        (acc, pledge) => {
          const category = pledge.category || "general";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentCompletions: completedPledges.slice(0, 5),
    };
    res.json({ success: true, data: stats, timestamp: new Date().toISOString() } as ApiResponse);
  } else {
    // Get active pledges (is_achievement = false)
    const data = await UserPledgesService.list(userId);
    const activePledges = data.filter((pledge) => !pledge.isAchievement);
    res.json({
      success: true,
      data: activePledges,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }
});

router.post("/user", async (req: Request, res: Response) => {
  const body = req.body as SaveUserPledgesRequest;
  if (!body?.userId || !Array.isArray(body.pledges))
    return res
      .status(400)
      .json({ success: false, error: "userId and pledges are required" } as ApiResponse);
  const added = await UserPledgesService.save(body);
  res
    .status(201)
    .json({ success: true, data: added, timestamp: new Date().toISOString() } as ApiResponse);
});

router.patch("/user/:recordId", async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.body?.userId as string) || "anonymous";
  const recordId = req.params.recordId;
  const updated = await UserPledgesService.reschedule(
    userId,
    recordId,
    req.body as RescheduleUserPledgeRequest,
  );
  if (!updated)
    return res.status(404).json({ success: false, error: "Record not found" } as ApiResponse);
  res.json({ success: true, data: updated, timestamp: new Date().toISOString() } as ApiResponse);
});

router.post("/user/:recordId/complete", async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.body?.userId as string) || "anonymous";
  const recordId = req.params.recordId;
  const result = await UserPledgesService.markCompleted(userId, recordId);
  if (!result.success)
    return res.status(404).json({ success: false, error: result.message } as ApiResponse);
  res.json({
    success: true,
    data: result,
    message: result.message,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

router.delete("/user/:recordId", async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.body?.userId as string) || "anonymous";
  const ok = await UserPledgesService.remove(userId, req.params.recordId);
  if (!ok)
    return res.status(404).json({ success: false, error: "Record not found" } as ApiResponse);
  res.json({
    success: true,
    message: "Deleted",
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

// Keep dynamic route last to avoid shadowing more specific routes like /user
router.get("/:id", async (req: Request, res: Response) => {
  const pledge = await PledgesService.getPledgeById(req.params.id);
  if (!pledge)
    return res.status(404).json({ success: false, error: "Pledge not found" } as ApiResponse);
  res.json({ success: true, data: pledge, timestamp: new Date().toISOString() } as ApiResponse);
});

export default router;
