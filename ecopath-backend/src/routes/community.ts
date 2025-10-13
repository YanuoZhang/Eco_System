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

    // Get pledge categories breakdown with savings-based percentage
    const categoriesQuery = `
      SELECT 
        up.category,
        COUNT(*) as count,
        CASE 
          WHEN up.category = 'transport' THEN COUNT(*) * 680
          WHEN up.category = 'energy' THEN COUNT(*) * 420
          WHEN up.category = 'food' THEN COUNT(*) * 600
          WHEN up.category = 'water' THEN COUNT(*) * 180
          WHEN up.category = 'diet' THEN COUNT(*) * 300
          WHEN up.category = 'daily' THEN COUNT(*) * 300
          WHEN up.category = 'general' THEN COUNT(*) * 300
          WHEN up.category = 'waste' THEN COUNT(*) * 300
          ELSE COUNT(*) * 300
        END as estimated_savings_kg
      FROM user_pledges up
      WHERE up.created_at >= NOW() - INTERVAL '1 year'
        AND up.category IS NOT NULL
      GROUP BY up.category
    `;
    const categoriesResult = await pool.query(categoriesQuery);

    // Calculate total savings for percentage calculation
    const totalSavings = categoriesResult.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.estimated_savings_kg || "0"),
      0,
    );

    // Map topPledges with savings-based percentage
    const topPledges = categoriesResult.rows
      .map((row: any) => {
        const category = row.category;
        const count = parseInt(row.count);
        const savings = parseInt(row.estimated_savings_kg || "0");
        const percentage = totalSavings > 0 ? (savings / totalSavings) * 100 : 0;

        return {
          type: category,
          percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
          count: count,
          color: getCategoryColor(category),
          savings: savings,
        };
      })
      .sort((a, b) => b.savings - a.savings); // Sort by savings (descending)

    const response = {
      totalUsers,
      totalPledges,
      totalSavings, // Keep in kg for consistency with frontend expectations
      topPledges,
      lastUpdated: new Date().toISOString(),
      dataSource: "database",
    };

    console.log(
      `✅ Community stats: ${totalUsers} users, ${totalPledges} pledges, ${Math.round(totalSavings / 1000)} tons saved`,
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

// Helper function to assign colors to categories (7 distinct colors)
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    TRANSPORT: "bg-emerald-500",
    ENERGY: "bg-blue-500",
    FOOD: "bg-orange-500",
    WATER: "bg-cyan-500",
    WASTE: "bg-purple-500",
    DIET: "bg-pink-500",
    DAILY: "bg-indigo-500",
    GENERAL: "bg-teal-500",
    // Add lowercase variants
    transport: "bg-emerald-500",
    energy: "bg-blue-500",
    food: "bg-orange-500",
    water: "bg-cyan-500",
    waste: "bg-purple-500",
    diet: "bg-pink-500",
    daily: "bg-indigo-500",
    general: "bg-teal-500",
  };
  return colorMap[category] || "bg-gray-500";
}

export default router;
