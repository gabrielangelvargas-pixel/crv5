import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "crv5",
  user: process.env.DB_USER || "crv5",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" ? {} : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  enableKeepAlive: true,
});

export { pool as database };
