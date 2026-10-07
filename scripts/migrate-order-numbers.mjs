import mysql from "mysql2/promise";
const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD, supportBigNumbers: true, bigNumberStrings: true });
try {
  // Run with order writes stopped: MySQL DDL commits implicitly.
  const [columns] = await db.query("SHOW COLUMNS FROM pedidos LIKE 'numero'");
  if (!columns.length) await db.query("ALTER TABLE pedidos ADD COLUMN numero BIGINT UNSIGNED NULL, ADD UNIQUE KEY uq_pedido_numero (numero)");
  await db.query("CREATE TABLE IF NOT EXISTS pedido_numeracion (id TINYINT UNSIGNED NOT NULL PRIMARY KEY, ultimo_numero BIGINT UNSIGNED NOT NULL) ENGINE=InnoDB");
  await db.beginTransaction();
  const [existing] = await db.query("SELECT COALESCE(MAX(numero), 0) AS ultimo FROM pedidos");
  let number = BigInt(existing[0].ultimo);
  const [orders] = await db.query("SELECT id FROM pedidos WHERE numero IS NULL ORDER BY creado, id FOR UPDATE");
  for (const order of orders) await db.query("UPDATE pedidos SET numero = ? WHERE id = ?", [(++number).toString(), order.id]);
  await db.query("INSERT INTO pedido_numeracion (id, ultimo_numero) VALUES (1, ?) ON DUPLICATE KEY UPDATE ultimo_numero = GREATEST(ultimo_numero, VALUES(ultimo_numero))", [number.toString()]);
  await db.query("UPDATE pedidos SET estado = 'cancelado' WHERE JSON_LENGTH(productos) = 0 AND estado <> 'cancelado'");
  await db.commit();
  await db.query("ALTER TABLE pedidos MODIFY numero BIGINT UNSIGNED NOT NULL");
  // Enforce the invariant for direct database writes as well as application writes.
  for (const event of ["INSERT", "UPDATE"]) {
    const name = `pedidos_productos_${event.toLowerCase()}`;
    const [triggers] = await db.query("SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ?", [name]);
    if (!triggers.length) await db.query(`CREATE TRIGGER ${name} BEFORE ${event} ON pedidos FOR EACH ROW BEGIN IF JSON_TYPE(NEW.productos) <> 'ARRAY' OR (JSON_LENGTH(NEW.productos) = 0 AND NEW.estado <> 'cancelado') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Un pedido vacío debe estar cancelado'; END IF; END`);
  }
  console.log("Numeración correlativa aplicada; pedidos vacíos históricos marcados como cancelados.");
} catch (error) { await db.rollback(); throw error; }
finally { await db.end(); }
