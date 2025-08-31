-- =====================================================================
-- 01_schema.sql
-- Purpose  : Define core tables and constraints for EcoPath DB
-- Author   : Yinghan Ma
-- =====================================================================

-- BEGIN;

-- Drop old tables in dependency order
DROP TABLE IF EXISTS generation_mix CASCADE;
DROP TABLE IF EXISTS state_initiatives CASCADE;
DROP TABLE IF EXISTS emission_total CASCADE;
DROP TABLE IF EXISTS population CASCADE;
DROP TABLE IF EXISTS state CASCADE;

-- 0) States / Territories (dimension)
CREATE TABLE IF NOT EXISTS state (
  state_id      VARCHAR(8)  PRIMARY KEY,               
  state_name    VARCHAR(64) NOT NULL,
  abbrev        VARCHAR(8)  NOT NULL,
  is_aggregate  BOOLEAN     NOT NULL DEFAULT FALSE,
  CONSTRAINT ck_state_id_upper CHECK (state_id = UPPER(state_id))
);

-- Seed once (safe to re-run)
INSERT INTO state(state_id,state_name,abbrev,is_aggregate) VALUES
  ('NSW','New South Wales','NSW',FALSE),
  ('VIC','Victoria','VIC',FALSE),
  ('QLD','Queensland','QLD',FALSE),
  ('SA' ,'South Australia','SA',FALSE),
  ('WA' ,'Western Australia','WA',FALSE),
  ('TAS','Tasmania','TAS',FALSE),
  ('ACT','Australian Capital Territory','ACT',FALSE),
  ('NT' ,'Northern Territory','NT',FALSE),
  ('AUS','Australia (All States)','AUS',TRUE)
ON CONFLICT (state_id) DO NOTHING;

-- 1) Population (annual)
CREATE TABLE IF NOT EXISTS population (
  state_id    VARCHAR(8) REFERENCES state(state_id),
  year        INT NOT NULL,
  population  BIGINT NOT NULL,
  PRIMARY KEY (state_id, year)
);

-- 2) Emissions total (annual, tCO2-e)
CREATE TABLE IF NOT EXISTS emission_total (
  state_id   VARCHAR(8) REFERENCES state(state_id),
  year       INT NOT NULL,
  emissions_mt NUMERIC NOT NULL,
  PRIMARY KEY (state_id, year)
);

-- 3) Generation mix (monthly, long/normalized)
--    We keep normalized form for easy pivoting and charts.
CREATE TABLE IF NOT EXISTS generation_mix (
  state_id       VARCHAR(8) REFERENCES state(state_id),
  dmonth         DATE NOT NULL,                               
  energy_type    VARCHAR(32) NOT NULL,                      
  generation_gwh NUMERIC NOT NULL,
  PRIMARY KEY (state_id, dmonth, energy_type),
  CONSTRAINT chk_energy_type
    CHECK (energy_type IN ('coal','bioenergy','distillate','gas','battery','hydro','wind','solar'))
);

-- 4) State climate initiatives
CREATE TABLE IF NOT EXISTS state_initiatives (
  state_id         VARCHAR(8) REFERENCES state(state_id),
  target_year      INT NOT NULL,              
  baseline_year    INT NOT NULL,            
  target_value_pct NUMERIC NOT NULL,          
  notes            TEXT,
  PRIMARY KEY (state_id, target_year)
);

