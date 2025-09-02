import dotenv from "dotenv";

dotenv.config();

export const config = {
  database: {
    user: process.env.DB_USER || "ecopath_user",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "ecopath",
    password: process.env.DB_PASSWORD || "",
    port: parseInt(process.env.DB_PORT || "5432"),
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "2000"),
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  },
  server: {
    port: parseInt(process.env.PORT || "5001"),
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost",
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
      credentials: true,
    },
  },
  environment: process.env.NODE_ENV || "development",
};

export default config;
