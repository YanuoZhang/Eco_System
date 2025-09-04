# Emissions Calculator API

## Overview

The Emissions Calculator API allows users to calculate their household greenhouse gas emissions based on energy usage and transport activities. The API supports flexible time units and provides accurate emissions calculations based on state-specific energy mix data.

## API Endpoints

### 1. Calculate Emissions

**POST** `/api/emissions/calculate`

Calculates total greenhouse gas emissions (CO2-e) based on energy usage and transport activities.

#### Request Body

```json
{
  "energy": {
    "electricity": 100,        // kWh
    "gas": 50,                 // MJ or kWh equivalent
    "timeUnit": "month"        // "month", "quarter", or "year"
  },
  "transport": {
    "mode": "car",             // "car", "bus", "train", "tram", "bicycle", "walking"
    "distance": 20,            // km
    "timeUnit": "week",        // "day", "week", "month", or "year"
    "frequency": 5             // trips per time unit (optional)
  },
  "state": "VIC"               // Australian state code
}
```

**Note**: Both `energy` and `transport` are optional, but at least one must be provided.

#### Response

```json
{
  "totalEmissions": 1250.75,
  "breakdown": {
    "energy": {
      "electricity": 850.0,
      "gas": 90.0,
      "total": 940.0
    },
    "transport": {
      "car": 310.75,
      "total": 310.75
    }
  },
  "timeUnit": "month",
  "calculationDate": "2023-10-27T10:00:00.000Z"
}
```

#### Supported Time Units

- **Energy**: month, quarter, year
- **Transport**: day, week, month, year

#### Supported Transport Modes

- car, bus, train, tram, bicycle, walking

### 2. Get Emissions Factors

**GET** `/api/emissions/factors?state=VIC`

Returns emissions factors for a specific state.

#### Response

```json
{
  "state": "VIC",
  "electricity": 0.85,
  "gas": 0.18,
  "transport": {
    "car": 0.21,
    "bus": 0.08,
    "train": 0.04,
    "tram": 0.03,
    "bicycle": 0,
    "walking": 0
  },
  "units": {
    "electricity": "kg CO2-e per kWh",
    "gas": "kg CO2-e per kWh equivalent",
    "transport": "kg CO2-e per km"
  }
}
```

### 3. Get Supported Units

**GET** `/api/emissions/supported-units`

Returns all supported time units and measurement units.

#### Response

```json
{
  "energy": {
    "timeUnits": ["month", "quarter", "year"],
    "units": {
      "electricity": "kWh",
      "gas": "MJ or kWh equivalent"
    }
  },
  "transport": {
    "timeUnits": ["day", "week", "month", "year"],
    "modes": ["car", "bus", "train", "tram", "bicycle", "walking"],
    "units": {
      "distance": "km",
      "frequency": "trips per time unit"
    }
  }
}
```

## State-Specific Emissions Factors

The API uses state-specific electricity emissions factors based on the energy mix of each Australian state:

| State | Electricity Factor (kg CO2-e/kWh) | Energy Mix Characteristics |
|-------|-----------------------------------|---------------------------|
| VIC   | 0.85                              | High coal dependency |
| NSW   | 0.89                              | High coal dependency |
| QLD   | 0.92                              | Highest coal dependency |
| SA    | 0.45                              | High renewable energy |
| TAS   | 0.12                              | Mostly hydroelectric |
| WA    | 0.65                              | Mixed energy sources |
| ACT   | 0.45                              | Similar to SA |
| NT    | 0.75                              | Mixed energy sources |

## Calculation Examples

### Example 1: Monthly Energy Usage in Victoria

```json
{
  "energy": {
    "electricity": 150,
    "gas": 80,
    "timeUnit": "month"
  },
  "state": "VIC"
}
```

**Calculation**:
- Electricity: 150 kWh/month × 12 months × 0.85 kg CO2-e/kWh = 1,530 kg CO2-e/year
- Gas: 80 kWh/month × 12 months × 0.18 kg CO2-e/kWh = 172.8 kg CO2-e/year
- **Total**: 1,702.8 kg CO2-e/year

### Example 2: Weekly Car Commute in NSW

```json
{
  "transport": {
    "mode": "car",
    "distance": 25,
    "timeUnit": "week",
    "frequency": 5
  },
  "state": "NSW"
}
```

**Calculation**:
- Distance: 25 km/week × 52 weeks × 5 trips = 6,500 km/year
- Emissions: 6,500 km × 0.21 kg CO2-e/km = 1,365 kg CO2-e/year

### Example 3: Combined Energy and Transport

```json
{
  "energy": {
    "electricity": 200,
    "timeUnit": "quarter"
  },
  "transport": {
    "mode": "train",
    "distance": 10,
    "timeUnit": "quarter",
    "frequency": 40
  },
  "state": "SA"
}
```

**Calculation**:
- Electricity: 200 kWh/quarter × 4 quarters × 0.45 kg CO2-e/kWh = 360 kg CO2-e/year
- Train: 10 km/quarter × 4 quarters × 40 trips × 0.04 kg CO2-e/km = 64 kg CO2-e/year
- **Total**: 424 kg CO2-e/year

## Error Handling

### 400 Bad Request
- Missing required field 'state'
- No energy or transport data provided
- Invalid state code

### 500 Internal Server Error
- Server processing errors
- Data validation failures

## Testing

Run the test script to verify all endpoints:

```bash
node test-emissions.js
```

## Frontend Integration

The API is designed to support the user story requirements:

1. **Time Unit Selection**: Frontend can call `/api/emissions/supported-units` to get available options
2. **Partial Data**: API accepts partial data (only energy or only transport)
3. **Real-time Calculation**: Calculate emissions as users input data
4. **State-specific Accuracy**: Uses actual energy mix data for each state

## Data Sources

- **Electricity Emissions Factors**: Based on state energy mix data from Australian Energy Market Operator (AEMO)
- **Gas Emissions Factor**: Standard natural gas emissions factor
- **Transport Emissions Factors**: Based on Australian transport emissions research

## Future Enhancements

- Support for additional energy sources (solar panels, batteries)
- More granular transport options (electric vehicles, hybrid cars)
- Historical emissions tracking
- Comparison with state/national averages

