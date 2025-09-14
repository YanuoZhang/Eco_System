-- =====================================================================
-- 17_load_transport_fuels_factors.sql
-- CSV columns (6): Fuel Type, Fuel Combusted, Combined CO2-e/GJ, GJ, CO2-e, Unit
-- Example Unit values: 'kg CO2-e/kL', 'kg CO2-e/m3', 'kg CO2-e/t'
-- =====================================================================

BEGIN;

TRUNCATE transport_fuel_factors;
\i 17_load_transport_fuels_factors.sql


DROP TABLE IF EXISTS _tmp_transport_fuels;
CREATE TEMP TABLE _tmp_transport_fuels (
  fuel_type            TEXT,
  fuel_name            TEXT,
  combined_kg_per_gj   NUMERIC,   -- from "Combined CO2-e/GJ"
  energy_gj_per_unit   NUMERIC,   -- from "GJ" (GJ per unit volume/mass)
  emission_kg_per_unit NUMERIC,   -- from "CO2-e"
  emission_unit        TEXT       -- from "Unit" (e.g., 'kg CO2-e/kL')
);

-- IMPORTANT: keep this command on ONE line; explicitly map 6 target columns.
\copy _tmp_transport_fuels (fuel_type, fuel_name, combined_kg_per_gj, energy_gj_per_unit, emission_kg_per_unit, emission_unit) FROM transport_fuels_factors-2024.csv WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"')

-- Upsert into final table
INSERT INTO transport_fuel_factors 
  (year, fuel_name, energy_density_value, energy_density_unit, emission_factor_value, emission_factor_unit)
SELECT DISTINCT ON (tf.fuel_name)
  2024,
  tf.fuel_name,
  tf.energy_gj_per_unit,
  CASE 
    WHEN tf.emission_unit LIKE '%/kL' THEN 'GJ/kL'
    WHEN tf.emission_unit LIKE '%/m3' THEN 'GJ/m3'
    WHEN tf.emission_unit LIKE '%/t'  THEN 'GJ/t'
    ELSE 'GJ/kL'
  END AS energy_density_unit,
  tf.emission_kg_per_unit,
  tf.emission_unit
FROM _tmp_transport_fuels tf 
WHERE tf.fuel_name IS NOT NULL 
  AND tf.energy_gj_per_unit IS NOT NULL 
  AND tf.emission_kg_per_unit IS NOT NULL
ORDER BY tf.fuel_name, tf.fuel_type 
ON CONFLICT (year, fuel_name) DO UPDATE SET
  energy_density_value  = EXCLUDED.energy_density_value,
  energy_density_unit   = EXCLUDED.energy_density_unit,
  emission_factor_value = EXCLUDED.emission_factor_value,
  emission_factor_unit  = EXCLUDED.emission_factor_unit;

COMMIT;

select * from transport_fuel_factors;

