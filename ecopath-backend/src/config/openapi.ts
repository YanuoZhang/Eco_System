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
