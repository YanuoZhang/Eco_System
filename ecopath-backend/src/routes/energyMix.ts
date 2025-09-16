// Energy mix routes

import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

// GET /api/energy-mix?state=VIC - Now using real database data
router.get("/", async (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    if (!stateParam) {
      return res
        .status(400)
        .json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }

    // Query real data from database (no trend calculation due to limited historical data)
    const query = `
      SELECT 
        energy_type,
        ROUND(AVG(generation_gwh), 2) as generation_gwh,
        ROUND(AVG(generation_gwh) * 100.0 / SUM(AVG(generation_gwh)) OVER (), 2) as percentage
      FROM generation_mix 
      WHERE state_id = $1 
      GROUP BY energy_type
      ORDER BY generation_gwh DESC
    `;
    const result = await pool.query(query, [stateParam]);

    if (result.rows.length === 0) {
      // Check if state exists in the state table
      const stateCheck = await pool.query(
        "SELECT state_name FROM state WHERE state_id = $1 AND is_aggregate = FALSE",
        [stateParam],
      );

      if (stateCheck.rows.length === 0) {
        return res.status(404).json({ error: `State '${stateParam}' not found` });
      } else {
        // State exists but no generation data available
        return res.status(404).json({
          error: `No generation data available for ${stateCheck.rows[0].state_name}`,
          state: stateParam,
          stateName: stateCheck.rows[0].state_name,
        });
      }
    }

    const data = result.rows.map((row) => ({
      source: row.energy_type,
      percentage: Math.round(row.percentage),
      generation: row.generation_gwh,
    }));

    return res.json(data);
  } catch (error) {
    console.error("Error fetching energy mix data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
