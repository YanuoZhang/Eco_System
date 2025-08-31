import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUI from "swagger-ui-express";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/environment", (_req: Request, res: Response) => {
  res.json({ env: process.env.NODE_ENV || "development" });
});

// Mock energy mix data approximated from Open Electricity dataset
// Supported sources: coal, gas, hydro, wind, solar
const energyMixByState: Record<
  string,
  Array<{ source: "coal" | "gas" | "hydro" | "wind" | "solar"; percentage: number; generation: number }>
> = {
  VIC: [
    { source: "coal", percentage: 63, generation: 4200 },
    { source: "gas", percentage: 6, generation: 400 },
    { source: "hydro", percentage: 6, generation: 400 },
    { source: "wind", percentage: 20, generation: 1300 },
    { source: "solar", percentage: 5, generation: 340 },
  ],
  NSW: [
    { source: "coal", percentage: 70, generation: 5200 },
    { source: "gas", percentage: 6, generation: 450 },
    { source: "hydro", percentage: 7, generation: 520 },
    { source: "wind", percentage: 8, generation: 600 },
    { source: "solar", percentage: 9, generation: 670 },
  ],
  QLD: [
    { source: "coal", percentage: 72, generation: 5400 },
    { source: "gas", percentage: 12, generation: 900 },
    { source: "hydro", percentage: 3, generation: 220 },
    { source: "wind", percentage: 2, generation: 150 },
    { source: "solar", percentage: 11, generation: 820 },
  ],
  SA: [
    { source: "coal", percentage: 0, generation: 0 },
    { source: "gas", percentage: 35, generation: 500 },
    { source: "hydro", percentage: 0, generation: 0 },
    { source: "wind", percentage: 45, generation: 650 },
    { source: "solar", percentage: 20, generation: 290 },
  ],
  TAS: [
    { source: "coal", percentage: 0, generation: 0 },
    { source: "gas", percentage: 0, generation: 0 },
    { source: "hydro", percentage: 80, generation: 900 },
    { source: "wind", percentage: 15, generation: 170 },
    { source: "solar", percentage: 5, generation: 60 },
  ],
  WA: [
    { source: "coal", percentage: 32, generation: 700 },
    { source: "gas", percentage: 42, generation: 920 },
    { source: "hydro", percentage: 0, generation: 0 },
    { source: "wind", percentage: 16, generation: 350 },
    { source: "solar", percentage: 10, generation: 220 },
  ],
};

// Mock greenhouse gas emissions data
// Based on historical data from Australian Department of Environment and Energy
// Units: Mt CO2-e (Million tonnes of CO2 equivalent)
const emissionsDataByState: Record<
  string,
  Array<{ year: number; value: number }>
