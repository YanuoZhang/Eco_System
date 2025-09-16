// Climate targets routes

import { Router, Request, Response } from "express";
import { pool } from "../config/database";

const router = Router();

// GET /api/climate-targets?state=VIC - Get climate targets and progress for a state
router.get("/", async (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    if (!stateParam) {
      return res
        .status(400)
        .json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
    }

    // Query climate targets from database
    const targetsQuery = `
      SELECT 
        si.target_year,
        si.baseline_year,
        si.target_value_pct,
        si.notes,
        s.state_name
      FROM state_initiatives si
      JOIN state s ON si.state_id = s.state_id
      WHERE si.state_id = $1
      ORDER BY si.target_year ASC
    `;

    const targetsResult = await pool.query(targetsQuery, [stateParam]);

    if (targetsResult.rows.length === 0) {
      return res.status(404).json({ error: `No climate targets found for state '${stateParam}'` });
    }

    // Get latest emissions data to calculate progress
    const emissionsQuery = `
      SELECT 
        year,
        emissions_mt
      FROM emission_total 
      WHERE state_id = $1
      ORDER BY year DESC
      LIMIT 1
    `;

    const emissionsResult = await pool.query(emissionsQuery, [stateParam]);
    const latestEmissions = emissionsResult.rows[0];

    // Get baseline emissions for progress calculation
    const baselineQuery = `
      SELECT 
        year,
        emissions_mt
      FROM emission_total 
      WHERE state_id = $1 AND year = $2
    `;

    // Helper to coerce DB value to number, stripping any non-numeric chars like "%"
    const toNumber = (value: unknown): number => {
      if (typeof value === "number") return value;
      const n = parseFloat(String(value).replace(/[^0-9+\-.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    const targets = targetsResult.rows.map((target) => {
      let progress = 0;
      let progressDescription = "No baseline data available";

      if (latestEmissions) {
        // Get baseline emissions for this target
        return pool
          .query(baselineQuery, [stateParam, target.baseline_year])
          .then((baselineResult) => {
            const baselineEmissions = baselineResult.rows[0];

            if (baselineEmissions && latestEmissions) {
              // Calculate progress: (baseline - current) / baseline * 100
              const reduction =
                ((baselineEmissions.emissions_mt - latestEmissions.emissions_mt) /
                  baselineEmissions.emissions_mt) *
                100;
              progress = Math.max(0, Math.round(reduction * 10) / 10); // Round to 1 decimal place
              progressDescription = `Achieved: ${progress}%`;
            }

            return {
              targetYear: target.target_year,
              baselineYear: target.baseline_year,
              targetValuePct: toNumber(target.target_value_pct),
              planName: `${target.state_name} ${target.target_year} Climate Target`,
              progress: progress,
              progressDescription: progressDescription,
              latestEmissions: latestEmissions
                ? {
                    year: latestEmissions.year,
                    value: latestEmissions.emissions_mt,
                  }
                : null,
              notes: target.notes,
            };
          });
      } else {
        return {
          targetYear: target.target_year,
          baselineYear: target.baseline_year,
          targetValuePct: toNumber(target.target_value_pct),
          planName: `${target.state_name} ${target.target_year} Climate Target`,
          progress: 0,
          progressDescription: "No emissions data available",
          latestEmissions: null,
          notes: target.notes,
        };
      }
    });

    // Wait for all promises to resolve
    const resolvedTargets = await Promise.all(targets);

    // Return the primary target (usually 2030) or the first one
    const primaryTarget = resolvedTargets.find((t) => t.targetYear === 2030) || resolvedTargets[0];

    return res.json(primaryTarget);
  } catch (error) {
    console.error("Error fetching climate targets data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
