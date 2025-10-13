// User statistics routes
import { Router, Request, Response } from "express";
import { requireUser } from "../middleware/auth";
import { pool } from "../config/database";

const router = Router();

// GET /api/user-stats/impact - Get real user impact statistics
router.get("/impact", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    console.log(`📊 Fetching real user impact stats for user: ${userId}`);

    // Get user's pledges
    const pledgesQuery = `
      SELECT 
        up.id,
        up.title,
        up.category,
        up.created_at,
        up.completed_at,
        up.is_achievement
      FROM user_pledges up
      WHERE up.user_id = $1
      ORDER BY up.created_at DESC
    `;
    const pledgesResult = await pool.query(pledgesQuery, [userId]);
    const userPledges = pledgesResult.rows;

    // Calculate estimated savings based on pledge types
    const estimatedSavings = userPledges.reduce((total: number, pledge: any) => {
      const category = pledge.category?.toLowerCase();
      let savingsPerPledge = 300; // default

      switch (category) {
        case "transport":
          savingsPerPledge = 680;
          break;
        case "energy":
          savingsPerPledge = 420;
          break;
        case "food":
          savingsPerPledge = 600;
          break;
        case "water":
          savingsPerPledge = 180;
          break;
      }

      return total + savingsPerPledge;
    }, 0);

    // Calculate completion rate
    const completedPledges = userPledges.filter((p: any) => p.completed_at !== null).length;
    const completionRate =
      userPledges.length > 0 ? Math.round((completedPledges / userPledges.length) * 100) : 0;

    // Get pledge breakdown by category
    const categoryBreakdown = userPledges.reduce((acc: any, pledge: any) => {
      const category = pledge.category;
      if (!acc[category]) {
        acc[category] = { count: 0, savings: 0 };
      }
      acc[category].count++;
      acc[category].savings += getCategorySavings(category);
      return acc;
    }, {});

    const response = {
      userId,
      totalPledges: userPledges.length,
      completedPledges,
      completionRate,
      estimatedSavingsKg: estimatedSavings,
      estimatedSavingsTons: Math.round(estimatedSavings / 1000),
      categoryBreakdown,
      pledges: userPledges.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        createdAt: p.created_at,
        completedAt: p.completed_at,
        isCompleted: p.completed_at !== null,
      })),
      lastUpdated: new Date().toISOString(),
      dataSource: "database",
    };

    console.log(`✅ User stats: ${userPledges.length} pledges, ${estimatedSavings}kg saved`);
    return res.json(response);
  } catch (error) {
    console.error("❌ Error fetching user impact statistics:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch user impact statistics",
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper function to get savings per category
function getCategorySavings(category: string): number {
  const savingsMap: Record<string, number> = {
    transport: 680,
    energy: 420,
    food: 600,
    water: 180,
    waste: 300,
    general: 300,
    daily: 300,
  };
  return savingsMap[category?.toLowerCase()] || 300;
}

export default router;