> = {
  VIC: [
    { year: 2023, value: 42.7 },
    { year: 2022, value: 44.1 },
    { year: 2021, value: 45.3 },
    { year: 2020, value: 43.8 },
    { year: 2019, value: 47.2 },
    { year: 2018, value: 48.9 },
    { year: 2017, value: 50.1 },
    { year: 2016, value: 52.3 },
    { year: 2015, value: 53.7 },
    { year: 2014, value: 55.2 },
    { year: 2013, value: 56.8 },
    { year: 2012, value: 58.3 },
    { year: 2011, value: 59.9 },
    { year: 2010, value: 61.4 },
  ],
  NSW: [
    { year: 2023, value: 68.9 },
    { year: 2022, value: 71.2 },
    { year: 2021, value: 73.4 },
    { year: 2020, value: 70.8 },
    { year: 2019, value: 75.6 },
    { year: 2018, value: 77.9 },
    { year: 2017, value: 79.3 },
    { year: 2016, value: 81.7 },
    { year: 2015, value: 83.2 },
    { year: 2014, value: 84.8 },
    { year: 2013, value: 86.3 },
    { year: 2012, value: 87.9 },
    { year: 2011, value: 89.4 },
    { year: 2010, value: 91.1 },
  ],
  QLD: [
    { year: 2023, value: 58.3 },
    { year: 2022, value: 60.1 },
    { year: 2021, value: 61.8 },
    { year: 2020, value: 59.7 },
    { year: 2019, value: 63.9 },
    { year: 2018, value: 65.7 },
    { year: 2017, value: 67.2 },
    { year: 2016, value: 69.3 },
    { year: 2015, value: 70.8 },
    { year: 2014, value: 72.3 },
    { year: 2013, value: 73.9 },
    { year: 2012, value: 75.4 },
    { year: 2011, value: 76.9 },
    { year: 2010, value: 78.4 },
  ],
  SA: [
    { year: 2023, value: 12.8 },
    { year: 2022, value: 13.2 },
    { year: 2021, value: 13.5 },
    { year: 2020, value: 13.1 },
    { year: 2019, value: 14.0 },
    { year: 2018, value: 14.3 },
    { year: 2017, value: 14.7 },
    { year: 2016, value: 15.1 },
    { year: 2015, value: 15.4 },
    { year: 2014, value: 15.8 },
    { year: 2013, value: 16.2 },
    { year: 2012, value: 16.6 },
    { year: 2011, value: 17.0 },
    { year: 2010, value: 17.4 },
  ],
  TAS: [
    { year: 2023, value: 3.2 },
    { year: 2022, value: 3.3 },
    { year: 2021, value: 3.4 },
    { year: 2020, value: 3.3 },
    { year: 2019, value: 3.5 },
    { year: 2018, value: 3.6 },
    { year: 2017, value: 3.7 },
    { year: 2016, value: 3.8 },
    { year: 2015, value: 3.9 },
    { year: 2014, value: 4.0 },
    { year: 2013, value: 4.1 },
    { year: 2012, value: 4.2 },
    { year: 2011, value: 4.3 },
    { year: 2010, value: 4.4 },
  ],
  WA: [
    { year: 2023, value: 35.6 },
    { year: 2022, value: 36.8 },
    { year: 2021, value: 37.9 },
    { year: 2020, value: 36.7 },
    { year: 2019, value: 39.3 },
    { year: 2018, value: 40.4 },
    { year: 2017, value: 41.6 },
    { year: 2016, value: 42.8 },
    { year: 2015, value: 44.0 },
    { year: 2014, value: 45.2 },
    { year: 2013, value: 46.4 },
    { year: 2012, value: 47.6 },
    { year: 2011, value: 48.8 },
    { year: 2010, value: 50.0 },
  ],
};

// Mock climate targets data
// This is a placeholder. In a real application, this would be fetched from a database or API.
const climateTargetsByState: Record<
  string,
  { planName: string; progress: number; targetYear: number; description: string }
> = {
  VIC: {
    planName: "Victorian Climate Change Plan 2020",
    progress: 85,
    targetYear: 2030,
    description: "Victorian government's commitment to reduce greenhouse gas emissions by 40% below 2005 levels by 2030.",
  },
  NSW: {
    planName: "NSW Climate Change Strategy 2020",
    progress: 75,
    targetYear: 2030,
    description: "NSW government's commitment to reduce greenhouse gas emissions by 45% below 2000 levels by 2030.",
  },
  QLD: {
    planName: "Queensland Climate Change Strategy 2020",
    progress: 60,
    targetYear: 2030,
    description: "Queensland government's commitment to reduce greenhouse gas emissions by 30% below 2000 levels by 2030.",
  },
  SA: {
    planName: "South Australian Climate Change Strategy 2020",
    progress: 50,
    targetYear: 2030,
    description: "South Australian government's commitment to reduce greenhouse gas emissions by 25% below 2000 levels by 2030.",
  },
  TAS: {
    planName: "Tasmanian Climate Change Strategy 2020",
    progress: 40,
    targetYear: 2030,
    description: "Tasmanian government's commitment to reduce greenhouse gas emissions by 20% below 2000 levels by 2030.",
  },
  WA: {
    planName: "Western Australian Climate Change Strategy 2020",
    progress: 30,
    targetYear: 2030,
    description: "Western Australian government's commitment to reduce greenhouse gas emissions by 15% below 2000 levels by 2030.",
  },
  ACT: {
    planName: "Australian Capital Territory Climate Change Strategy 2020",
    progress: 90,
    targetYear: 2030,
    description: "Australian Capital Territory government's commitment to reduce greenhouse gas emissions by 50% below 2000 levels by 2030.",
  },
  NT: {
    planName: "Northern Territory Climate Change Strategy 2020",
    progress: 20,
    targetYear: 2030,
    description: "Northern Territory government's commitment to reduce greenhouse gas emissions by 10% below 2000 levels by 2030.",
  },
};

