# Energy Mix API Tests

This directory contains comprehensive unit tests and contract tests for the `/api/energy-mix` endpoint.

## Test Files

### `energy-mix.test.ts`
Main unit test file covering:
- Valid state parameters (VIC, NSW, QLD, SA, TAS, WA)
- Invalid state parameters (missing, empty, unsupported)
- Schema validation against OpenAPI specification
- Percentage sum validation (~100% with tolerance)
- Required fields validation (no null/undefined values)
- Edge cases (case insensitive, consistency)

### `energy-mix.contract.test.ts`
Contract tests focusing on API compliance:
- OpenAPI schema compliance validation
- Exact count of energy sources (5 per state)
- Enum validation for energy sources
- Range validation for percentages and generation
- Error response format consistency
- Business logic validation

## Test Coverage

The tests cover all acceptance criteria:

1. **Returns 200 for valid states** - Tests all 6 supported states
2. **Returns 400/404 for invalid states** - Tests missing params and unsupported states
3. **Response schema validation** - Validates against OpenAPI 3.0 schema
4. **Percentage totals ~ 100%** - Validates with 0.01% tolerance
5. **Required fields present** - Ensures no null/undefined values

## Running Tests

```bash
# Using npm
npm test

# Using vitest directly
npx vitest run

# Using the test runner script
node test-runner.js

# Watch mode
npm run test:watch
```

## Test Data

The tests use the same mock data as the main application:
- VIC: Coal-heavy mix (63% coal)
- NSW: High coal usage (70% coal)
- QLD: Coal dominant (72% coal)
- SA: Gas and renewables (35% gas, 45% wind, 20% solar)
- TAS: Hydro dominant (80% hydro)
- WA: Gas dominant (42% gas, 32% coal)

## Validation Rules

- All percentages must be 0-100
- All generation values must be >= 0
- Exactly 5 energy sources per state
- Sources must be: coal, gas, hydro, wind, solar
- Percentage sum must equal 100% ± 0.01%
- No missing or null required fields

## Schema Compliance

Tests validate against the OpenAPI 3.0 specification defined in `index.ts`:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["source", "percentage", "generation"],
    "properties": {
      "source": { "type": "string", "enum": ["coal", "gas", "hydro", "wind", "solar"] },
      "percentage": { "type": "number", "minimum": 0, "maximum": 100 },
      "generation": { "type": "number", "minimum": 0 }
    }
  }
}
```
