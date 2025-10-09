// OpenAPI documentation configuration

export const createOpenApiDoc = (port: number) => ({
  openapi: "3.0.3",
  info: { title: "EcoPath API", version: "0.1.0" },
  servers: [{ url: "http://localhost:" + port }],
  paths: {
    "/api/energy-mix": {
      get: {
        summary: "Energy mix by state",
        description:
          "Returns the % share and generation amount by energy source for a given Australian state from real database data.",
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
                        enum: [
                          "coal",
                          "gas",
                          "hydro",
                          "wind",
                          "solar",
                          "bioenergy",
                          "distillate",
                          "battery",
                        ],
                      },
                      percentage: { type: "number", format: "float", minimum: 0, maximum: 100 },
                      generation: {
                        type: "number",
                        format: "float",
                        minimum: 0,
                        description: "GWh (Gigawatt hours)",
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Missing 'state' query param" },
          "404": { description: "Unknown state or no data found" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/emissions": {
      get: {
        summary: "Greenhouse gas emissions by state",
        description:
          "Returns yearly greenhouse gas emissions data for a given Australian state with optional time range filtering from real database data.",
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
            description:
              "Time range filter: 5y (last 5 years), 10y (last 10 years), all (all available data).",
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
          "404": { description: "Unknown state or no data found" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/emissions/comparison": {
      get: {
        summary: "User emissions comparison (baseline vs with pledges)",
        description:
          "Returns baseline, withPledges, and saved emissions in kg CO2-e per year for the authenticated user.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: false,
            schema: { type: "string", example: "VIC" },
            description: "Optional state code to select emissions factors; defaults to VIC",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["baseline", "withPledges", "saved"],
                  properties: {
                    baseline: { type: "number", format: "float", example: 3200 },
                    withPledges: { type: "number", format: "float", example: 2800 },
                    saved: { type: "number", format: "float", example: 400 },
                    unit: { type: "string", example: "kg CO2-e per year" },
                    timestamp: { type: "string" },
                    metadata: {
                      type: "object",
                      properties: {
                        state: { type: "string", example: "VIC" },
                        pledgesCount: { type: "number", example: 3 },
                        pledgedKgPerYearReduction: { type: "number", example: 550 },
                      },
                    },
                    cached: { type: "boolean" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limited (1 request per 10 seconds)" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/emissions/forecast-multiyear": {
      get: {
        summary: "Multi-year emissions forecast (baseline vs with pledges)",
        description:
          "Returns projected emissions for the next 5-10 years, showing both baseline growth and pledge impact over time with decay factors.",
        parameters: [
          {
            name: "state",
            in: "query",
            required: false,
            schema: { type: "string", example: "VIC" },
            description: "Optional state code to select emissions factors; defaults to VIC",
          },
          {
            name: "years",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 10, default: 5 },
            description: "Number of years to forecast (1-10); defaults to 5",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["years", "baseline", "withPledges"],
                  properties: {
                    years: {
                      type: "array",
                      items: { type: "number" },
                      example: [2025, 2026, 2027, 2028, 2029],
                      description: "Array of forecast years",
                    },
                    baseline: {
                      type: "array",
                      items: { type: "number", format: "float" },
                      example: [3200, 3250, 3300, 3350, 3400],
                      description: "Projected baseline emissions per year (with growth)",
                    },
                    withPledges: {
                      type: "array",
                      items: { type: "number", format: "float" },
                      example: [2800, 2850, 2900, 2950, 3000],
                      description: "Projected emissions with pledges applied (with decay factors)",
                    },
                    unit: { type: "string", example: "kg CO2-e per year" },
                    timestamp: { type: "string" },
                    metadata: {
                      type: "object",
                      properties: {
                        state: { type: "string", example: "VIC" },
                        pledgesCount: { type: "number", example: 3 },
                        forecastYears: { type: "number", example: 5 },
                        totalBaselineReduction: { type: "number", example: 200 },
                        totalPledgeReduction: { type: "number", example: 1500 },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid years parameter (must be 1-10)" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limited (1 request per 30 seconds)" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/emissions/by-pledge": {
      get: {
        summary: "Per-pledge annual CO2 savings for authenticated user",
        description:
          "Returns an array of objects with pledge name and estimated kg CO2 saved per year, aggregated across duplicates.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["name", "saving"],
                    properties: {
                      name: { type: "string", example: "Use LED bulbs" },
                      saving: { type: "number", example: 120 },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/timeline": {
      get: {
        summary: "Climate timeline data",
        description: "Returns historical climate events organized by time periods.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          period: { type: "string" },
                          years: { type: "string" },
                          events: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                year: { type: "number" },
                                title: { type: "string" },
                                description: { type: "string" },
                                icon: { type: "string" },
                                category: {
                                  type: "string",
                                  enum: [
                                    "scientific",
                                    "political",
                                    "environmental",
                                    "technological",
                                    "social",
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    totalPeriods: { type: "number" },
                    totalEvents: { type: "number" },
                    lastUpdated: { type: "string" },
                    source: { type: "string" },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/news/climate": {
      get: {
        summary: "Climate news",
        description: "Returns latest climate news with AI-generated summaries.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          headline: { type: "string" },
                          summary: { type: "string" },
                          label: {
                            type: "string",
                            enum: [
                              "Critical",
                              "Update",
                              "Positive",
                              "Neutral",
                              "High Risk",
                              "Warning",
                            ],
                          },
                          source: { type: "string" },
                          timestamp: { type: "string" },
                          link: { type: "string" },
                        },
                      },
                    },
                    cached: { type: "boolean" },
                    lastUpdated: { type: "string" },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
  },
});
