# Database Setup Guide

This guide will help you set up a local PostgreSQL database for the EcoPath backend.

## Prerequisites

1. **PostgreSQL** installed and running locally
2. **Node.js** and **npm** installed
3. **Git** for cloning the repository

## Quick Setup

### 1. Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Windows
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database
CREATE DATABASE ecopath;

# Create user (optional, you can use default postgres user)
CREATE USER ecopath_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ecopath TO ecopath_user;

# Exit psql
\q
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```bash
# Database Configuration
DB_USER=postgres          # or your custom user
DB_HOST=localhost
DB_NAME=ecopath
DB_PASSWORD=postgres      # or your custom password
DB_PORT=5432

# Server Configuration
PORT=5001
NODE_ENV=development
```

### 4. Initialize Database

```bash
# Install dependencies
npm install

# Initialize database with schema and data
npm run db:init
```

### 5. Start the Backend

```bash
# Development mode
npm run dev

# Or build and start
npm run build
npm start
```

## Database Schema

The database includes the following tables:

- **state**: Australian states and territories
- **population**: Annual population data by state
- **emission_total**: Annual greenhouse gas emissions by state
- **generation_mix**: Monthly energy generation mix by state
- **state_initiatives**: Climate target initiatives by state

## Data Sources

- **Emissions**: Australian Department of Environment and Energy
- **Population**: Australian Bureau of Statistics
- **Generation**: Open Electricity dataset
- **Initiatives**: State government climate policies

## API Endpoints

Once the database is set up, the following endpoints will return real data:

- `GET /api/energy-mix?state=VIC` - Energy mix by state
- `GET /api/emissions?state=VIC&range=10y` - Emissions data with time filtering
- `GET /api/population?state=VIC` - Population data by state
- `GET /api/initiatives?state=VIC` - Climate initiatives by state

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL service status**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Verify database exists**
   ```bash
   psql -U postgres -l | grep ecopath
   ```

3. **Check connection parameters**
   - Verify `.env` file exists and has correct values
   - Ensure PostgreSQL is listening on the correct port (default: 5432)

### Permission Issues

1. **Check user privileges**
   ```bash
   psql -U postgres -d ecopath -c "\du"
   ```

2. **Reset user password if needed**
   ```bash
   psql postgres -c "ALTER USER postgres PASSWORD 'postgres';"
   ```

### Data Loading Issues

1. **Check file paths**
   - Ensure database scripts are in the correct location
   - Verify CSV data files exist

2. **Check file permissions**
   - Ensure the backend can read the database scripts and data files

## Development Workflow

1. **Make database changes**
   - Update schema files in `ecopath-database/`
   - Update data loading scripts if needed

2. **Reset database during development**
   ```bash
   npm run db:reset
   ```

3. **Test API endpoints**
   - Use the built-in Swagger documentation at `/docs`
   - Test with tools like Postman or curl

## Production Considerations

- Use environment-specific configuration files
- Implement proper database connection pooling
- Add database migration scripts
- Set up backup and recovery procedures
- Use read replicas for heavy read workloads
