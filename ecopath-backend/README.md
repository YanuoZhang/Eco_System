# Ecopath Backend

## Configuration

The backend uses environment variables for configuration. Set `NODE_ENV` to switch between environments:

### Environment Variables

- `NODE_ENV`: Set to `production` for production, defaults to `development`
- `DB_USER`: Database username (default: ecopath_user)
- `DB_HOST`: Database host (default: localhost)
- `DB_NAME`: Database name (default: ecopath)
- `DB_PASSWORD`: Database password (default: empty)
- `DB_PORT`: Database port (default: 5432)
- `DB_MAX_CONNECTIONS`: Max database connections (default: 20)
- `DB_IDLE_TIMEOUT`: Database idle timeout in ms (default: 30000)
- `DB_CONNECTION_TIMEOUT`: Database connection timeout in ms (default: 2000)
- `PORT`: Server port (default: 5001)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Usage

```bash
# Development
npm run dev

# Production
NODE_ENV=production npm run dev

# Build and start
npm run build
NODE_ENV=production npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:init` - Initialize database
- `npm run db:view` - View database contents

## Code Quality

### Linting and Formatting

- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Automatically fix linting issues
- `npm run lint:check` - Check linting and report status
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Pre-commit Checks

- `npm run pre-commit` - Run all checks (lint, format, build)
- Git pre-commit hook automatically runs these checks before each commit

## Pre-commit Hook

A pre-commit hook is installed that automatically runs:

1. **Lint Check** - Ensures code follows ESLint rules
2. **Format Check** - Ensures code is properly formatted with Prettier
3. **Build Check** - Ensures TypeScript compiles without errors

If any check fails, the commit will be blocked until issues are resolved.

### Manual Pre-commit Check

```bash
npm run pre-commit
```

### Fixing Issues

```bash
# Fix linting issues
npm run lint:fix

# Fix formatting issues
npm run format

# Check everything is fixed
npm run pre-commit
```
