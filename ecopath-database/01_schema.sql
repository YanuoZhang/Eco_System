-- =====================================================================
-- 01_schema.sql
-- Purpose  : Define ALL tables and constraints for EcoPath DB (Core + Epic 2)
-- Author   : Yinghan Ma + Combined
-- =====================================================================

-- BEGIN;

-- Drop old tables and views in dependency order
DROP VIEW IF EXISTS vw_electricity_factor_state CASCADE;
DROP VIEW IF EXISTS vw_fuel_economy CASCADE;
DROP VIEW IF EXISTS vw_transport_fuel_ef_per_gj CASCADE;

DROP TABLE IF EXISTS transport_fuel_factors CASCADE;
DROP TABLE IF EXISTS total_dwellings CASCADE;
DROP TABLE IF EXISTS gas_factor_by_state CASCADE;
DROP TABLE IF EXISTS fuel_economy_raw CASCADE;
DROP TABLE IF EXISTS household_energy_2024 CASCADE;
DROP TABLE IF EXISTS electricity_factor_by_state CASCADE;
DROP TABLE IF EXISTS electricity_power_region_map CASCADE;
DROP TABLE IF EXISTS electricity_factor_raw CASCADE;
DROP TABLE IF EXISTS state_initiatives CASCADE;
DROP TABLE IF EXISTS generation_mix CASCADE;
DROP TABLE IF EXISTS emission_total CASCADE;
DROP TABLE IF EXISTS population CASCADE;
DROP TABLE IF EXISTS state CASCADE;

-- =====================================================================
-- CORE TABLES (from original 01_schema.sql)
-- =====================================================================

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

-- =====================================================================
-- EPIC 2 TABLES (from 11_epic2_schema.sql)
-- =====================================================================

-- 5) Electricity emission factors (kg CO2-e / kWh)
--    Source file: electricity_factors-2024.csv
CREATE TABLE IF NOT EXISTS electricity_factor_raw (
  year                                      INT NOT NULL DEFAULT 2024,
  power_region                              TEXT NOT NULL,     -- verbatim label from CSV
  direct_emission_factor_kg_per_kwh         NUMERIC,           -- formerly scope2_kg_per_kwh
  supply_chain_emission_factor_kg_per_kwh   NUMERIC,           -- formerly scope3_kg_per_kwh
  CONSTRAINT pk_elec_factor_raw PRIMARY KEY (year, power_region)
);

-- Mapping: power_region -> state(s). Populated in load script.
CREATE TABLE IF NOT EXISTS electricity_power_region_map (
  power_region  TEXT NOT NULL,
  state_id      VARCHAR(8) NOT NULL REFERENCES state(state_id),
  PRIMARY KEY (power_region, state_id)
);

-- State-level factors aggregated from regions (AVG by default)
CREATE TABLE IF NOT EXISTS electricity_factor_by_state (
  year                                      INT NOT NULL,
  state_id                                  VARCHAR(8) NOT NULL REFERENCES state(state_id),
  direct_emission_factor_kg_per_kwh         NUMERIC,
  supply_chain_emission_factor_kg_per_kwh   NUMERIC,
  CONSTRAINT pk_elec_factor_state PRIMARY KEY (year, state_id)
);

-- 6) Household energy use by state (2024, PJ)
--    Source file: electricity_gas_by_household.csv
CREATE TABLE IF NOT EXISTS household_energy_2024 (
  year         INT NOT NULL DEFAULT 2024,
  state_id     VARCHAR(8) NOT NULL REFERENCES state(state_id),
  energy_type  VARCHAR(32) NOT NULL,      -- 'electricity' | 'natural_gas'
  energy_pj    NUMERIC NOT NULL,
  CONSTRAINT pk_house_energy PRIMARY KEY (year, state_id, energy_type),
  CONSTRAINT ck_house_energy_type CHECK (energy_type IN ('electricity','natural_gas'))
);

