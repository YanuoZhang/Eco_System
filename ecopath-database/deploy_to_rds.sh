#!/bin/bash

# =====================================================================
# deploy_to_rds.sh - Database deployment script for AWS RDS
# =====================================================================

set -e

echo "🚀 Starting EcoPath database deployment to AWS RDS..."

# RDS Configuration
DB_HOST="localhost"
DB_PORT="7654"
DB_NAME="ecopath-db"
DB_USER="postgres"
DB_PASSWORD="EcoDb2025!"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check if data directory exists
if [ ! -d "data" ]; then
    echo "❌ Error: data directory not found. Please run this script from ecopath-database directory."
    exit 1
fi

echo "📁 Data directory found: $(pwd)/data"
echo "📊 CSV files available:"
ls -la data/*.csv | head -10

# Test RDS connection
echo "📋 Testing RDS connection..."
export PGPASSWORD="$DB_PASSWORD"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null; then
    echo "✅ RDS connection successful"
else
    echo "❌ Cannot connect to RDS. Please check:"
    echo "  - RDS instance is running"
    echo "  - Security groups allow your IP"
    echo "  - Database credentials are correct"
    echo "  - Network connectivity"
    exit 1
fi

# === Step 1: Import schema ===
echo "⏳ Importing schema..."
echo "📄 Executing: 01_schema.sql"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f 01_schema.sql
echo "✅ Schema imported successfully"

# === Step 2: Import data files ===
echo "📦 Importing data files..."

# Execute all data loading scripts in order
for file in 02_load_emissions.sql 03_load_population.sql 04_load_generation.sql \
            05_load_state_initiatives.sql 06_load_electricity_factors.sql \
            07_load_household_energy.sql 08_load_fuel_economy.sql \
            09_load_gas_factors.sql 10_load_total_dwellings.sql \
            11_load_transport_fuels_factors.sql 12_visual_queries.sql; do
    
    if [ -f "$file" ]; then
        echo "→ Executing: $file"
        echo "📊 This script will import CSV data..."
        
        # Execute the script and capture any errors
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
            echo "✅ $file executed successfully"
        else
            echo "❌ $file failed to execute"
            echo "🔍 Check the error messages above for details"
            exit 1
        fi
    else
        echo "⚠️  Warning: $file not found, skipping..."
    fi
done

echo "✅ Database deployment completed successfully on RDS!"
echo "🎯 You can now connect to RDS database '$DB_NAME'"
echo "🌐 Host: $DB_HOST"
echo "👤 User: $DB_USER"

# Verify data was imported
echo "🔍 Verifying data import..."
echo "📊 Checking table row counts:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'emission_total' as table_name, COUNT(*) as row_count FROM emission_total
UNION ALL
SELECT 'population', COUNT(*) FROM population
UNION ALL
SELECT 'generation_mix', COUNT(*) FROM generation_mix
UNION ALL
SELECT 'state', COUNT(*) FROM state
ORDER BY table_name;
"

# Clean up password from environment
unset PGPASSWORD