// GET /api/energy-mix?state=VIC
app.get("/api/energy-mix", (req: Request, res: Response) => {
  const stateParam = String(req.query.state || "").toUpperCase();
  if (!stateParam) {
    return res.status(400).json({ error: "Missing required query param 'state' (e.g., ?state=VIC)" });
  }
  const data = energyMixByState[stateParam];
  if (!data) {
    return res.status(404).json({ error: `Unsupported or unknown state '${stateParam}'` });
  }
  return res.json(data);
});

// GET /api/emissions?state=VIC&range=10y
app.get("/api/emissions", (req: Request, res: Response) => {
  const stateParam = String(req.query.state || "").toUpperCase();
  const rangeParam = String(req.query.range || "all");

  // Validate state parameter
  if (!stateParam) {
    return res.status(400).json({
      error: "Missing required query param 'state' (e.g., ?state=VIC&range=10y)"
    });
  }

  // Validate range parameter
  const validRanges = ["5y", "10y", "all"];
  if (!validRanges.includes(rangeParam)) {
    return res.status(400).json({
      error: `Invalid range parameter. Must be one of: ${validRanges.join(", ")}`
    });
  }

  // Get emissions data for the state
  const allData = emissionsDataByState[stateParam];
  if (!allData) {
    return res.status(404).json({ error: `Unsupported or unknown state '${stateParam}'` });
  }

  // Filter data based on range
  let filteredData = allData;
  const currentYear = new Date().getFullYear();

  if (rangeParam === "5y") {
    filteredData = allData.filter(item => item.year >= currentYear - 5);
  } else if (rangeParam === "10y") {
    filteredData = allData.filter(item => item.year >= currentYear - 10);
  }
  // For "all", use all data (no filtering)

  // Sort data by year (most recent first)
  filteredData.sort((a, b) => b.year - a.year);

  // Get the latest emission data
  const latest = filteredData.length > 0 ? filteredData[0] : null;

      // Return response
    const response = {
      unit: "Mt CO2-e",
      latest: latest ? { year: latest.year, value: latest.value } : null,
      data: filteredData.map(item => ({ year: item.year, value: item.value }))
    };

  return res.json(response);
});

// GET /api/climate-targets?state=VIC
app.get("/api/climate-targets", (req: Request, res: Response) => {
  try {
    const stateParam = String(req.query.state || "").toUpperCase();
    
    // Validate state parameter
    if (!stateParam) {
      return res.status(400).json({ 
        error: "Missing required query param 'state' (e.g., ?state=VIC)",
        message: "Please provide a state code to get climate target information"
      });
    }

    // Check if state exists in our data
    const climateData = climateTargetsByState[stateParam];
    if (!climateData) {
      return res.status(404).json({ 
        error: `Unsupported or unknown state '${stateParam}'`,
        message: "The provided state code is not supported. Supported states: VIC, NSW, QLD, SA, TAS, WA, ACT, NT",
        supportedStates: Object.keys(climateTargetsByState)
      });
    }

    // Validate that all required data fields exist and are not empty
    if (!climateData.planName || !climateData.planName.trim()) {
      return res.status(500).json({
        error: "Incomplete data for state",
        message: `Climate target data for ${stateParam} is incomplete. Please contact support.`,
        state: stateParam,
        missingField: "planName"
      });
    }

    if (typeof climateData.progress !== 'number' || climateData.progress < 0 || climateData.progress > 100) {
      return res.status(500).json({
        error: "Invalid progress data for state",
        message: `Progress data for ${stateParam} is invalid or out of range. Please contact support.`,
        state: stateParam,
        missingField: "progress",
        expectedRange: "0-100"
      });
    }

    if (!climateData.targetYear || typeof climateData.targetYear !== 'number') {
      return res.status(500).json({
        error: "Missing target year for state",
        message: `Target year data for ${stateParam} is missing. Please contact support.`,
        state: stateParam,
        missingField: "targetYear"
      });
    }

    if (!climateData.description || !climateData.description.trim()) {
      return res.status(500).json({
        error: "Missing description for state",
        message: `Description data for ${stateParam} is missing. Please contact support.`,
        state: stateParam,
        missingField: "description"
      });
    }

    // Return the climate target data
    const response = {
      state: stateParam,
      planName: climateData.planName.trim(),
      progress: climateData.progress,
      targetYear: climateData.targetYear,
      description: climateData.description.trim()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error in climate targets endpoint:', error);
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request. Please try again later.",
      timestamp: new Date().toISOString()
    });
  }
});

