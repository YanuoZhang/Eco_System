-- =====================================================================
-- US 1.2visual_energy_mix
-- Visual queries for User Story 1.2 (Energy Mix)
-- =====================================================================

\set ON_ERROR_STOP 1

-- A) Latest month energy mix per state
CREATE OR REPLACE VIEW vw_energy_mix_latest AS
WITH latest AS (
  SELECT state_id, MAX(dmonth) AS dmonth
  FROM generation_mix
  GROUP BY state_id
),
sum_by_source AS (
  SELECT g.state_id, g.dmonth, g.energy_type, SUM(g.generation_gwh) AS gwh
  FROM generation_mix g
  JOIN latest l
    ON l.state_id = g.state_id
   AND l.dmonth   = g.dmonth
  GROUP BY g.state_id, g.dmonth, g.energy_type
)
SELECT s.state_id,
       s.dmonth,
       s.energy_type,
       s.gwh,
       ROUND(
         s.gwh * 100.0
         / NULLIF(SUM(s.gwh) OVER (PARTITION BY s.state_id, s.dmonth), 0),
         2
       ) AS pct
FROM sum_by_source s
ORDER BY s.state_id, s.gwh DESC;


-- B) All months energy mix (filter by state_id and dmonth at query time)
CREATE OR REPLACE VIEW vw_energy_mix_all_months AS
WITH base AS (
  SELECT
    state_id,
    dmonth,
    energy_type,
    SUM(generation_gwh) AS gwh
  FROM generation_mix
  GROUP BY state_id, dmonth, energy_type
)
SELECT
  b.state_id,
  b.dmonth,
  b.energy_type,
  b.gwh,
  ROUND(
    b.gwh * 100.0
    / NULLIF(SUM(b.gwh) OVER (PARTITION BY b.state_id, b.dmonth), 0),
    2
  ) AS pct
FROM base b;


-- C) Rolling last-12-months share up to each state's latest month
CREATE OR REPLACE VIEW vw_energy_mix_12m_latest AS
WITH bounds AS (
  SELECT state_id,
         MAX(dmonth) AS max_m,
         (date_trunc('month', MAX(dmonth))::date - INTERVAL '11 months') AS start_m
  FROM generation_mix
  GROUP BY state_id
),
windowed AS (
  SELECT g.state_id, g.energy_type, g.generation_gwh
  FROM generation_mix g
  JOIN bounds b
    ON b.state_id = g.state_id
   AND g.dmonth  >= b.start_m
   AND g.dmonth  <= b.max_m
),
sum12 AS (
  SELECT state_id, energy_type, SUM(generation_gwh) AS gwh_12m
  FROM windowed
  GROUP BY state_id, energy_type
)
SELECT
  s.state_id,
  s.energy_type,
  s.gwh_12m,
  ROUND(
    s.gwh_12m * 100.0
    / NULLIF(SUM(s.gwh_12m) OVER (PARTITION BY s.state_id), 0),
    2
  ) AS pct
FROM sum12 s
ORDER BY s.state_id, s.gwh_12m DESC;


-- HOW TO USE
-- Latest month for a state:
SELECT * FROM vw_energy_mix_latest WHERE state_id='VIC';

-- Specific month for a state:
SELECT * FROM vw_energy_mix_all_months
WHERE state_id='VIC' AND dmonth = DATE '2025-01-01'
ORDER BY gwh DESC;
-- Rolling 12-month share (up to each state's latest month):
SELECT * FROM vw_energy_mix_12m_latest WHERE state_id='VIC';


-- =====================================================================
-- US 1.3 visual_emissions
-- Visual queries for User Story 1.3 (Emissions over time)
-- Tables used: emission_total(state_id, year, emissions_mt)
-- Units: Mt CO2-e per year
-- =====================================================================

\set ON_ERROR_STOP 1

-- A) Base series (all years)
CREATE OR REPLACE VIEW vw_emissions_series AS
SELECT
  state_id,
  year,
  emissions_mt
FROM emission_total;

-- B) Latest annual value per state
CREATE OR REPLACE VIEW vw_emissions_latest AS
SELECT DISTINCT ON (state_id)
  state_id,
  year        AS latest_year,
  emissions_mt AS latest_emissions_mt
FROM emission_total
ORDER BY state_id, year DESC;

