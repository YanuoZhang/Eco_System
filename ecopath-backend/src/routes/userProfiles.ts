// User profiles routes for storing carbon footprint data
import { Router, Request, Response } from "express";
import { requireUser } from "../middleware/auth";
import { pool } from "../config/database";

const router = Router();

// POST /api/user-profiles/carbon-footprint - Save user's carbon footprint data from quiz
router.post("/carbon-footprint", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const carbonFootprintData = req.body;

    console.log(`📊 Saving carbon footprint data for user: ${userId}`);

    // Validate required fields
    if (!carbonFootprintData.totals || !carbonFootprintData.totals.totalKgYear) {
      return res.status(400).json({
        success: false,
        error: "Missing required carbon footprint data",
      });
    }

    // Insert or update user's carbon footprint data
    const query = `
      INSERT INTO user_profiles (user_id, carbon_footprint_data, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        carbon_footprint_data = EXCLUDED.carbon_footprint_data,
        updated_at = NOW()
      RETURNING id, created_at, updated_at
    `;

    const result = await pool.query(query, [userId, JSON.stringify(carbonFootprintData)]);

    console.log(
      `✅ Carbon footprint data saved for user ${userId}: ${carbonFootprintData.totals.totalKgYear} kg/year`,
    );

    return res.status(201).json({
      success: true,
      message: "Carbon footprint data saved successfully",
      data: {
        userId,
        totalKgYear: carbonFootprintData.totals.totalKgYear,
        state: carbonFootprintData.state,
        savedAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error saving carbon footprint data:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to save carbon footprint data",
    });
  }
});

// GET /api/user-profiles/carbon-footprint - Get user's carbon footprint data
router.get("/carbon-footprint", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    console.log(`📊 Fetching carbon footprint data for user: ${userId}`);

    const query = `
      SELECT carbon_footprint_data, created_at, updated_at
      FROM user_profiles 
      WHERE user_id = $1 
      ORDER BY updated_at DESC LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Carbon footprint data not found",
        message: "User has not completed the carbon footprint quiz",
      });
    }

    const carbonData = result.rows[0].carbon_footprint_data;

    return res.json({
      success: true,
      data: carbonData,
      metadata: {
        savedAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching carbon footprint data:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch carbon footprint data",
    });
  }
});

export default router;
