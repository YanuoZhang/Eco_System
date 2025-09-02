#!/bin/bash

# =====================================================================
# rebuild_dev.sh - Simple database rebuild for development
# =====================================================================

set -e

echo "🚀 Starting EcoPath database rebuild..."

# Check if database exists, if not create it
echo "📋 Checking database..."
psql -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname='ecopath';" | grep -q 1 || {
    echo "📝 Creating database 'ecopath'..."
    psql -U postgres -d postgres -c "CREATE DATABASE ecopath;"
}

echo "🔧 Executing schema and data files..."

# Execute all files in order
for file in 01_schema.sql 02_load_emissions.sql 03_load_population.sql 04_load_generation.sql 05_load_state_initiatives.sql 06_load_electricity_factors.sql 07_load_household_energy.sql 08_load_fuel_economy.sql 09_load_gas_factors.sql 10_load_total_dwellings.sql 11_load_transport_fuels_factors.sql 12_visual_queries.sql; do
    echo "📄 Executing: $file"
    psql -U postgres -d ecopath -f "$file"
done

echo "✅ Database rebuild completed successfully!"
echo "🎯 You can now connect to database 'ecopath'"
