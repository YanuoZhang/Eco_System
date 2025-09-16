// States routes

import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

// GET /api/states - Get all available states that have energy data
router.get("/", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT
        s.state_id,
        s.state_name,
        s.abbrev,
        s.is_aggregate
      FROM state s
      INNER JOIN generation_mix gm ON s.state_id = gm.state_id
      WHERE s.is_aggregate = FALSE
      ORDER BY s.state_name ASC
    `;

    const result = await pool.query(query);

    const states = result.rows.map((row) => ({
      id: row.state_id,
      name: row.state_name,
      abbreviation: row.abbrev,
      displayName: `${row.state_name} (${row.abbrev})`,
    }));

    return res.json(states);
  } catch (error) {
    console.error("Error fetching states data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
