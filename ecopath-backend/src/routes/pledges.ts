import { Router, Request, Response } from "express";
import { PledgesService } from "../services/pledgesService";
import { AIRecommendationService } from "../services/aiRecommendationService";
import { ApiResponse, QuizData } from "../types";

const router = Router();

/**
 * @swagger
 * /api/pledges:
 *   get:
 *     summary: Get all public pledges
 *     description: Retrieve a paginated list of public eco-friendly pledges with optional filtering
 *     tags: [Pledges]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of pledges per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [energy, transport, waste, water, food, lifestyle]
 *         description: Filter by pledge category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by pledge difficulty
 *       - in: query
 *         name: impact
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by environmental impact level
 *     responses:
 *       200:
 *         description: Successfully retrieved pledges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pledge'
 *                 totalPledges:
 *                   type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const impact = req.query.impact as string;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        error: "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 50.",
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const result = await PledgesService.getPublicPledges(page, limit, category, difficulty, impact);
    res.json(result);
  } catch (error) {
    console.error("Error fetching pledges:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching pledges",
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * @swagger
 * /api/pledges/categories:
 *   get:
 *     summary: Get all pledge categories
 *     description: Retrieve a list of all available pledge categories
 *     tags: [Pledges]
 *     responses:
 *       200:
 *         description: Successfully retrieved categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timestamp:
 *                   type: string
 */
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await PledgesService.getCategories();
    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    } as ApiResponse<string[]>);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching categories",
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * @swagger
 * /api/pledges/search:
 *   get:
 *     summary: Search pledges
 *     description: Search pledges by title or description
 *     tags: [Pledges]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Successfully retrieved search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pledge'
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Bad request - missing search query
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const results = await PledgesService.searchPledges(query);
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error) {
    console.error("Error searching pledges:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while searching pledges",
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * @swagger
 * /api/pledges/{id}:
 *   get:
 *     summary: Get pledge by ID
 *     description: Retrieve a specific pledge by its ID
 *     tags: [Pledges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pledge ID
 *     responses:
 *       200:
 *         description: Successfully retrieved pledge
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Pledge'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Pledge not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pledge = await PledgesService.getPledgeById(id);
    
    if (!pledge) {
      return res.status(404).json({
        success: false,
        error: "Pledge not found",
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: pledge,
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching pledge:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching pledge",
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * @swagger
 * /api/pledges/ai-recommendations:
 *   post:
 *     summary: Get AI-powered pledge recommendations
 *     description: Generate personalized eco-friendly pledge recommendations based on user's quiz data
 *     tags: [Pledges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *               electricity:
 *                 type: object
 *                 properties:
 *                   usage:
 *                     type: number
 *                   timeUnit:
 *                     type: string
 *                     enum: [month, quarter, year]
 *                   bill:
 *                     type: number
 *                   household:
 *                     type: number
 *                   ledBulbs:
 *                     type: string
 *                     enum: [yes, no, mixed]
 *                   airConditioning:
 *                     type: string
 *                     enum: [frequently, rarely, seasonally]
 *                   efficientAppliances:
 *                     type: string
 *                     enum: [yes, no, mixed]
 *               hotWater:
 *                 type: object
 *                 properties:
 *                   system:
 *                     type: string
 *                     enum: [electric, gas, solar]
 *                   usage:
 *                     type: number
 *                   timeUnit:
 *                     type: string
 *                     enum: [month, quarter, year]
 *                   household:
 *                     type: number
 *                   energySaving:
 *                     type: boolean
 *               transport:
 *                 type: object
 *                 properties:
 *                   modes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         mode:
 *                           type: string
 *                           enum: [car, bus, train, tram, bicycle, walking]
 *                         distance:
 *                           type: number
 *                         frequency:
 *                           type: number
 *               appliances:
 *                 type: object
 *                 properties:
 *                   weeklyUsage:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         appliance:
 *                           type: string
 *                         hoursPerWeek:
 *                           type: number
 *                         energyEfficient:
 *                           type: boolean
 *     responses:
 *       200:
 *         description: Successfully generated AI recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AIRecommendedPledge'
 *                 totalRecommendations:
 *                   type: integer
 *                 quizData:
 *                   type: object
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Bad request - invalid quiz data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post("/ai-recommendations", async (req: Request, res: Response) => {
  try {
    const quizData: QuizData = req.body;

    // Validate required fields
    if (!quizData) {
      return res.status(400).json({
        success: false,
        error: "Quiz data is required",
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const result = await AIRecommendationService.generateRecommendations(quizData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while generating AI recommendations",
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

export default router;