// Emissions Calculator API
// Types for emissions calculation
interface EnergyData {
  electricity?: number; // kWh
  gas?: number; // MJ or kWh equivalent
  timeUnit: 'month' | 'quarter' | 'year';
}

interface TransportData {
  mode: 'car' | 'bus' | 'train' | 'tram' | 'bicycle' | 'walking';
  distance: number; // km
  timeUnit: 'day' | 'week' | 'month' | 'year';
  frequency?: number; // trips per time unit
}

interface EmissionsCalculationRequest {
  energy?: EnergyData;
  transport?: TransportData;
  state: string; // For energy mix calculations
}

interface EmissionsCalculationResponse {
  totalEmissions: number; // kg CO2-e
  breakdown: {
    energy?: {
      electricity: number;
      gas: number;
      total: number;
    };
    transport?: {
      [key: string]: number; // mode-specific emissions
      total: number;
    };
  };
  timeUnit: string;
  calculationDate: string;
}

// Emissions factors (kg CO2-e per unit)
const EMISSIONS_FACTORS = {
  // Energy emissions factors (kg CO2-e per kWh)
  electricity: {
    VIC: 0.85, // Victoria has higher coal dependency
    NSW: 0.89, // NSW also coal-heavy
    QLD: 0.92, // Queensland highest coal dependency
    SA: 0.45,  // South Australia more renewable
    TAS: 0.12, // Tasmania mostly hydro
    WA: 0.65,  // Western Australia mixed
    ACT: 0.45, // ACT similar to SA
    NT: 0.75   // Northern Territory mixed
  },
  gas: 0.18, // kg CO2-e per kWh equivalent
  
  // Transport emissions factors (kg CO2-e per km)
  transport: {
    car: 0.21,      // Average car
    bus: 0.08,      // Public bus
    train: 0.04,    // Electric train
    tram: 0.03,     // Electric tram
    bicycle: 0,     // No emissions
    walking: 0      // No emissions
  }
};

// Helper function to convert time units to annual equivalent
function convertToAnnual(value: number, timeUnit: string): number {
  switch (timeUnit) {
    case 'day':
      return value * 365;
    case 'week':
      return value * 52;
    case 'month':
      return value * 12;
    case 'quarter':
      return value * 4;
    case 'year':
      return value;
    default:
      return value;
  }
}

// Helper function to get electricity emissions factor for a state
function getElectricityEmissionsFactor(state: string): number {
  return EMISSIONS_FACTORS.electricity[state as keyof typeof EMISSIONS_FACTORS.electricity] || 0.75;
}

// Calculate emissions from energy usage
function calculateEnergyEmissions(energy: EnergyData, state: string) {
  const annualElectricity = energy.electricity ? convertToAnnual(energy.electricity, energy.timeUnit) : 0;
  const annualGas = energy.gas ? convertToAnnual(energy.gas, energy.timeUnit) : 0;
  
  const electricityEmissions = annualElectricity * getElectricityEmissionsFactor(state);
  const gasEmissions = annualGas * EMISSIONS_FACTORS.gas;
  
  return {
    electricity: electricityEmissions,
    gas: gasEmissions,
    total: electricityEmissions + gasEmissions
  };
}

// Calculate emissions from transport
function calculateTransportEmissions(transport: TransportData) {
  const annualDistance = convertToAnnual(transport.distance, transport.timeUnit);
  const frequency = transport.frequency || 1;
  const totalAnnualDistance = annualDistance * frequency;
  
  const modeEmissions = totalAnnualDistance * EMISSIONS_FACTORS.transport[transport.mode];
  
  return {
    [transport.mode]: modeEmissions,
    total: modeEmissions
  };
}

