import mysql from "mysql2/promise";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  const [columns] = await db.query("SHOW COLUMNS FROM pedidos");
  const legacy = columns.some(column => column.Field === "total_estimado" || column.Field === "total_confirmado" || (column.Field === "entrega" && !column.Type.startsWith("bigint")));
  const [counts] = await db.query("SELECT COUNT(*) AS cantidad FROM pedidos");
  if (legacy && Number(counts[0].cantidad) !== 0) throw new Error("Esta migración requiere pedidos vacíos. No se modificó el historial.");
  const [cost] = await db.query("SHOW COLUMNS FROM productos LIKE 'precio_costo'");
  if (!cost.length) await db.query("ALTER TABLE productos ADD COLUMN precio_costo DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER descripcion");
  for (const [oldName, newName, definition] of [["total_estimado", "subtotal_venta", "DECIMAL(14,2) NOT NULL"], ["total_confirmado", "total_venta", "DECIMAL(14,2) NULL"]]) {
    if (columns.some(column => column.Field === oldName)) await db.query(`ALTER TABLE pedidos CHANGE COLUMN ${oldName} ${newName} ${definition}`);
  }
  if (columns.some(column => column.Field === "entrega" && !column.Type.startsWith("bigint"))) {
    // Empty table was checked before changing the JSON column to an address FK.
    await db.query("ALTER TABLE pedidos DROP COLUMN entrega, ADD COLUMN entrega BIGINT UNSIGNED NULL");
  }
  for (const [name, definition] of [["subtotal_costo", "DECIMAL(14,2) NOT NULL DEFAULT 0"], ["total_costo", "DECIMAL(14,2) NOT NULL DEFAULT 0"], ["modalidad_entrega", "ENUM('retiro','envio') NOT NULL DEFAULT 'retiro'"], ["telefono_entrega", "VARCHAR(30) NOT NULL DEFAULT ''"], ["observaciones_entrega", "TEXT NULL"]]) {
    const [found] = await db.query("SHOW COLUMNS FROM pedidos LIKE ?", [name]);
    if (!found.length) await db.query(`ALTER TABLE pedidos ADD COLUMN ${name} ${definition}`);
  }
  const [foreignKeys] = await db.query("SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND CONSTRAINT_NAME = 'fk_pedidos_entrega'");
  if (!foreignKeys.length) await db.query("ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_entrega FOREIGN KEY (entrega) REFERENCES usuarios_direcciones(id) ON DELETE RESTRICT ON UPDATE CASCADE");
  console.log("Pedidos adaptados: detalle JSON de costos/venta, entrega FK y subtotales/totales separados. Costos iniciales del catálogo: 0.");
} finally { await db.end(); }
