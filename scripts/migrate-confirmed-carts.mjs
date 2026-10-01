import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  await db.query(await readFile(new URL("../database/carritos-confirmados.sql", import.meta.url), "utf8"));
  const [columns] = await db.query("SHOW COLUMNS FROM carritos");
  for (const [name, definition] of [["entrega", "JSON NULL"], ["productos_confirmados", "JSON NULL"], ["total_estimado", "DECIMAL(14,2) NULL"], ["confirmado_en", "DATETIME NULL"]]) {
    if (!columns.some(column => column.Field === name)) await db.query(`ALTER TABLE carritos ADD COLUMN ${name} ${definition}`);
  }
  console.log("Migración de carritos confirmados aplicada.");
} finally { await db.end(); }
