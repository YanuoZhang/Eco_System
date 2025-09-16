# EcoPath Backend - Modular Architecture

## Directory Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Database configuration
│   └── openapi.ts    # OpenAPI documentation config
├── middleware/       # Middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── validation.ts    # Validation middleware
├── routes/          # Route modules
│   ├── index.ts     # Route entry point
│   ├── energyMix.ts # Energy mix routes
│   ├── emissions.ts # Emissions calculation routes
│   ├── news.ts      # News routes
│   ├── timeline.ts  # Timeline routes
│   ├── states.ts    # States/regions routes
│   └── climateTargets.ts # Climate targets routes
├── services/        # Business logic services
│   ├── emissionsService.ts # Emissions calculation service
│   ├── newsService.ts      # News service
│   └── timelineService.ts  # Timeline service
├── types/           # TypeScript type definitions
│   └── index.ts     # Common types
├── utils/           # Utility functions
│   └── emissions.ts # Emissions calculation utilities
├── __tests__/       # Test files
├── gemini.ts        # Gemini AI integration
└── index.ts         # Application entry point
```

## Module Description

### Route Modules (routes/)

- **energyMix.ts**: Handles energy mix data queries
- **emissions.ts**: Handles emissions calculation and queries
- **news.ts**: Handles climate news related APIs
- **timeline.ts**: Handles climate timeline data
- **states.ts**: Handles states/regions data queries
- **climateTargets.ts**: Handles climate targets data

### Service Layer (services/)

- **emissionsService.ts**: Emissions calculation business logic, includes database queries and calculation functions
- **newsService.ts**: News fetching, caching and label classification logic
- **timelineService.ts**: Timeline data management and queries

### Utility Functions (utils/)

- **emissions.ts**: Emissions calculation related utility functions and constants

### Type Definitions (types/)

- **index.ts**: Unified TypeScript type definitions

### Middleware (middleware/)

- **errorHandler.ts**: Global error handling
- **validation.ts**: Request validation middleware

## Advantages

1. **Separation of Concerns**: Routes, business logic, and data access are separated
2. **Maintainability**: Each module has a single responsibility, easy to maintain
3. **Testability**: Service layer can be tested independently
4. **Scalability**: New features can be easily added as new modules
5. **Code Reusability**: Service layer can be reused across different routes

## Usage Examples

### Adding New Routes

1. Create new route file in `routes/` directory
2. Import and register route in `routes/index.ts`
3. If business logic is needed, create corresponding service in `services/`

### Adding New Services

1. Create service file in `services/` directory
2. Import and use service in routes
3. Keep service layer decoupled from route layer

### Adding New Types

1. Define types in `types/index.ts`
2. Import and use where needed

## Development Guidelines

- Keep route layer simple, only handle HTTP requests/responses
- Put business logic in service layer
- Use TypeScript types to ensure type safety
- Write unit tests to cover service layer logic
- Use middleware to handle cross-cutting concerns (error handling, validation, etc.)
