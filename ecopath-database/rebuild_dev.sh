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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"

# Execute all files in order
for file in 01_schema.sql 02_load_emissions.sql 03_load_population.sql 04_load_generation.sql 05_load_state_initiatives.sql 06_load_electricity_factors.sql 07_load_household_energy.sql 08_load_fuel_economy.sql 09_load_gas_factors.sql 10_load_total_dwellings.sql 11_load_transport_fuels_factors.sql 12_visual_queries.sql; do
    echo "📄 Executing: $file"
    if [[ "$file" == "02_load_emissions.sql" || "$file" == "03_load_population.sql" || "$file" == "04_load_generation.sql" || "$file" == "06_load_electricity_factors.sql" || "$file" == "07_load_household_energy.sql" || "$file" == "08_load_fuel_economy.sql" || "$file" == "09_load_gas_factors.sql" || "$file" == "10_load_total_dwellings.sql" || "$file" == "11_load_transport_fuels_factors.sql" ]]; then
        # Files that need to be run from data directory
        (cd "$DATA_DIR" && psql -U postgres -d ecopath -f "$SCRIPT_DIR/$file")
    else
        # Files that can be run from script directory
        psql -U postgres -d ecopath -v DATA_DIR="$DATA_DIR" -f "$file"
    fi
done

echo "✅ Database rebuild completed successfully!"
echo "🎯 You can now connect to database 'ecopath'"
