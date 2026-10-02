import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  await db.query(await readFile(new URL("../database/notificaciones-carritos.sql", import.meta.url), "utf8"));
  console.log("Migración de notificaciones aplicada.");
} finally { await db.end(); }
