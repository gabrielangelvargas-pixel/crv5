import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "crv5_v2",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "crv5_v2",
  },
  strict: true,
  verbose: true,
});
