import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  await connection.query(await readFile(new URL("../database/carritos.sql", import.meta.url), "utf8"));
  console.log("Migración de carritos aplicada.");
} finally { await connection.end(); }