-- C) Last 5 years per state (relative to each state's latest year)
CREATE OR REPLACE VIEW vw_emissions_last_5y AS
WITH latest AS (
  SELECT state_id, MAX(year) AS max_year
  FROM emission_total
  GROUP BY state_id
)
SELECT e.state_id, e.year, e.emissions_mt
FROM emission_total e
JOIN latest l
  ON l.state_id = e.state_id
WHERE e.year BETWEEN (l.max_year - 4) AND l.max_year;

-- D) Last 10 years per state (relative to each state's latest year)
CREATE OR REPLACE VIEW vw_emissions_last_10y AS
WITH latest AS (
  SELECT state_id, MAX(year) AS max_year
  FROM emission_total
  GROUP BY state_id
)
SELECT e.state_id, e.year, e.emissions_mt
FROM emission_total e
JOIN latest l
  ON l.state_id = e.state_id
WHERE e.year BETWEEN (l.max_year - 9) AND l.max_year;

-- E) Helper: per-state latest year (for UI to build range pickers)
CREATE OR REPLACE VIEW vw_emissions_year_bounds AS
SELECT
  state_id,
  MIN(year) AS min_year,
  MAX(year) AS max_year
FROM emission_total
GROUP BY state_id;

-- HOW TO USE
-- Show latest yearly emission by state
SELECT *
FROM vw_emissions_latest
WHERE state_id = 'VIC';

-- Line Chart
SELECT year, emissions_mt
FROM vw_emissions_series
WHERE state_id = 'VIC'
ORDER BY year;


-- 5-year range
SELECT year, emissions_mt
FROM vw_emissions_last_5y
WHERE state_id = 'VIC'
ORDER BY year;

-- 10-year range
SELECT year, emissions_mt
FROM vw_emissions_last_10y
WHERE state_id = 'VIC'
ORDER BY year;

-- Tooltip Detail 
SELECT year, emissions_mt
FROM vw_emissions_series
WHERE state_id = 'VIC' AND year = 2023;

-- =====================================================================
-- US 1.4 visual_targets
-- Visual queries for User Story 1.4 (State climate targets progress)
-- Tables:
--   - state_initiatives(state_id, target_year, baseline_year, target_value_pct, notes)
--   - emission_total(state_id, year, emissions_mt)  -- Mt CO2-e / year
-- =====================================================================

\set ON_ERROR_STOP 1

-- A) One row per state target + baseline emissions
CREATE OR REPLACE VIEW vw_target_with_baseline AS
SELECT
  si.state_id,
  si.target_year,
  si.baseline_year,
  si.target_value_pct,           -- e.g. 50 means "reduce 50% vs baseline"
  si.notes,                      -- plan/label text
  b.emissions_mt AS baseline_emissions_mt
FROM state_initiatives si
JOIN emission_total b
  ON b.state_id = si.state_id
 AND b.year     = si.baseline_year;

-- B) Latest year per state (what the DB currently has)
CREATE OR REPLACE VIEW vw_latest_emissions AS
SELECT DISTINCT ON (state_id)
  state_id,
  year  AS latest_year,
  emissions_mt AS latest_emissions_mt
FROM emission_total
ORDER BY state_id, year DESC;

