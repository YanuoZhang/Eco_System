-- =====================================================================
-- 12_load_electricity_factors.sql
-- Source: data/electricity_factors-2024.csv
-- CSV columns:
--   power_region, scope2_kg_per_kwh, scope3_kg_per_kwh
-- Writes to:
--   electricity_factor_raw (year=2024)
--   electricity_power_region_map (mapping)
--   electricity_factor_by_state (aggregated to state)
-- Safe to re-run (ON CONFLICT upserts)
-- =====================================================================

\set ON_ERROR_STOP on
BEGIN;

-- Ensure raw table exists (aligns with 01_schema.sql)
CREATE TABLE IF NOT EXISTS electricity_factor_raw (
  year                                      INT NOT NULL DEFAULT 2024,
  power_region                              TEXT NOT NULL,
  direct_emission_factor_kg_per_kwh         NUMERIC,
  supply_chain_emission_factor_kg_per_kwh   NUMERIC,
  CONSTRAINT pk_elec_factor_raw PRIMARY KEY (year, power_region)
);

-- Temp staging for CSV
DROP TABLE IF EXISTS _tmp_elec_factors;
CREATE TEMP TABLE _tmp_elec_factors (
  power_region        TEXT,
  scope2_kg_per_kwh   NUMERIC,
  scope3_kg_per_kwh   NUMERIC
);

-- Load CSV (one line; no semicolon)
\copy _tmp_elec_factors(power_region, scope2_kg_per_kwh, scope3_kg_per_kwh) FROM 'data/electricity_factors-2024.csv' CSV HEADER

-- Upsert into raw with readable column names
INSERT INTO electricity_factor_raw (
  year,
  power_region,
  direct_emission_factor_kg_per_kwh,
  supply_chain_emission_factor_kg_per_kwh
)
SELECT
  2024,
  power_region,
  scope2_kg_per_kwh,
  scope3_kg_per_kwh
FROM _tmp_elec_factors
WHERE power_region IS NOT NULL
ON CONFLICT (year, power_region) DO UPDATE
SET direct_emission_factor_kg_per_kwh       = EXCLUDED.direct_emission_factor_kg_per_kwh,
    supply_chain_emission_factor_kg_per_kwh = EXCLUDED.supply_chain_emission_factor_kg_per_kwh;

-- Ensure mapping table exists
CREATE TABLE IF NOT EXISTS electricity_power_region_map (
  power_region  TEXT NOT NULL,
  state_id      VARCHAR(8) NOT NULL REFERENCES state(state_id),
  PRIMARY KEY (power_region, state_id)
);

-- Seed mapping (safe to re-run). Adjust labels to match your CSV exactly.
INSERT INTO electricity_power_region_map(power_region, state_id) VALUES
  ('New South Wales and Australian Capital Territory', 'NSW'),
  ('New South Wales and Australian Capital Territory', 'ACT'),
  ('Victoria', 'VIC'),
  ('Queensland', 'QLD'),
  ('South Australia', 'SA'),
  ('Western Australia - South West Interconnected System (SWIS)', 'WA'),
  ('Western Australia - North Western Interconnected System (NWIS)', 'WA'),
  ('Tasmania', 'TAS'),
  ('Northern territory - Darwin Katherine Interconnected System (DKIS)', 'NT')
ON CONFLICT (power_region, state_id) DO NOTHING;

-- Ensure state-level factor table exists
CREATE TABLE IF NOT EXISTS electricity_factor_by_state (
  year                                      INT NOT NULL,
  state_id                                  VARCHAR(8) NOT NULL REFERENCES state(state_id),
  direct_emission_factor_kg_per_kwh         NUMERIC,
  supply_chain_emission_factor_kg_per_kwh   NUMERIC,
  CONSTRAINT pk_elec_factor_state PRIMARY KEY (year, state_id)
);

-- Aggregate region -> state (simple average). Replace AVG with weighted calc if you add weights later.
WITH joined AS (
  SELECT
    r.year,
    m.state_id,
    r.direct_emission_factor_kg_per_kwh,
    r.supply_chain_emission_factor_kg_per_kwh
  FROM electricity_factor_raw r
  JOIN electricity_power_region_map m
    ON m.power_region = r.power_region
  WHERE r.year = 2024
),
agg AS (
  SELECT
    year,
    state_id,
    AVG(direct_emission_factor_kg_per_kwh)       AS direct_emission_factor_kg_per_kwh,
    AVG(supply_chain_emission_factor_kg_per_kwh) AS supply_chain_emission_factor_kg_per_kwh
  FROM joined
  GROUP BY year, state_id
)
INSERT INTO electricity_factor_by_state (
  year, state_id,
  direct_emission_factor_kg_per_kwh,
  supply_chain_emission_factor_kg_per_kwh
)
SELECT
  year, state_id,
  direct_emission_factor_kg_per_kwh,
  supply_chain_emission_factor_kg_per_kwh
FROM agg
ON CONFLICT (year, state_id) DO UPDATE
SET direct_emission_factor_kg_per_kwh       = EXCLUDED.direct_emission_factor_kg_per_kwh,
    supply_chain_emission_factor_kg_per_kwh = EXCLUDED.supply_chain_emission_factor_kg_per_kwh;

COMMIT;