-- 7) Fuel economy by state & vehicle type (L/100km)
--    Source file: fuel_economy.csv
CREATE TABLE IF NOT EXISTS fuel_economy_raw (
  year                 INT NOT NULL DEFAULT 2024,
  state_id             VARCHAR(8) NOT NULL REFERENCES state(state_id),
  vehicle_type         VARCHAR(32) NOT NULL,   -- 'Passenger'|'Buses'
  petrol_l_per_100km   NUMERIC,
  diesel_l_per_100km   NUMERIC,
  lpg_cng_l_per_100km  NUMERIC,
  CONSTRAINT pk_fuel_econ_raw PRIMARY KEY (year, state_id, vehicle_type)
);

-- 8) Natural gas Scope 3 factors (kg CO2-e / GJ), Metro vs Non-metro
--    Source file: gas_factors-2024.csv
CREATE TABLE IF NOT EXISTS gas_factor_by_state (
  year            INT NOT NULL DEFAULT 2024,
  state_id        VARCHAR(8) NOT NULL REFERENCES state(state_id),
  area_type       VARCHAR(16) NOT NULL,  -- 'Metro' | 'Non-Metro'
  kg_co2e_per_gj  NUMERIC NOT NULL,
  CONSTRAINT pk_gas_factors PRIMARY KEY (year, state_id, area_type),
  CONSTRAINT ck_area_type CHECK (area_type IN ('Metro','Non-Metro'))
);

-- 9) Total dwellings / households (count)
--    Source file: total_dwellings.csv
CREATE TABLE IF NOT EXISTS total_dwellings (
  year        INT NOT NULL DEFAULT 2024,
  state_id    VARCHAR(8) NOT NULL REFERENCES state(state_id),
  households  BIGINT NOT NULL,
  CONSTRAINT pk_total_dwellings PRIMARY KEY (year, state_id)
);

-- 10) Transport fuel emission factors
--     Source file: transport_fuels_factors-2024.csv
CREATE TABLE IF NOT EXISTS transport_fuel_factors (
  year                   INT NOT NULL DEFAULT 2024,
  fuel_name              TEXT NOT NULL,
  energy_density_value   NUMERIC NOT NULL,     -- numeric part of "Combined GJ"
  energy_density_unit    TEXT NOT NULL,        -- e.g. 'GJ/kL','GJ/m3','GJ/t'
  emission_factor_value  NUMERIC NOT NULL,     -- numeric part of "CO2-e"
  emission_factor_unit   TEXT NOT NULL,        -- e.g. 'kg CO2-e/kL','kg CO2-e/m3','kg CO2-e/t'
  CONSTRAINT pk_transport_fuel PRIMARY KEY (year, fuel_name)
);

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Convenience view: region-level rows duplicated to mapped states
CREATE VIEW vw_electricity_factor_state AS
SELECT
  m.state_id,
  r.year,
  r.power_region,
  r.direct_emission_factor_kg_per_kwh,
  r.supply_chain_emission_factor_kg_per_kwh
FROM electricity_factor_raw r
JOIN electricity_power_region_map m USING (power_region);

-- Normalized view: one row per fuel_type
CREATE VIEW vw_fuel_economy AS
SELECT year, state_id, vehicle_type, 'Petrol' AS fuel_type, petrol_l_per_100km  AS liters_per_100km
FROM fuel_economy_raw WHERE petrol_l_per_100km  IS NOT NULL
UNION ALL
SELECT year, state_id, vehicle_type, 'Diesel',      diesel_l_per_100km
FROM fuel_economy_raw WHERE diesel_l_per_100km  IS NOT NULL
UNION ALL
SELECT year, state_id, vehicle_type, 'LPG/CNG',     lpg_cng_l_per_100km
FROM fuel_economy_raw WHERE lpg_cng_l_per_100km IS NOT NULL;

-- Helper view: convert to kg CO2-e per GJ
-- EF(kg/GJ) = (emission_factor_value [kg per unit]) / (energy_density_value [GJ per unit])
CREATE VIEW vw_transport_fuel_ef_per_gj AS
SELECT
  year,
  fuel_name,
  energy_density_value,
  energy_density_unit,
  emission_factor_value,
  emission_factor_unit,
  (emission_factor_value / NULLIF(energy_density_value,0)) AS kg_co2e_per_gj
FROM transport_fuel_factors;

-- =====================================================================
-- VERIFICATION
-- =====================================================================

-- List all tables
SELECT 'Tables created successfully:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- List all views
SELECT 'Views created successfully:' as status;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- COMMIT;

