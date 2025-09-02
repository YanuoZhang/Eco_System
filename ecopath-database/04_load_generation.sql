-- =====================================================================
-- 04_load_generation.sql
-- Loads state generation data (monthly, GWh) into generation_mix
-- Handles different column layouts per state.
-- =====================================================================

ROLLBACK;
\set ON_ERROR_STOP 1
BEGIN;

-- 1. Create staging table (text columns, flexible)
DROP TABLE IF EXISTS generation_mix_raw_text;
CREATE TABLE generation_mix_raw_text (
  dmonth_txt TEXT,
  state_txt  TEXT,
  c1 TEXT, c2 TEXT, c3 TEXT, c4 TEXT, c5 TEXT, c6 TEXT, c7 TEXT, c8 TEXT
);

-- Helper: normalize function per state
-- We load into generation_mix(state_id, dmonth, energy_type, generation_gwh)

-- ========== NSW ==========
TRUNCATE generation_mix_raw_text;
\copy generation_mix_raw_text FROM 'Generation_NSW.csv' CSV HEADER;
INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
SELECT 'NSW',
       to_date(dmonth_txt, 'DD/MM/YYYY'),
       e.energy_type,
       NULLIF(e.gwh,'')::NUMERIC
FROM generation_mix_raw_text r
CROSS JOIN LATERAL (VALUES
  ('coal',      r.c1),
  ('bioenergy', r.c2),
  ('distillate',r.c3),
  ('gas',       r.c4),
  ('battery',   r.c5),
  ('hydro',     r.c6),
  ('wind',      r.c7),
  ('solar',     r.c8)
) AS e(energy_type, gwh)
WHERE e.gwh IS NOT NULL
ON CONFLICT (state_id, dmonth, energy_type) DO UPDATE SET generation_gwh = EXCLUDED.generation_gwh;

-- ========== QLD ==========
TRUNCATE generation_mix_raw_text;
\copy generation_mix_raw_text FROM 'Generation_QLD.csv' CSV HEADER;
INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
SELECT 'QLD',
       to_date(dmonth_txt, 'DD/MM/YYYY'),
       e.energy_type,
       NULLIF(e.gwh,'')::NUMERIC
FROM generation_mix_raw_text r
CROSS JOIN LATERAL (VALUES
  ('coal',      r.c1),
  ('bioenergy', r.c2),
  ('distillate',r.c3),
  ('gas',       r.c4),
  ('battery',   r.c5),
  ('hydro',     r.c6),
  ('wind',      r.c7),
  ('solar',     r.c8)
) AS e(energy_type, gwh)
WHERE e.gwh IS NOT NULL
ON CONFLICT (state_id, dmonth, energy_type) DO UPDATE SET generation_gwh = EXCLUDED.generation_gwh;

-- ========== SA ==========
TRUNCATE generation_mix_raw_text;
\copy generation_mix_raw_text(dmonth_txt,state_txt,c1,c2,c3,c4,c5) FROM 'Generation_SA.csv' CSV HEADER;
INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
SELECT 'SA',
       to_date(dmonth_txt,'DD/MM/YYYY'),
       e.energy_type,
       NULLIF(e.gwh,'')::numeric
FROM generation_mix_raw_text r
CROSS JOIN LATERAL (VALUES
  ('distillate', r.c1),
  ('gas',        r.c2),
  ('battery',    r.c3),
  ('wind',       r.c4),
  ('solar',      r.c5)
) AS e(energy_type, gwh)
WHERE e.gwh IS NOT NULL
ON CONFLICT (state_id, dmonth, energy_type)
DO UPDATE SET generation_gwh = EXCLUDED.generation_gwh;

-- ========== WA ==========
TRUNCATE generation_mix_raw_text;
\copy generation_mix_raw_text(dmonth_txt,state_txt,c1,c2,c3,c4,c5,c6,c7,c8) FROM 'Generation_WA.csv' CSV HEADER;
INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
SELECT 'WA',
       to_date(dmonth_txt,'DD/MM/YYYY'),
       e.energy_type,
       NULLIF(e.gwh,'')::numeric
FROM generation_mix_raw_text r
CROSS JOIN LATERAL (VALUES
  ('coal',      r.c1),
  ('bioenergy', r.c2),
  ('distillate',r.c3),
  ('gas',       r.c4),
  ('battery',   r.c5),
  ('hydro',     r.c6),
  ('wind',      r.c7),
  ('solar',     r.c8)
) AS e(energy_type, gwh)
WHERE e.gwh IS NOT NULL
ON CONFLICT (state_id, dmonth, energy_type)
DO UPDATE SET generation_gwh = EXCLUDED.generation_gwh;

-- ========== TAS ==========
TRUNCATE generation_mix_raw_text;
\copy generation_mix_raw_text(dmonth_txt,state_txt,c1,c2,c3,c4) FROM 'Generation_TAS.csv' CSV HEADER;
INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
SELECT 'TAS',
       to_date(dmonth_txt,'DD/MM/YYYY'),
       e.energy_type,
       NULLIF(e.gwh,'')::numeric
FROM generation_mix_raw_text r
CROSS JOIN LATERAL (VALUES
  ('gas',   r.c1),
  ('hydro', r.c2),
  ('wind',  r.c3),
  ('solar', r.c4)
) AS e(energy_type, gwh)
WHERE e.gwh IS NOT NULL
ON CONFLICT (state_id, dmonth, energy_type)
DO UPDATE SET generation_gwh = EXCLUDED.generation_gwh;

-- ========== VIC ==========
TRUNCATE generation_mix_raw_text;
\copy generation_mix_raw_text(dmonth_txt,state_txt,c1,c2,c3,c4,c5,c6) FROM 'Generation_VIC.csv' CSV HEADER;
INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
SELECT 'VIC',
       to_date(dmonth_txt,'DD/MM/YYYY'),
       e.energy_type,
       NULLIF(e.gwh,'')::numeric
FROM generation_mix_raw_text r
CROSS JOIN LATERAL (VALUES
  ('coal',    r.c1),
  ('gas',     r.c2),
  ('battery', r.c3),
  ('hydro',   r.c4),
  ('wind',    r.c5),
  ('solar',   r.c6)
) AS e(energy_type, gwh)
WHERE e.gwh IS NOT NULL
ON CONFLICT (state_id, dmonth, energy_type)
DO UPDATE SET generation_gwh = EXCLUDED.generation_gwh;

COMMIT;