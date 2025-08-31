-- =====================================================================
-- 03_load_population.sql
-- Loads state population CSVs into population(state_id, year, population)
-- - Accepts YYYY or FY like '1960-61'/'1960-61'/'1960/61' -> end year (1961)
-- - Strips thousand separators in population (e.g., "3,977,329")
-- - De-duplicates per (state_id, year) using the largest population
-- Prereq: population has PRIMARY KEY (state_id, year)
-- =====================================================================

ROLLBACK; 
\set ON_ERROR_STOP 1
BEGIN;

-- Raw staging exactly matches CSV columns
DROP TABLE IF EXISTS temp_population_raw;
CREATE TABLE temp_population_raw (
  c1 TEXT,  -- state (ignored; we inject fixed state_id per file)
  c2 TEXT,  -- year or FY text
  c3 TEXT   -- population (may contain commas)
);

-- Normalized staging (optional to inspect)
DROP TABLE IF EXISTS temp_population_norm;
CREATE TABLE temp_population_norm (
  state_id   TEXT,
  year       INT,
  population BIGINT
);

-- Utility CTE template per state:
-- 1) TRUNCATE raw
-- 2) \copy raw from file
-- 3) Normalize + dedup (prefer larger population if duplicates)
-- 4) Upsert into target

-- ========== NSW ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/NSW_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'NSW'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1  -- FY end year
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'NSW'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;

-- ========== VIC ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/VIC_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'VIC'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'VIC'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;


-- ========== QLD ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/QLD_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'QLD'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'QLD'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;


-- ========== SA ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/SA_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'SA'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'SA'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;


-- ========== WA ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/WA_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'WA'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'WA'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;


-- ========== TAS ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/TAS_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'TAS'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'TAS'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;


-- ========== NT ==========
TRUNCATE temp_population_raw;
\copy temp_population_raw(c1,c2,c3) FROM 'data/NT_population.csv' CSV HEADER
WITH norm AS (
  SELECT
    'NT'::TEXT AS state_id,
    CASE
      WHEN trim(c2) ~ '^\d{4}$'            THEN trim(c2)::INT
      WHEN trim(c2) ~ '^\d{4}[-/-]\d{2}$'  THEN left(trim(c2),4)::INT + 1
      ELSE NULL
    END AS year,
    NULLIF(regexp_replace(c3, ',', '', 'g'), '')::BIGINT AS population
  FROM temp_population_raw
),
dedup AS (
  SELECT DISTINCT ON (year)
         state_id, year, population
  FROM norm
  WHERE year IS NOT NULL AND population IS NOT NULL
  ORDER BY year, population DESC
)
INSERT INTO temp_population_norm(state_id, year, population)
SELECT state_id, year, population FROM dedup;

INSERT INTO population(state_id, year, population)
SELECT state_id, year, population
FROM temp_population_norm WHERE state_id = 'NT'
ON CONFLICT (state_id, year) DO UPDATE
SET population = EXCLUDED.population;


COMMIT;
