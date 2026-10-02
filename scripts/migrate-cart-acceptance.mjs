import mysql from "mysql2/promise";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
 for (const [table, column, definition] of [["carritos", "pedido_id", "CHAR(36) NULL"], ["pedidos", "ajustes", "JSON NULL"], ["notificaciones_carritos", "tipo", "ENUM('revision','actualizacion','pedido') NOT NULL DEFAULT 'revision'"], ["notificaciones_carritos", "pedido_id", "CHAR(36) NULL"]]) {
  const [columns] = await db.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  if (!columns.length) await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
 }
 console.log("Migración de aceptación y notificaciones de clientes aplicada.");
} finally { await db.end(); }
