import { createPool, type Pool } from "mysql2/promise";
import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string(),
});

declare global {
  var crv4DatabasePool: Pool | undefined;
}

export function getDatabasePool() {
  if (globalThis.crv4DatabasePool) {
    return globalThis.crv4DatabasePool;
  }

  const databaseEnv = databaseEnvSchema.parse({
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  });

  const pool = createPool({
    host: databaseEnv.DATABASE_HOST,
    port: databaseEnv.DATABASE_PORT,
    database: databaseEnv.DATABASE_NAME,
    user: databaseEnv.DATABASE_USER,
    password: databaseEnv.DATABASE_PASSWORD,
    connectionLimit: 10,
    maxIdle: 2,
    idleTimeout: 60000,
    waitForConnections: true,
    queueLimit: 0,
  });

  // Reuse one pool per process in production too; abandoned pools retain connections.
  globalThis.crv4DatabasePool = pool;

  return pool;
}
