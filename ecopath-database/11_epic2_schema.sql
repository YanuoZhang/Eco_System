-- =====================================================================
-- 01_schema.sql
-- Purpose : Core tables for Epic 2 (household & transport emissions)
-- =====================================================================

-- 0) States / Territories (dimension)
CREATE TABLE IF NOT EXISTS state(
  state_id     VARCHAR(8) PRIMARY KEY,          -- NSW/VIC/QLD/SA/WA/TAS/NT/ACT
  state_name   VARCHAR(64) NOT NULL,
  abbrev       VARCHAR(8)  NOT NULL,
  is_aggregate BOOLEAN     NOT NULL DEFAULT FALSE,
  CONSTRAINT ck_state_id_upper CHECK (state_id = UPPER(state_id))
);

INSERT INTO state(state_id,state_name,abbrev,is_aggregate) VALUES
('NSW','New South Wales','NSW',FALSE),
('VIC','Victoria','VIC',FALSE),
('QLD','Queensland','QLD',FALSE),
('SA','South Australia','SA',FALSE),
('WA','Western Australia','WA',FALSE),
('TAS','Tasmania','TAS',FALSE),
('ACT','Australian Capital Territory','ACT',FALSE),
('NT','Northern Territory','NT',FALSE)
ON CONFLICT (state_id) DO NOTHING;

-- 1) Electricity emission factors (kg CO2-e / kWh)
--    Source file: electricity_factors-2024.csv
--    Notes:
--      - Renamed columns for readability:
--          scope2 -> direct_emission_factor_kg_per_kwh
--          scope3 -> supply_chain_emission_factor_kg_per_kwh
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

-- Convenience view: region-level rows duplicated to mapped states
CREATE OR REPLACE VIEW vw_electricity_factor_state AS
SELECT
  m.state_id,
  r.year,
  r.power_region,
  r.direct_emission_factor_kg_per_kwh,
  r.supply_chain_emission_factor_kg_per_kwh
FROM electricity_factor_raw r
JOIN electricity_power_region_map m USING (power_region);

-- State-level factors aggregated from regions (AVG by default)
CREATE TABLE IF NOT EXISTS electricity_factor_by_state (
  year                                      INT NOT NULL,
  state_id                                  VARCHAR(8) NOT NULL REFERENCES state(state_id),
  direct_emission_factor_kg_per_kwh         NUMERIC,
  supply_chain_emission_factor_kg_per_kwh   NUMERIC,
  CONSTRAINT pk_elec_factor_state PRIMARY KEY (year, state_id)
);

-- 2) Household energy use by state (2024, PJ)
--    Source file: electricity_gas_by_household.csv
--    Using table name aligned with loaders: household_energy_2024
CREATE TABLE IF NOT EXISTS household_energy_2024 (
  year         INT NOT NULL DEFAULT 2024,
  state_id     VARCHAR(8) NOT NULL REFERENCES state(state_id),
  energy_type  VARCHAR(32) NOT NULL,      -- 'electricity' | 'natural_gas'
  energy_pj    NUMERIC NOT NULL,
  CONSTRAINT pk_house_energy PRIMARY KEY (year, state_id, energy_type),
  CONSTRAINT ck_house_energy_type CHECK (energy_type IN ('electricity','natural_gas'))
);

-- 3) Fuel economy by state & vehicle type (L/100km)
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

-- Normalized view: one row per fuel_type
CREATE OR REPLACE VIEW vw_fuel_economy AS
SELECT year, state_id, vehicle_type, 'Petrol' AS fuel_type, petrol_l_per_100km  AS liters_per_100km
FROM fuel_economy_raw WHERE petrol_l_per_100km  IS NOT NULL
UNION ALL
SELECT year, state_id, vehicle_type, 'Diesel',      diesel_l_per_100km
FROM fuel_economy_raw WHERE diesel_l_per_100km  IS NOT NULL
UNION ALL
SELECT year, state_id, vehicle_type, 'LPG/CNG',     lpg_cng_l_per_100km
FROM fuel_economy_raw WHERE lpg_cng_l_per_100km IS NOT NULL;

-- 4) Natural gas Scope 3 factors (kg CO2-e / GJ), Metro vs Non-metro
--    Source file: gas_factors-2024.csv
CREATE TABLE IF NOT EXISTS gas_factor_by_state (
  year            INT NOT NULL DEFAULT 2024,
  state_id        VARCHAR(8) NOT NULL REFERENCES state(state_id),
  area_type       VARCHAR(16) NOT NULL,  -- 'Metro' | 'Non-Metro'
  kg_co2e_per_gj  NUMERIC NOT NULL,
  CONSTRAINT pk_gas_factors PRIMARY KEY (year, state_id, area_type),
  CONSTRAINT ck_area_type CHECK (area_type IN ('Metro','Non-Metro'))
);

-- 5) Total dwellings / households (count)
--    Source file: total_dwellings.csv
CREATE TABLE IF NOT EXISTS total_dwellings (
  year        INT NOT NULL DEFAULT 2024,
  state_id    VARCHAR(8) NOT NULL REFERENCES state(state_id),
  households  BIGINT NOT NULL,
  CONSTRAINT pk_total_dwellings PRIMARY KEY (year, state_id)
);

-- 6) Transport fuel emission factors
--    Source file: transport_fuels_factors-2024.csv
--    Columns: fuel_name, energy_density_value, energy_density_unit, emission_factor_value, emission_factor_unit
CREATE TABLE IF NOT EXISTS transport_fuel_factors (
  year                   INT NOT NULL DEFAULT 2024,
  fuel_name              TEXT NOT NULL,
  energy_density_value   NUMERIC NOT NULL,     -- numeric part of "Combined GJ"
  energy_density_unit    TEXT NOT NULL,        -- e.g. 'GJ/kL','GJ/m3','GJ/t'
  emission_factor_value  NUMERIC NOT NULL,     -- numeric part of "CO2-e"
  emission_factor_unit   TEXT NOT NULL,        -- e.g. 'kg CO2-e/kL','kg CO2-e/m3','kg CO2-e/t'
  CONSTRAINT pk_transport_fuel PRIMARY KEY (year, fuel_name)
);

-- Helper view: convert to kg CO2-e per GJ
-- EF(kg/GJ) = (emission_factor_value [kg per unit]) / (energy_density_value [GJ per unit])
CREATE OR REPLACE VIEW vw_transport_fuel_ef_per_gj AS
SELECT
  year,
  fuel_name,
  energy_density_value,
  energy_density_unit,
  emission_factor_value,
  emission_factor_unit,
  (emission_factor_value / NULLIF(energy_density_value,0)) AS kg_co2e_per_gj
FROM transport_fuel_factors;

