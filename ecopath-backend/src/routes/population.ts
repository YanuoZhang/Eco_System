// Population routes

import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

// GET /api/population?state=VIC&year=2023 - Get population data for a specific state and year
router.get("/", async (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    // const yearParam = req.query.year ? parseInt(String(req.query.year)) : new Date().getFullYear();

    if (!stateParam) {
      return res
        .status(400)
        .json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }

    // Get the latest available population data for the state
    const query = `
      SELECT 
        p.state_id,
        p.year,
        p.population,
        s.state_name,
        s.abbrev
      FROM population p
      JOIN state s ON p.state_id = s.state_id
      WHERE p.state_id = $1
      ORDER BY p.year DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [stateParam]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No population data found for state '${stateParam}'` });
    }

    const data = result.rows[0];

    return res.json({
      state_id: data.state_id,
      state_name: data.state_name,
      abbreviation: data.abbrev,
      year: data.year,
      population: data.population,
    });
  } catch (error) {
    console.error("Error fetching population data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/population/latest - Get latest population data for all states
router.get("/latest", async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT ON (p.state_id)
        p.state_id,
        p.year,
        p.population,
        s.state_name,
        s.abbrev
      FROM population p
      JOIN state s ON p.state_id = s.state_id
      WHERE s.is_aggregate = FALSE
      ORDER BY p.state_id, p.year DESC
    `;

    const result = await pool.query(query);

    const states = result.rows.map((row) => ({
      state_id: row.state_id,
      state_name: row.state_name,
      abbreviation: row.abbrev,
      year: row.year,
      population: row.population,
    }));

    return res.json(states);
  } catch (error) {
    console.error("Error fetching latest population data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
