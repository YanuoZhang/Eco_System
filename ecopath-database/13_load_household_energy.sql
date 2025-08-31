-- 12_load_electricity_factors.sql-- =====================================================================
-- 13_load_household_energy.sql
-- Source: data/electricity_gas_by_household.csv
-- CSV columns: state, energy_type, energy_pj
-- Writes to: household_energy_by_state (year = 2024)
-- Safe to re-run (ON CONFLICT upserts)
-- =====================================================================

\set ON_ERROR_STOP on
BEGIN;

-- Staging table
DROP TABLE IF EXISTS _tmp_household_energy;
CREATE TEMP TABLE _tmp_household_energy (
  state       TEXT,      -- e.g. NSW, VIC, ...
  energy_type TEXT,      -- e.g. Electricity | Natural gas
  energy_pj   NUMERIC    -- PJ for 2024
);

-- Load CSV (one line; no semicolon)
\copy _tmp_household_energy(state, energy_type, energy_pj) FROM 'data/electricity_gas_by_household.csv' CSV HEADER

-- Upsert into target table, normalizing energy_type and mapping state abbrev
INSERT INTO household_energy_by_state (
  year, state_id, energy_type, energy_pj
)
SELECT
  2024,
  s.state_id,
  CASE
    WHEN lower(t.energy_type) LIKE 'electric%'     THEN 'Electricity'
    WHEN lower(t.energy_type) LIKE 'natural gas%'  THEN 'Natural gas'
    ELSE initcap(t.energy_type)  -- fallback; still passes CHECK if it matches one of allowed values
  END AS energy_type,
  t.energy_pj
FROM _tmp_household_energy t
JOIN state s
  ON s.abbrev = upper(t.state)
WHERE t.state IS NOT NULL
ON CONFLICT (year, state_id, energy_type) DO UPDATE
SET energy_pj = EXCLUDED.energy_pj;

COMMIT;

