// Runs pending migrations in order and records each one in schema_migrations.
//   node --env-file=.env.local scripts/migrate.mjs             apply pending migrations
//   node --env-file=.env.local scripts/migrate.mjs --status    list applied/pending without changes
//   node --env-file=.env.local scripts/migrate.mjs --baseline  mark all as applied without running them
//                                                              (for a database that already has them)
// New migrations: add the script to MIGRATIONS (append only, never reorder).
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const MIGRATIONS = [
  "migrate-carts.mjs",
  "migrate-orders.mjs",
  "migrate-confirmed-carts.mjs",
  "migrate-stock-reservations.mjs",
  "migrate-cart-notifications.mjs",
  "migrate-cart-adjustments.mjs",
  "migrate-cart-acceptance.mjs",
  "migrate-order-numbers.mjs",
  "migrate-order-accounting.mjs",
];

const mode = process.argv[2] ?? "";
if (!["", "--status", "--baseline"].includes(mode)) throw new Error(`Opción desconocida: ${mode}`);

const db = await mysql.createConnection({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT ?? 3306), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
try {
  await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (nombre VARCHAR(120) NOT NULL PRIMARY KEY, aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
  const [rows] = await db.query("SELECT nombre FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.nombre));
  const pending = MIGRATIONS.filter((name) => !applied.has(name));

  if (mode === "--status") {
    for (const name of MIGRATIONS) console.log(`${applied.has(name) ? "aplicada " : "pendiente"}  ${name}`);
  } else if (mode === "--baseline") {
    for (const name of pending) await db.query("INSERT INTO schema_migrations (nombre) VALUES (?)", [name]);
    console.log(`${pending.length} migraciones marcadas como aplicadas sin ejecutarlas.`);
  } else {
    if (!pending.length) console.log("No hay migraciones pendientes.");
    for (const name of pending) {
      console.log(`Aplicando ${name}…`);
      // Each script opens its own connection and reads the same environment variables.
      const result = spawnSync(process.execPath, [fileURLToPath(new URL(name, import.meta.url))], { stdio: "inherit", env: process.env });
      if (result.status !== 0) throw new Error(`Falló ${name}; se detiene sin aplicar las siguientes.`);
      await db.query("INSERT INTO schema_migrations (nombre) VALUES (?)", [name]);
    }
  }
} finally {
  await db.end();
}