-- C) Latest progress towards each state's target
--    reduction_pct = (baseline - latest) / baseline * 100
--    progress_to_target_pct = reduction_pct / target_value_pct * 100
--    Clamp rates in [0, 100] for UI friendliness.
--    On-track check: compare current pace vs required average pace
--      current_p.a.c.e  = reduction_pct / (latest_year - baseline_year)
--      required_p.a.c.e = target_value_pct / (target_year - baseline_year)
CREATE OR REPLACE VIEW vw_target_progress_latest AS
WITH base AS (
  SELECT
    t.state_id,
    t.target_year,
    t.baseline_year,
    t.target_value_pct,
    t.notes,
    t.baseline_emissions_mt,
    le.latest_year,
    le.latest_emissions_mt
  FROM vw_target_with_baseline t
  JOIN vw_latest_emissions le USING (state_id)
),
calc AS (
  SELECT
    state_id,
    target_year,
    baseline_year,
    target_value_pct,
    notes,
    baseline_emissions_mt,
    latest_year,
    latest_emissions_mt,
    CASE
      WHEN baseline_emissions_mt IS NULL OR baseline_emissions_mt = 0
        OR latest_emissions_mt IS NULL
      THEN NULL
      ELSE ROUND( ( (baseline_emissions_mt - latest_emissions_mt)
                    / baseline_emissions_mt ) * 100.0, 2)
    END AS reduction_pct_raw
  FROM base
)
SELECT
  state_id,
  notes AS plan_name,                      -- display label
  baseline_year,
  target_year,
  target_value_pct,                        -- target reduction %
  baseline_emissions_mt,
  latest_year,
  latest_emissions_mt,
  -- clamp reduction to [0, 100]
  GREATEST(0, LEAST(100, reduction_pct_raw)) AS reduction_pct,
  -- progress towards the target (0-100%)
  CASE
    WHEN target_value_pct IS NULL OR target_value_pct = 0 OR reduction_pct_raw IS NULL
      THEN NULL
    ELSE GREATEST(0, LEAST(100, ROUND( (reduction_pct_raw / target_value_pct) * 100.0, 1)))
  END AS progress_to_target_pct,
  -- pace metrics (may be NULL if years collide or data missing)
  CASE
    WHEN latest_year = baseline_year OR reduction_pct_raw IS NULL
      THEN NULL
    ELSE ROUND( reduction_pct_raw / (latest_year - baseline_year), 2)
  END AS current_pace_pct_per_year,
  CASE
    WHEN target_year = baseline_year OR target_value_pct IS NULL
      THEN NULL
    ELSE ROUND( target_value_pct / (target_year - baseline_year), 2)
  END AS required_pace_pct_per_year,
  -- simple on-track flag (current pace >= required pace)
  CASE
    WHEN (target_year = baseline_year) OR reduction_pct_raw IS NULL OR target_value_pct IS NULL
      THEN NULL
    WHEN (latest_year >= target_year)
      -- past the target year: treat as on track if achieved the target
      THEN (GREATEST(0, LEAST(100, reduction_pct_raw)) >= target_value_pct)
    ELSE
      ( ROUND( reduction_pct_raw / NULLIF((latest_year - baseline_year), 0), 4)
        >=
        ROUND( target_value_pct / NULLIF((target_year - baseline_year), 0), 4)
      )
  END AS is_on_track
FROM calc
ORDER BY state_id;

-- D) Yearly progress series (for sparkline/mini chart in sidebar)
CREATE OR REPLACE VIEW vw_target_progress_yearly AS
WITH base AS (
  SELECT
    t.state_id,
    t.baseline_year,
    t.target_year,
    t.target_value_pct,
    t.notes,
    t.baseline_emissions_mt
  FROM vw_target_with_baseline t
)
SELECT
  e.state_id,
  b.notes AS plan_name,
  b.baseline_year,
  b.target_year,
  b.target_value_pct,
  e.year,
  e.emissions_mt,
  CASE
    WHEN b.baseline_emissions_mt IS NULL OR b.baseline_emissions_mt = 0
      THEN NULL
    ELSE ROUND( ((b.baseline_emissions_mt - e.emissions_mt) / b.baseline_emissions_mt) * 100.0, 2)
  END AS reduction_pct
FROM emission_total e
JOIN base b
  ON b.state_id = e.state_id
ORDER BY e.state_id, e.year;

-- HOW TO USE
-- Sidebar info on page load
-- progress %
SELECT
  plan_name,
  progress_to_target_pct,
  latest_year,
  latest_emissions_mt,
  target_year,
  target_value_pct,
  is_on_track,
  current_pace_pct_per_year,
  required_pace_pct_per_year
FROM vw_target_progress_latest
WHERE state_id = 'VIC';

-- Sidebar update when switching states
SELECT
  plan_name,
  progress_to_target_pct,
  latest_year,
  latest_emissions_mt,
  target_year,
  target_value_pct,
  is_on_track
FROM vw_target_progress_latest
WHERE state_id = 'NSW';

-- Yearly reduction series for mini chart
SELECT year, reduction_pct
FROM vw_target_progress_yearly
WHERE state_id = 'VIC'
ORDER BY year;

-- Fallback (no data case)
SELECT *
FROM vw_target_progress_latest
WHERE state_id = 'NT';   -- will return empty if NT not configured

SELECT
  state_id,
  plan_name,                    -- e.g. "Victoria 2030 target"
  baseline_year,
  target_year,
  target_value_pct,             -- e.g. 50 (means -50%)
  baseline_emissions_mt,
  latest_year,
  latest_emissions_mt,
  reduction_pct AS reduction_pct_so_far,         -- e.g. 18.23   -> "Achieved: 18.23%"
  progress_to_target_pct,       -- e.g. 36.46   -> "36.46% of target"
  current_pace_pct_per_year,    -- optional: "*%/yr so far"
  required_pace_pct_per_year,   -- optional: "*%/yr needed"
  -- expected_reduction_by_now,    -- optional: linear benchmark by now (column not defined in view)
  is_on_track                   -- optional: boolean for badge
FROM vw_target_progress_latest
WHERE state_id = 'VIC';
