-- =====================================================================
-- 02_load_emissions.sql

\set ON_ERROR_STOP 1
BEGIN;

DROP TABLE IF EXISTS emission_raw;
CREATE TABLE emission_raw (
  financial_year INT,
  "ACT (Mt)" NUMERIC,
  "EXTERNAL TERRITORIES (ET) (Mt)" NUMERIC,
  "NSW (Mt)" NUMERIC,
  "NT (Mt)" NUMERIC,
  "QLD (Mt)" NUMERIC,
  "SA (Mt)" NUMERIC,
  "TAS (Mt)" NUMERIC,
  "VIC (Mt)" NUMERIC,
  "WA (Mt)" NUMERIC
);

-- if data_dir is a full file path, use it directly
-- Prefer explicit data_file; fall back to data_dir for backward compatibility
\if :{?data_file}
\echo Loading emissions from data_file: :data_file
\copy emission_raw FROM :'data_file' WITH CSV HEADER
\else
\echo Falling back to data_dir (should be full file path): :data_dir
\copy emission_raw FROM :'data_dir' WITH CSV HEADER
\endif


INSERT INTO emission_total (state_id, year, emissions_mt)
SELECT x.state_id,
       r.financial_year::INT AS year,
       x.mt
FROM emission_raw r
CROSS JOIN LATERAL (VALUES
  ('ACT', r."ACT (Mt)"),
  ('NSW', r."NSW (Mt)"),
  ('NT',  r."NT (Mt)"),
  ('QLD', r."QLD (Mt)"),
  ('SA',  r."SA (Mt)"),
  ('TAS', r."TAS (Mt)"),
  ('VIC', r."VIC (Mt)"),
  ('WA',  r."WA (Mt)")
) AS x(state_id, mt)
ON CONFLICT (state_id, year) DO UPDATE
SET emissions_mt = EXCLUDED.emissions_mt;

COMMIT;