// POST /api/emissions/calculate
app.post("/api/emissions/calculate", (req: Request, res: Response) => {
  try {
    const requestData: EmissionsCalculationRequest = req.body;
    
    // Validate required fields
    if (!requestData.state) {
      return res.status(400).json({
        error: "Missing required field 'state'",
        message: "Please provide your state for accurate emissions calculations"
      });
    }
    
    if (!requestData.energy && !requestData.transport) {
      return res.status(400).json({
        error: "Missing data",
        message: "Please provide either energy or transport data (or both) for calculation"
      });
    }
    
    // Validate state
    const validStates = Object.keys(EMISSIONS_FACTORS.electricity);
    if (!validStates.includes(requestData.state)) {
      return res.status(400).json({
        error: "Invalid state",
        message: `Unsupported state '${requestData.state}'. Supported states: ${validStates.join(', ')}`,
        supportedStates: validStates
      });
    }
    
    let totalEmissions = 0;
    const breakdown: any = {};
    
    // Calculate energy emissions if provided
    if (requestData.energy) {
      const energyEmissions = calculateEnergyEmissions(requestData.energy, requestData.state);
      breakdown.energy = energyEmissions;
      totalEmissions += energyEmissions.total;
    }
    
    // Calculate transport emissions if provided
    if (requestData.transport) {
      const transportEmissions = calculateTransportEmissions(requestData.transport);
      breakdown.transport = transportEmissions;
      totalEmissions += transportEmissions.total;
    }
    
    // Determine overall time unit for response
    let responseTimeUnit = 'year';
    if (requestData.energy) {
      responseTimeUnit = requestData.energy.timeUnit;
    } else if (requestData.transport) {
      responseTimeUnit = requestData.transport.timeUnit;
    }
    
    const response: EmissionsCalculationResponse = {
      totalEmissions: Math.round(totalEmissions * 100) / 100, // Round to 2 decimal places
      breakdown,
      timeUnit: responseTimeUnit,
      calculationDate: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error in emissions calculation:', error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while calculating emissions. Please try again.",
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/emissions/factors
app.get("/api/emissions/factors", (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    
    if (!state) {
      return res.status(400).json({
        error: "Missing state parameter",
        message: "Please provide a state parameter to get emissions factors"
      });
    }
    
    const validStates = Object.keys(EMISSIONS_FACTORS.electricity);
    if (!validStates.includes(state)) {
      return res.status(400).json({
        error: "Invalid state",
        message: `Unsupported state '${state}'. Supported states: ${validStates.join(', ')}`,
        supportedStates: validStates
      });
    }
    
    const factors = {
      state,
      electricity: getElectricityEmissionsFactor(state),
      gas: EMISSIONS_FACTORS.gas,
      transport: EMISSIONS_FACTORS.transport,
      units: {
        electricity: "kg CO2-e per kWh",
        gas: "kg CO2-e per kWh equivalent",
        transport: "kg CO2-e per km"
      }
    };
    
    res.json(factors);
    
  } catch (error) {
    console.error('Error getting emissions factors:', error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while retrieving emissions factors. Please try again.",
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/emissions/supported-units
app.get("/api/emissions/supported-units", (_req: Request, res: Response) => {
  try {
    const supportedUnits = {
      energy: {
        timeUnits: ['month', 'quarter', 'year'],
        units: {
          electricity: 'kWh',
          gas: 'MJ or kWh equivalent'
        }
      },
      transport: {
        timeUnits: ['day', 'week', 'month', 'year'],
        modes: ['car', 'bus', 'train', 'tram', 'bicycle', 'walking'],
        units: {
          distance: 'km',
          frequency: 'trips per time unit'
        }
      }
    };
    
    res.json(supportedUnits);
    
  } catch (error) {
    console.error('Error getting supported units:', error);
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while retrieving supported units. Please try again.",
      timestamp: new Date().toISOString()
    });
  }
});

// Minimal OpenAPI 3.0 schema
const openapiDoc = {
  openapi: "3.0.3",
  info: { title: "EcoPath API", version: "0.1.0" },
  servers: [{ url: "http://localhost:" + port }],
  paths: {
    "/api/energy-mix": {
      get: {
        summary: "Energy mix by state",
        description:
          "Returns the % share and generation amount by energy source for a given Australian state.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State code (e.g., VIC, NSW, QLD, SA, TAS, WA).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["source", "percentage", "generation"],
                    properties: {
                      source: {
                        type: "string",
                        enum: ["coal", "gas", "hydro", "wind", "solar"],
                      },
                      percentage: { type: "number", format: "float", minimum: 0, maximum: 100 },
                      generation: {
                        type: "number",
                        format: "float",
                        minimum: 0,
                        description: "MW or MWh (mock units)",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "Unknown state" },
        },
      },
    },
    "/api/emissions": {
      get: {
        summary: "Greenhouse gas emissions by state",
        description:
          "Returns yearly greenhouse gas emissions data for a given Australian state with optional time range filtering.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State code (e.g., VIC, NSW, QLD, SA, TAS, WA).",
          },
          {
            name: "range",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["5y", "10y", "all"], default: "all" },
            description: "Time range filter: 5y (last 5 years), 10y (last 10 years), all (all available data).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["unit", "latest", "data"],
                  properties: {
                    unit: {
                      type: "string",
                      example: "Mt CO2-e",
                      description: "Unit of measurement for emissions values",
                    },
                    latest: {
                      type: "object",
                      nullable: true,
                      properties: {
                        year: { type: "number", example: 2023 },
                        value: { type: "number", format: "float", example: 42.7 },
                      },
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["year", "value"],
                        properties: {
                          year: { type: "number", example: 2023 },
                          value: { type: "number", format: "float", example: 42.7 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing required parameter or invalid range" },
          "404": { description: "Unknown state" },
        },
      },
    },
    "/api/climate-targets": {
      get: {
        summary: "Climate targets by state",
        description:
          "Returns climate target information for a given Australian state, including plan name, progress, target year, and description.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "State code (e.g., VIC, NSW, QLD, SA, TAS, WA, ACT, NT).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["state", "planName", "progress", "targetYear", "description"],
                  properties: {
                    state: { type: "string", example: "VIC" },
                    planName: { type: "string", example: "Victorian Climate Change Plan 2020" },
                    progress: { type: "number", format: "float", example: 85 },
                    targetYear: { type: "number", example: 2030 },
                    description: { type: "string", example: "Victorian government's commitment to reduce greenhouse gas emissions by 40% below 2005 levels by 2030." },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "Unsupported or unknown state" },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Incomplete data for state" },
                    message: { type: "string", example: "Climate target data for VIC is incomplete. Please contact support." },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/emissions/calculate": {
      post: {
        summary: "Calculate total emissions based on energy and transport data",
        description: "Calculates the total greenhouse gas emissions (CO2-e) based on energy usage and transport activities for a given state.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["state"],
                properties: {
                  energy: {
                    type: "object",
                    properties: {
                      electricity: { type: "number", description: "Electricity usage in kWh", example: 100 },
                      gas: { type: "number", description: "Gas usage in MJ or kWh equivalent", example: 50 },
                      timeUnit: { type: "string", enum: ["month", "quarter", "year"], description: "Time unit for energy usage", example: "month" },
                    },
                  },
                  transport: {
                    type: "object",
                    properties: {
                      mode: { type: "string", enum: ["car", "bus", "train", "tram", "bicycle", "walking"], description: "Transport mode", example: "car" },
                      distance: { type: "number", description: "Distance traveled in km", example: 10 },
                      timeUnit: { type: "string", enum: ["day", "week", "month", "year"], description: "Time unit for transport", example: "month" },
                      frequency: { type: "number", description: "Number of trips per time unit", example: 1 },
                    },
                  },
                  state: { type: "string", description: "Australian state code (e.g., VIC, NSW, QLD, SA, TAS, WA, ACT, NT)", example: "VIC" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["totalEmissions", "breakdown", "timeUnit", "calculationDate"],
                  properties: {
                    totalEmissions: { type: "number", description: "Total emissions in kg CO2-e", example: 1000 },
                    breakdown: {
                      type: "object",
                      properties: {
                        energy: {
                          type: "object",
                          properties: {
                            electricity: { type: "number", description: "Electricity emissions in kg CO2-e", example: 500 },
                            gas: { type: "number", description: "Gas emissions in kg CO2-e", example: 500 },
                            total: { type: "number", description: "Total energy emissions in kg CO2-e", example: 1000 },
                          },
                        },
                        transport: {
                          type: "object",
                          properties: {
                            car: { type: "number", description: "Car emissions in kg CO2-e", example: 200 },
                            bus: { type: "number", description: "Bus emissions in kg CO2-e", example: 100 },
                            train: { type: "number", description: "Train emissions in kg CO2-e", example: 50 },
                            tram: { type: "number", description: "Tram emissions in kg CO2-e", example: 30 },
                            bicycle: { type: "number", description: "Bicycle emissions in kg CO2-e", example: 0 },
                            walking: { type: "number", description: "Walking emissions in kg CO2-e", example: 0 },
                            total: { type: "number", description: "Total transport emissions in kg CO2-e", example: 1000 },
                          },
                        },
                      },
                    },
                    timeUnit: { type: "string", description: "Time unit for which emissions are calculated", example: "month" },
                    calculationDate: { type: "string", description: "Date of the calculation", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message"],
                  properties: {
                    error: { type: "string", example: "Missing required field 'state'" },
                    message: { type: "string", example: "Please provide your state for accurate emissions calculations" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Unsupported state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "supportedStates"],
                  properties: {
                    error: { type: "string", example: "Invalid state" },
                    message: { type: "string", example: "Unsupported state 'VIC'. Supported states: VIC, NSW, QLD, SA, TAS, WA, ACT, NT" },
                    supportedStates: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Internal server error" },
                    message: { type: "string", example: "An error occurred while calculating emissions. Please try again." },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/emissions/factors": {
      get: {
        summary: "Get emissions factors for a specific state",
        description: "Returns the emissions factors (kg CO2-e per unit) for a given Australian state.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: true,
            schema: { type: "string", example: "VIC" },
            description: "Australian state code (e.g., VIC, NSW, QLD, SA, TAS, WA, ACT, NT).",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["state", "electricity", "gas", "transport", "units"],
                  properties: {
                    state: { type: "string", example: "VIC" },
                    electricity: { type: "number", description: "Emissions factor for electricity (kg CO2-e per kWh)", example: 0.85 },
                    gas: { type: "number", description: "Emissions factor for gas (kg CO2-e per kWh equivalent)", example: 0.18 },
                    transport: {
                      type: "object",
                      properties: {
                        car: { type: "number", description: "Emissions factor for car (kg CO2-e per km)", example: 0.21 },
                        bus: { type: "number", description: "Emissions factor for bus (kg CO2-e per km)", example: 0.08 },
                        train: { type: "number", description: "Emissions factor for train (kg CO2-e per km)", example: 0.04 },
                        tram: { type: "number", description: "Emissions factor for tram (kg CO2-e per km)", example: 0.03 },
                        bicycle: { type: "number", description: "Emissions factor for bicycle (kg CO2-e per km)", example: 0 },
                        walking: { type: "number", description: "Emissions factor for walking (kg CO2-e per km)", example: 0 },
                      },
                    },
                    units: {
                      type: "object",
                      properties: {
                        electricity: { type: "string", example: "kg CO2-e per kWh" },
                        gas: { type: "string", example: "kg CO2-e per kWh equivalent" },
                        transport: { type: "string", example: "kg CO2-e per km" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message"],
                  properties: {
                    error: { type: "string", example: "Missing state parameter" },
                    message: { type: "string", example: "Please provide a state parameter to get emissions factors" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Unsupported state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "supportedStates"],
                  properties: {
                    error: { type: "string", example: "Invalid state" },
                    message: { type: "string", example: "Unsupported state 'VIC'. Supported states: VIC, NSW, QLD, SA, TAS, WA, ACT, NT" },
                    supportedStates: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Internal server error" },
                    message: { type: "string", example: "An error occurred while retrieving emissions factors. Please try again." },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/emissions/supported-units": {
      get: {
        summary: "Get supported time units and units for energy and transport",
        description: "Returns the supported time units and units for energy (kWh, MJ or kWh equivalent) and transport (km, trips per time unit).",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["energy", "transport"],
                  properties: {
                    energy: {
                      type: "object",
                      properties: {
                        timeUnits: { type: "array", items: { type: "string", example: "month" } },
                        units: {
                          type: "object",
                          properties: {
                            electricity: { type: "string", example: "kWh" },
                            gas: { type: "string", example: "MJ or kWh equivalent" },
                          },
                        },
                      },
                    },
                    transport: {
                      type: "object",
                      properties: {
                        timeUnits: { type: "array", items: { type: "string", example: "month" } },
                        modes: { type: "array", items: { type: "string", example: "car" } },
                        units: {
                          type: "object",
                          properties: {
                            distance: { type: "string", example: "km" },
                            frequency: { type: "string", example: "trips per time unit" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error", "message", "timestamp"],
                  properties: {
                    error: { type: "string", example: "Internal server error" },
                    message: { type: "string", example: "An error occurred while retrieving supported units. Please try again." },
                    timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

app.get("/openapi.json", (_req: Request, res: Response) => res.json(openapiDoc));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(openapiDoc));

app.listen(port, (err?: Error) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`API server listening on http://localhost:${port}`);
  console.log(`OpenAPI docs available at: http://localhost:${port}/docs`);
  console.log(`OpenAPI spec available at: http://localhost:${port}/openapi.json`);
});
