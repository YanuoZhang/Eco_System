import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(__dirname, '../../../ecopath-database/01_schema.sql');
const CSV_DATA_PATH = path.join(__dirname, '../../../ecopath-database/data');

async function initDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read and execute schema
    console.log('📋 Creating database schema...');
    const schemaSQL = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ Schema created successfully');
    
    // Load emissions data
    console.log('📊 Loading emissions data...');
    await loadEmissionsData();
    
    // Load population data
    console.log('👥 Loading population data...');
    await loadPopulationData();
    
    // Load generation data
    console.log('⚡ Loading generation data...');
    await loadGenerationData();
    
    // Load state initiatives
    console.log('🎯 Loading state initiatives...');
    await loadStateInitiatives();
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function loadEmissionsData() {
  const csvPath = path.join(CSV_DATA_PATH, 'Emissions_by_state.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Emissions CSV file not found, skipping...');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Create temporary table
  await pool.query(`
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
  `);

  // Insert data row by row
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length >= 10) {
      await pool.query(`
        INSERT INTO emission_raw VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, values);
    }
  }

  // Transform and insert into main table
  await pool.query(`
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
    WHERE x.mt IS NOT NULL
    ON CONFLICT (state_id, year) DO UPDATE
    SET emissions_mt = EXCLUDED.emissions_mt;
  `);

  console.log('✅ Emissions data loaded successfully');
}

async function loadPopulationData() {
  const states = ['NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
  
  for (const state of states) {
    const csvPath = path.join(CSV_DATA_PATH, `${state}_population.csv`);
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  Population CSV for ${state} not found, skipping...`);
      continue;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV parsing that handles quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= 3) {
        // CSV format: state,year,Population
        const stateFromFile = values[0];
        const yearStr = values[1];
        const populationStr = values[2].replace(/"/g, '').replace(/,/g, ''); // Remove quotes and commas
        
        // Convert year format from "1960-61" to 1960
        const year = parseInt(yearStr.split('-')[0]);
        const population = parseInt(populationStr);
        
        if (!isNaN(year) && !isNaN(population) && stateFromFile === state) {
          try {
            await pool.query(`
              INSERT INTO population (state_id, year, population)
              VALUES ($1, $2, $3)
              ON CONFLICT (state_id, year) DO UPDATE
              SET population = EXCLUDED.population;
            `, [state, year, population]);
          } catch (error) {
            console.log(`⚠️  Error inserting population data for ${state}, ${year}: ${error}`);
          }
        }
      }
    }
  }
  
  console.log('✅ Population data loaded successfully');
}

async function loadGenerationData() {
  const states = ['NSW', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
  
  for (const state of states) {
    const csvPath = path.join(CSV_DATA_PATH, `Generation_${state}.csv`);
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️  Generation CSV for ${state} not found, skipping...`);
      continue;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length) {
        const date = values[0];
        const parsedDate = new Date(date);
        
        if (!isNaN(parsedDate.getTime())) {
          for (let j = 1; j < headers.length; j++) {
            // Clean up the energy type name
            let energyType = headers[j].toLowerCase()
              .replace(/\s*-\s*gwh\s*$/i, '')  // Remove " -  GWh" suffix
              .replace(/\s+/g, ' ')             // Normalize spaces
              .trim();
            
            // Map to valid energy types
            const energyTypeMap: Record<string, string> = {
              'coal': 'coal',
              'bioenergy': 'bioenergy',
              'distillate': 'distillate',
              'gas': 'gas',
              'battery (discharging)': 'battery',
              'hydro': 'hydro',
              'wind': 'wind',
              'solar': 'solar'
            };
            
            const mappedEnergyType = energyTypeMap[energyType];
            if (!mappedEnergyType) {
              console.log(`⚠️  Skipping unknown energy type: ${energyType} for ${state}`);
              continue;
            }
            
            const generation = parseFloat(values[j]);
            
            if (!isNaN(generation) && generation > 0) {
              try {
                await pool.query(`
                  INSERT INTO generation_mix (state_id, dmonth, energy_type, generation_gwh)
                  VALUES ($1, $2, $3, $4)
                  ON CONFLICT (state_id, dmonth, energy_type) DO UPDATE
                  SET generation_gwh = EXCLUDED.generation_gwh;
                `, [state, parsedDate, mappedEnergyType, generation]);
              } catch (error) {
                console.log(`⚠️  Error inserting generation data for ${state}, ${parsedDate}, ${mappedEnergyType}: ${error}`);
              }
            }
          }
        }
      }
    }
  }
  
  console.log('✅ Generation data loaded successfully');
}

async function loadStateInitiatives() {
  // Insert some sample state initiatives
  const initiatives = [
    { state_id: 'VIC', target_year: 2030, baseline_year: 2005, target_value_pct: 50, notes: 'Net zero emissions target' },
    { state_id: 'NSW', target_year: 2030, baseline_year: 2005, target_value_pct: 50, notes: 'Net zero emissions target' },
    { state_id: 'QLD', target_year: 2030, baseline_year: 2005, target_value_pct: 30, notes: '30% reduction target' },
    { state_id: 'SA', target_year: 2030, baseline_year: 2005, target_value_pct: 50, notes: 'Net zero emissions target' },
    { state_id: 'TAS', target_year: 2030, baseline_year: 2005, target_value_pct: 50, notes: 'Net zero emissions target' },
    { state_id: 'WA', target_year: 2030, baseline_year: 2005, target_value_pct: 50, notes: 'Net zero emissions target' }
  ];

  for (const initiative of initiatives) {
    await pool.query(`
      INSERT INTO state_initiatives (state_id, target_year, baseline_year, target_value_pct, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (state_id, target_year) DO UPDATE
      SET baseline_year = EXCLUDED.baseline_year,
          target_value_pct = EXCLUDED.target_value_pct,
          notes = EXCLUDED.notes;
    `, [initiative.state_id, initiative.target_year, initiative.baseline_year, initiative.target_value_pct, initiative.notes]);
  }
  
  console.log('✅ State initiatives loaded successfully');
}

// Run if called directly
if (require.main === module) {
  initDatabase().catch(console.error);
}

export { initDatabase };
