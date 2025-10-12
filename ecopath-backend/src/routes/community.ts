// Community statistics routes
import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

// GET /api/community/stats - Get real community statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    console.log("📊 Fetching real community statistics...");

    // Get total users who have made pledges
    const usersQuery = `
      SELECT COUNT(DISTINCT user_id) as total_users
      FROM user_pledges
      WHERE created_at >= NOW() - INTERVAL '1 year'
    `;
    const usersResult = await pool.query(usersQuery);
    const totalUsers = parseInt(usersResult.rows[0]?.total_users || "0");

    // Get total pledges made
    const pledgesQuery = `
      SELECT COUNT(*) as total_pledges
      FROM user_pledges
      WHERE created_at >= NOW() - INTERVAL '1 year'
    `;
    const pledgesResult = await pool.query(pledgesQuery);
    const totalPledges = parseInt(pledgesResult.rows[0]?.total_pledges || "0");

    // Get pledge categories breakdown
    const categoriesQuery = `
      SELECT 
        p.category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM user_pledges up
      JOIN pledges p ON up.pledge_id = p.id
      WHERE up.created_at >= NOW() - INTERVAL '1 year'
      GROUP BY p.category
      ORDER BY count DESC
    `;
    const categoriesResult = await pool.query(categoriesQuery);

    const topPledges = categoriesResult.rows.map((row: any) => ({
      type: row.category,
      percentage: parseFloat(row.percentage),
      count: parseInt(row.count),
      color: getCategoryColor(row.category),
    }));

    // Estimate total CO2 savings based on pledge types
    const savingsQuery = `
      SELECT 
        p.category,
        COUNT(*) as count,
        CASE 
          WHEN p.category = 'TRANSPORT' THEN COUNT(*) * 680
          WHEN p.category = 'ENERGY' THEN COUNT(*) * 420
          WHEN p.category = 'FOOD' THEN COUNT(*) * 600
          WHEN p.category = 'WATER' THEN COUNT(*) * 180
          ELSE COUNT(*) * 300
        END as estimated_savings_kg
      FROM user_pledges up
      JOIN pledges p ON up.pledge_id = p.id
      WHERE up.created_at >= NOW() - INTERVAL '1 year'
      GROUP BY p.category
    `;
    const savingsResult = await pool.query(savingsQuery);
    const totalSavings = savingsResult.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.estimated_savings_kg || "0"),
      0,
    );

    const response = {
      totalUsers,
      totalPledges,
      totalSavings: Math.round(totalSavings / 1000), // Convert to tons
      topPledges,
      lastUpdated: new Date().toISOString(),
      dataSource: "database",
    };

    console.log(
      `✅ Community stats: ${totalUsers} users, ${totalPledges} pledges, ${response.totalSavings} tons saved`,
    );
    return res.json(response);
  } catch (error) {
    console.error("❌ Error fetching community statistics:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch community statistics",
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper function to assign colors to categories
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    TRANSPORT: "bg-emerald-500",
    ENERGY: "bg-blue-500",
    FOOD: "bg-orange-500",
    WATER: "bg-cyan-500",
    WASTE: "bg-purple-500",
  };
  return colorMap[category] || "bg-gray-500";
}

export default router;
