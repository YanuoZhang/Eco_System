import { pool } from '../config/database';

async function viewDatabase() {
  try {
    console.log('🔍 EcoPath Database Overview\n');
    
    // 1. View all tables
    console.log('📋 Tables in database:');
    const tablesResult = await pool.query(`
      SELECT schemaname, relname as tablename, n_tup_ins as rows 
      FROM pg_stat_user_tables 
      ORDER BY relname;
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}: ${row.rows} rows`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. View state information
    console.log('🏛️  State Information:');
    const statesResult = await pool.query('SELECT * FROM state ORDER BY state_id;');
    statesResult.rows.forEach(row => {
      console.log(`  ${row.state_id}: ${row.state_name} (${row.abbrev})`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. View emissions data sample
    console.log('🌍 Emissions Data Sample (VIC):');
    const emissionsResult = await pool.query(`
      SELECT state_id, year, emissions_mt 
      FROM emission_total 
      WHERE state_id = 'VIC' 
      ORDER BY year DESC 
      LIMIT 5;
    `);
    emissionsResult.rows.forEach(row => {
      console.log(`  ${row.year}: ${row.emissions_mt} Mt CO2-e`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. View generation data sample
    console.log('⚡ Generation Data Sample (VIC, latest month):');
    const generationResult = await pool.query(`
      SELECT state_id, dmonth, energy_type, generation_gwh
      FROM generation_mix 
      WHERE state_id = 'VIC' 
      ORDER BY dmonth DESC, generation_gwh DESC
      LIMIT 10;
    `);
    generationResult.rows.forEach(row => {
      console.log(`  ${row.dmonth.toISOString().split('T')[0]} | ${row.energy_type}: ${row.generation_gwh} GWh`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. View state initiatives
    console.log('🎯 State Climate Initiatives:');
    const initiativesResult = await pool.query('SELECT * FROM state_initiatives ORDER BY state_id;');
    initiativesResult.rows.forEach(row => {
      console.log(`  ${row.state_id}: ${row.target_value_pct}% reduction by ${row.target_year} (baseline: ${row.baseline_year})`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 6. Data statistics
    console.log('📊 Data Statistics:');
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM state) as total_states,
        (SELECT COUNT(*) FROM emission_total) as total_emissions,
        (SELECT COUNT(*) FROM generation_mix) as total_generation,
        (SELECT COUNT(*) FROM population) as total_population,
        (SELECT COUNT(*) FROM state_initiatives) as total_initiatives;
    `);
    
    const stats = statsResult.rows[0];
    console.log(`  Total States: ${stats.total_states}`);
    console.log(`  Total Emissions Records: ${stats.total_emissions}`);
    console.log(`  Total Generation Records: ${stats.total_generation}`);
    console.log(`  Total Population Records: ${stats.total_population}`);
    console.log(`  Total Initiatives: ${stats.total_initiatives}`);
    
  } catch (error) {
    console.error('❌ Error viewing database:', error);
  } finally {
    await pool.end();
  }
}

// Run script
if (require.main === module) {
  viewDatabase().catch(console.error);
}

export { viewDatabase };
