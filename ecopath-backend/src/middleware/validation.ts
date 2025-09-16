// Validation middleware

import { Request, Response, NextFunction } from "express";
import { EmissionsCalculationRequest } from "../types";

export const validateEmissionsCalculation = (req: Request, res: Response, next: NextFunction) => {
  const requestData: EmissionsCalculationRequest = req.body;

  // Validate required fields
  if (!requestData.state) {
    return res.status(400).json({
      error: "Missing required field 'state'",
      message: "Please provide your state for accurate emissions calculations",
    });
  }

  if (!requestData.energy && !requestData.transport) {
    return res.status(400).json({
      error: "Missing data",
      message: "Please provide either energy or transport data (or both) for calculation",
    });
  }

  // Validate state format
  if (typeof requestData.state !== "string" || requestData.state.length !== 3) {
    return res.status(400).json({
      error: "Invalid state format",
      message: "State must be a 3-character string (e.g., 'VIC', 'NSW')",
    });
  }

  // Validate energy data if provided
  if (requestData.energy) {
    if (requestData.energy.electricity !== undefined && requestData.energy.electricity < 0) {
      return res.status(400).json({
        error: "Invalid electricity value",
        message: "Electricity usage must be non-negative",
      });
    }
    if (requestData.energy.gas !== undefined && requestData.energy.gas < 0) {
      return res.status(400).json({
        error: "Invalid gas value",
        message: "Gas usage must be non-negative",
      });
    }
    const validTimeUnits = ["month", "quarter", "year"];
    if (!validTimeUnits.includes(requestData.energy.timeUnit)) {
      return res.status(400).json({
        error: "Invalid time unit",
        message: `Time unit must be one of: ${validTimeUnits.join(", ")}`,
      });
    }
  }

  // Validate transport data if provided
  if (requestData.transport) {
    const validModes = ["car", "bus", "train", "tram", "bicycle", "walking"];
    if (!validModes.includes(requestData.transport.mode)) {
      return res.status(400).json({
        error: "Invalid transport mode",
        message: `Transport mode must be one of: ${validModes.join(", ")}`,
      });
    }
    if (requestData.transport.distance < 0) {
      return res.status(400).json({
        error: "Invalid distance",
        message: "Distance must be non-negative",
      });
    }
    const validTimeUnits = ["day", "week", "month", "year"];
    if (!validTimeUnits.includes(requestData.transport.timeUnit)) {
      return res.status(400).json({
        error: "Invalid time unit",
        message: `Time unit must be one of: ${validTimeUnits.join(", ")}`,
      });
    }
    if (requestData.transport.frequency !== undefined && requestData.transport.frequency <= 0) {
      return res.status(400).json({
        error: "Invalid frequency",
        message: "Frequency must be positive",
      });
    }
  }

  next();
};

export const validateStateParam = (req: Request, res: Response, next: NextFunction) => {
  const state = req.query.state as string;

  if (!state) {
    return res.status(400).json({
      error: "Missing state parameter",
      message: "Please provide a state parameter",
    });
  }

  if (typeof state !== "string" || state.length !== 3) {
    return res.status(400).json({
      error: "Invalid state format",
      message: "State must be a 3-character string (e.g., 'VIC', 'NSW')",
    });
  }

  next();
};
