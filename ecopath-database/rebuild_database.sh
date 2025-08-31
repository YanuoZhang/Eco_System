#!/bin/bash

# =====================================================================
# rebuild_database.sh
# Purpose: One-click database rebuild for EcoPath
# Author: Auto-generated
# =====================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="ecopath"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EcoPath Database Rebuild Script${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Function to execute SQL file
execute_sql() {
    local file=$1
    local step=$2
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}[$step] Executing: $file${NC}"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully executed: $file${NC}"
        else
            echo -e "${RED}✗ Failed to execute: $file${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: File $file not found${NC}"
        exit 1
    fi
}

# Function to check database connection
check_connection() {
    echo -e "${BLUE}Checking database connection...${NC}"
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}✗ Cannot connect to database. Please check:${NC}"
        echo -e "${YELLOW}  - Database '$DB_NAME' exists${NC}"
        echo -e "${YELLOW}  - User '$DB_USER' has access${NC}"
        echo -e "${YELLOW}  - Host: $DB_HOST, Port: $DB_PORT${NC}"
        echo -e "${YELLOW}  - Password is correct${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting database rebuild...${NC}"
    
    # Check connection first
    check_connection
    
    echo -e "${BLUE}Executing SQL files in order...${NC}"
    
    # Execute all SQL files in order
    execute_sql "01_schema.sql" "01/12"
    execute_sql "02_load_emissions.sql" "02/12"
    execute_sql "03_load_population.sql" "03/12"
    execute_sql "04_load_generation.sql" "04/12"
    execute_sql "05_load_state_initiatives.sql" "05/12"
    execute_sql "06_load_electricity_factors.sql" "06/12"
    execute_sql "07_load_household_energy.sql" "07/12"
    execute_sql "08_load_fuel_economy.sql" "08/12"
    execute_sql "09_load_gas_factors.sql" "09/12"
    execute_sql "10_load_total_dwellings.sql" "10/12"
    execute_sql "11_load_transport_fuels_factors.sql" "11/12"
    execute_sql "12_visual_queries.sql" "12/12"
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Database rebuild completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Run main function
main "$@"
