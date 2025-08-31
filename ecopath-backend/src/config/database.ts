import { Pool, PoolConfig } from "pg";
import { config } from "./index";

const dbConfig: PoolConfig = {
  user: config.database.user,
  host: config.database.host,
  database: config.database.database,
  password: config.database.password,
  port: config.database.port,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  ...(config.database.ssl && { ssl: config.database.ssl }),
};

export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log(`Database connected successfully in ${config.environment} mode`);
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
};

export default pool;
