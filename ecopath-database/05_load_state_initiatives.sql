-- ================================
-- State Initiatives Climate Targets
-- ================================
INSERT INTO state_initiatives
  (state_id, target_year, baseline_year, target_value_pct, notes)
VALUES
  ('NSW', 2030, 2005,  50, 'NSW 2030 climate target'),
  ('VIC', 2030, 2005,  50, 'Victoria 2030 climate target'),
  ('QLD', 2030, 2005,  30, 'Queensland 2030 target'),
  ('SA' , 2030, 2005,  50, 'South Australia 2030 target (at least 50%)'),
  ('WA' , 2030, 2020,  80, 'Western Australia 2030 target (vs 2020 levels)'),
  ('ACT', 2030, 1990,  70, 'ACT 2030 target (65-75%, using 70% midpoint)'),
  ('TAS', 2030, 2005, 100, 'Tasmania net zero (achieved in 2015)')
ON CONFLICT (state_id, target_year) DO UPDATE
SET baseline_year    = EXCLUDED.baseline_year,
    target_value_pct = EXCLUDED.target_value_pct,
    notes            = EXCLUDED.notes;

