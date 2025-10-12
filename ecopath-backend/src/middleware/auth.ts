// Simple auth middleware extracting user identity from headers
// Accepted formats:
// - Authorization: Bearer <userId>
// - x-user-id: <userId>

import { Request, Response, NextFunction } from "express";

export function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers["authorization"] || "";
    const headerUserId = req.headers["x-user-id"]; // e.g., from frontend session

    let userId: string | undefined;

    if (typeof headerUserId === "string" && headerUserId.trim()) {
      userId = headerUserId.trim();
    } else if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
      userId = auth.slice(7).trim();
    }

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message:
          "Missing user identity. Provide Authorization: Bearer <userId> or x-user-id header.",
        timestamp: new Date().toISOString(),
      });
    }

    // Attach to request for downstream usage
    (req as any).userId = userId;
    next();
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid authorization header",
      timestamp: new Date().toISOString(),
    });
  }
}
