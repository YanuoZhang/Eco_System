-- =====================================================================
-- 15_load_gas_factors.sql
-- Source: gas_factors-2024.csv
-- Columns: State or territory, Metro, Non-Metro
-- Skip "C" (confidential) values
-- =====================================================================

\set ON_ERROR_STOP 1
BEGIN;

DROP TABLE IF EXISTS _tmp_gas;
CREATE TEMP TABLE _tmp_gas(
  state_name TEXT,
  metro      TEXT,
  non_metro  TEXT
);

\copy _tmp_gas(state_name, metro, non_metro) FROM 'data/gas_factors-2024.csv' CSV HEADER;

-- Metro
INSERT INTO gas_factor_by_state(year, state_id, area_type, kg_co2e_per_gj)
SELECT 
  2024,
  s.state_id,
  'Metro',
  v.val::NUMERIC
FROM (
  SELECT
    g.state_name,
    NULLIF(g.metro, 'C') AS val
  FROM _tmp_gas g
) v
JOIN state s
  ON upper(v.state_name) LIKE upper(s.state_name) || '%'
WHERE v.val IS NOT NULL
ON CONFLICT (year, state_id, area_type) DO UPDATE
SET kg_co2e_per_gj = EXCLUDED.kg_co2e_per_gj;

-- Non-Metro
INSERT INTO gas_factor_by_state(year, state_id, area_type, kg_co2e_per_gj)
SELECT 
  2024,
  s.state_id,
  'Non-Metro',
  v.val::NUMERIC
FROM (
  SELECT
    g.state_name,
    NULLIF(g.non_metro, 'C') AS val
  FROM _tmp_gas g
) v
JOIN state s
  ON upper(v.state_name) LIKE upper(s.state_name) || '%'
WHERE v.val IS NOT NULL
ON CONFLICT (year, state_id, area_type) DO UPDATE
SET kg_co2e_per_gj = EXCLUDED.kg_co2e_per_gj;

COMMIT;
