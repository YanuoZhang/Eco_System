-- =====================================================================
-- 16_load_total_dwellings.sql
-- Source: data/total_dwellings.csv
-- Columns: State, household
-- Notes: State is an abbreviation (NSW, VIC, ...). Household numbers may
--        contain commas. We upsert into total_dwellings (year=2024).
-- =====================================================================

\set ON_ERROR_STOP 1
BEGIN;

DROP TABLE IF EXISTS _tmp_dwellings;
CREATE TEMP TABLE _tmp_dwellings(
  state_abbrev TEXT,
  household_txt TEXT
);

\copy _tmp_dwellings(state_abbrev, household_txt) FROM 'total_dwellings.csv' CSV HEADER;

-- Upsert cleaned values
INSERT INTO total_dwellings (year, state_id, households)
SELECT
  2024,
  s.state_id,
  REPLACE(td.household_txt, ',', '')::BIGINT AS households
FROM _tmp_dwellings td
JOIN state s
  ON s.abbrev = UPPER(td.state_abbrev)
WHERE td.household_txt IS NOT NULL
ON CONFLICT (year, state_id) DO UPDATE
SET households = EXCLUDED.households;

COMMIT;
