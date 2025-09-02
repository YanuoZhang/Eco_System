-- =====================================================================
-- 14_load_fuel_economy.sql
-- Source: fuel_economy.csv
-- =====================================================================

\set ON_ERROR_STOP 1
BEGIN;

DROP TABLE IF EXISTS _tmp_fuel_econ;
CREATE TEMP TABLE _tmp_fuel_econ (
  state_id     TEXT,
  vehicle_type TEXT,
  petrol_l_per_100km NUMERIC,
  diesel_l_per_100km NUMERIC,
  lpg_cng_l_per_100km NUMERIC
);

\copy _tmp_fuel_econ(state_id, vehicle_type, petrol_l_per_100km, diesel_l_per_100km, lpg_cng_l_per_100km) FROM 'fuel_economy.csv' CSV HEADER;

-- Upsert
INSERT INTO fuel_economy_raw(year, state_id, vehicle_type, petrol_l_per_100km, diesel_l_per_100km, lpg_cng_l_per_100km)
SELECT
  2024,
  UPPER(state_id),
  INITCAP(vehicle_type),
  petrol_l_per_100km,
  diesel_l_per_100km,
  lpg_cng_l_per_100km
FROM _tmp_fuel_econ
WHERE state_id IS NOT NULL
ON CONFLICT (year, state_id, vehicle_type) DO UPDATE
SET petrol_l_per_100km   = EXCLUDED.petrol_l_per_100km,
    diesel_l_per_100km   = EXCLUDED.diesel_l_per_100km,
    lpg_cng_l_per_100km  = EXCLUDED.lpg_cng_l_per_100km;

COMMIT;
