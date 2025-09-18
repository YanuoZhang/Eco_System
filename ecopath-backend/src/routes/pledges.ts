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

// User pledges CRUD (in-memory)
router.get("/user", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || "anonymous";
  const data = UserPledgesService.list(userId);
  res.json({ success: true, data, timestamp: new Date().toISOString() } as ApiResponse);
});

router.post("/user", (req: Request, res: Response) => {
  const body = req.body as SaveUserPledgesRequest;
  if (!body?.userId || !Array.isArray(body.pledges))
    return res
      .status(400)
      .json({ success: false, error: "userId and pledges are required" } as ApiResponse);
  const added = UserPledgesService.save(body);
  res
    .status(201)
    .json({ success: true, data: added, timestamp: new Date().toISOString() } as ApiResponse);
});

router.patch("/user/:recordId", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.body?.userId as string) || "anonymous";
  const recordId = req.params.recordId;
  const updated = UserPledgesService.reschedule(
    userId,
    recordId,
    req.body as RescheduleUserPledgeRequest,
  );
  if (!updated)
    return res.status(404).json({ success: false, error: "Record not found" } as ApiResponse);
  res.json({ success: true, data: updated, timestamp: new Date().toISOString() } as ApiResponse);
});

router.delete("/user/:recordId", (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.body?.userId as string) || "anonymous";
  const ok = UserPledgesService.remove(userId, req.params.recordId);
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
