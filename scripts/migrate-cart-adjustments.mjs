import mysql from "mysql2/promise";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  const [columns] = await db.query("SHOW COLUMNS FROM carritos LIKE 'ajustes'");
  if (!columns.length) await db.query("ALTER TABLE carritos ADD COLUMN ajustes JSON NULL");
  console.log("Migración de ajustes del carrito aplicada.");
} finally { await db.end(); }
