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
    "/api/community/footprint": {
      get: {
        summary: "Community footprint data",
        description:
          "Returns aggregated CO2 savings, active member count, and category breakdown for the entire community.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["totalCO2SavedKg", "activeMembers", "categories"],
                  properties: {
                    totalCO2SavedKg: {
                      type: "number",
                      example: 125000,
                      description: "Total CO2 saved by community in kg",
                    },
                    activeMembers: {
                      type: "number",
                      example: 4700,
                      description: "Number of users with at least one completed pledge",
                    },
                    categories: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["name", "kg", "percentage"],
                        properties: {
                          name: { type: "string", example: "Transport" },
                          kg: { type: "number", example: 43000 },
                          percentage: { type: "number", example: 34 },
                        },
                      },
                      example: [
                        { name: "Transport", kg: 43000, percentage: 34 },
                        { name: "Energy", kg: 35000, percentage: 28 },
                        { name: "Diet", kg: 28000, percentage: 22 },
                        { name: "Water", kg: 19000, percentage: 16 },
                      ],
                      description: "Category breakdown with percentages (sums to 100%)",
                    },
                    lastUpdated: {
                      type: "string",
                      format: "date-time",
                      description: "When the data was last calculated",
                    },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/community/refresh": {
      post: {
        summary: "Refresh community data (admin)",
        description: "Force refresh of community footprint data, bypassing cache.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      description: "Refreshed community footprint data",
                    },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/users/me/impact-summary": {
      get: {
        summary: "User's climate impact summary",
        description:
          "Returns authenticated user's comprehensive climate impact data including pledges, CO2 savings, reduction percentage, equivalent metrics, and community context.",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["activePledges", "co2SavedKg", "reductionPercent", "equivalents"],
                  properties: {
                    activePledges: {
                      type: "number",
                      example: 5,
                      description: "Number of completed pledges by the user",
                    },
                    co2SavedKg: {
                      type: "number",
                      example: 2300,
                      description: "Total CO2 saved by user's pledges in kg",
                    },
                    reductionPercent: {
                      type: "number",
                      example: 15,
                      description: "Percentage reduction compared to baseline emissions (0-100%)",
                    },
                    equivalents: {
                      type: "object",
                      properties: {
                        treesPlanted: {
                          type: "number",
                          example: 106,
                          description: "Equivalent number of trees planted",
                        },
                        milesNotDriven: {
                          type: "number",
                          example: 1000,
                          description: "Equivalent miles not driven",
                        },
                        ledBulbs: {
                          type: "number",
                          example: 850,
                          description: "Equivalent LED bulbs replacing incandescent",
                        },
                      },
                    },
                    communityCO2SavedKg: {
                      type: "number",
                      example: 125000,
                      description: "Total CO2 saved by entire community",
                    },
                    completedPledges: {
                      type: "array",
                      items: { type: "string" },
                      example: [
                        "Bike to Work Twice Weekly",
                        "Switch to LED Bulbs",
                        "Meatless Monday",
                      ],
                      description: "List of completed pledge titles",
                    },
                    lastUpdated: {
                      type: "string",
                      format: "date-time",
                      description: "When the summary was last calculated",
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
    "/api/share-link": {
      get: {
        summary: "Generate shareable link with optional QR code",
        description:
          "Creates a shareable link with optional user tracking (anonymized) and QR code generation. No PII is exposed in referral codes.",
        parameters: [
          {
            name: "userId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Optional user ID for referral tracking (will be hashed)",
          },
          {
            name: "campaign",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Optional campaign identifier",
          },
          {
            name: "qr",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "Whether to include QR code data URL",
          },
          {
            name: "landingPage",
            in: "query",
            required: false,
            schema: { type: "string", default: "/" },
            description: "Landing page path (e.g., /quiz, /start)",
          },
        ],
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
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          example: "https://ecopath.me/?ref=abc123&source=qr_share",
                        },
                        qrCodeDataUrl: { type: "string", example: "data:image/png;base64,..." },
                        referralCode: { type: "string", example: "abc123def" },
                      },
                    },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/share-link/qr": {
      get: {
        summary: "Generate public QR code (no tracking)",
        description: "Creates a QR code for the specified landing page without any user tracking.",
        parameters: [
          {
            name: "landingPage",
            in: "query",
            required: false,
            schema: { type: "string", default: "/" },
            description: "Landing page path",
          },
        ],
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
                      type: "object",
                      properties: {
                        qrCodeDataUrl: { type: "string" },
                        url: { type: "string" },
                      },
                    },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/share-link/track": {
      post: {
        summary: "Track referral click",
        description: "Records a click on a referral link for analytics.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["referralCode"],
                properties: {
                  referralCode: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Click tracked successfully" },
          "400": { description: "Missing referralCode" },
          "500": { description: "Internal server error" },
        },
      },
    },
    "/api/share-link/analytics/{referralCode}": {
      get: {
        summary: "Get referral analytics",
        description: "Returns click count and creation time for a referral code.",
        parameters: [
          {
            name: "referralCode",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
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
                      type: "object",
                      properties: {
                        clicks: { type: "number" },
                        createdAt: { type: "string" },
                      },
                    },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
          "404": { description: "Referral code not found" },
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
