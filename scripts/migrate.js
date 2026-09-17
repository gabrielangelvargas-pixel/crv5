import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { database } from '../src/config/database.js';

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'database', 'migrations');

try {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [appliedRows] = await database.query('SELECT filename FROM schema_migrations ORDER BY filename');
  const applied = new Set(appliedRows.map(({ filename }) => filename));
  const filenames = (await fs.readdir(migrationsDirectory)).filter((filename) => filename.endsWith('.sql')).sort();

  for (const filename of filenames) {
    if (applied.has(filename)) continue;

    const sql = await fs.readFile(path.join(migrationsDirectory, filename), 'utf8');
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const statements = sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await connection.query(statement);
      }
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
      await connection.commit();
      console.log(`Migracion aplicada: ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  console.log('Migraciones al dia.');
} finally {
  await database.end();
}
