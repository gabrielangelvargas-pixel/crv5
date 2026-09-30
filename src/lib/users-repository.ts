import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { getDatabasePool } from "@/lib/db";

export type AdminUser = {
  id: string;
  name: string;
  username: string;
  active: boolean;
  lastAccess: string | null;
  createdAt: string;
  roles: string[];
};

export type AdminRole = {
  id: string;
  code: string;
  name: string;
};

type UserRow = RowDataPacket & {
  id: number | string | bigint;
  nombre: string;
  usuario: string;
  activo: number;
  ultimo_acceso: Date | string | null;
  creado: Date | string;
  roles: string | null;
};

type RoleRow = RowDataPacket & {
  id: number | string | bigint;
  codigo: string;
  nombre: string;
};

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [rows] = await getDatabasePool().query<UserRow[]>(
    `
      SELECT
        u.id,
        u.nombre,
        u.usuario,
        u.activo,
        u.ultimo_acceso,
        u.creado,
        GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') AS roles
      FROM usuarios u
      LEFT JOIN usuarios_roles ur
        ON ur.id_usuario = u.id AND ur.activo = 1
      LEFT JOIN roles r
        ON r.id = ur.id_rol AND r.activo = 1
      GROUP BY u.id, u.nombre, u.usuario, u.activo, u.ultimo_acceso, u.creado
      ORDER BY u.activo DESC, u.nombre ASC
    `,
  );

  return rows.map((row) => ({
    id: String(row.id),
    name: row.nombre,
    username: row.usuario,
    active: Boolean(row.activo),
    lastAccess: formatDate(row.ultimo_acceso),
    createdAt: formatDate(row.creado) ?? "",
    roles: row.roles ? row.roles.split(", ") : [],
  }));
}

export async function getAdminRoles(): Promise<AdminRole[]> {
  const [rows] = await getDatabasePool().query<RoleRow[]>(
    "SELECT id, codigo, nombre FROM roles WHERE activo = 1 ORDER BY nombre ASC",
  );

  return rows.map((row) => ({ id: String(row.id), code: row.codigo, name: row.nombre }));
}

export type UserInput = {
  name: string;
  username: string;
  password: string | undefined;
  roleId: string;
  active: boolean;
};

function validateInput(input: UserInput, passwordRequired: boolean) {
  const name = input.name.trim();
  const username = input.username.trim();
  const password = input.password?.trim() ?? "";

  if (name.length < 2 || name.length > 100) throw new Error("El nombre debe tener entre 2 y 100 caracteres");
  if (username.length < 3 || username.length > 80) throw new Error("El usuario debe tener entre 3 y 80 caracteres");
  if (passwordRequired && password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
  if (password && password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
  if (!input.roleId) throw new Error("Selecciona un rol");

  return { name, username, password };
}

async function ensureRole(connection: PoolConnection, roleId: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM roles WHERE id = ? AND activo = 1 LIMIT 1",
    [roleId],
  );
  if (!rows[0]) throw new Error("El rol seleccionado no existe");
}

async function assignRole(connection: PoolConnection, userId: string, roleId: string) {
  await connection.query("UPDATE usuarios_roles SET activo = 0 WHERE id_usuario = ?", [userId]);
  await connection.query(
    `
      INSERT INTO usuarios_roles (id_usuario, id_rol, activo)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE activo = 1, actualizado = CURRENT_TIMESTAMP
    `,
    [userId, roleId],
  );
}

export async function createAdminUser(input: UserInput) {
  const { name, username, password } = validateInput(input, true);
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureRole(connection, input.roleId);
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, ?)",
      [name, username, passwordHash, input.active ? 1 : 0],
    );
    await assignRole(connection, String(result.insertId), input.roleId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminUser(id: string, input: UserInput) {
  const { name, username, password } = validateInput(input, false);
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureRole(connection, input.roleId);
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await connection.query(
        "UPDATE usuarios SET nombre = ?, usuario = ?, clave_hash = ?, activo = ? WHERE id = ?",
        [name, username, passwordHash, input.active ? 1 : 0, id],
      );
    } else {
      await connection.query(
        "UPDATE usuarios SET nombre = ?, usuario = ?, activo = ? WHERE id = ?",
        [name, username, input.active ? 1 : 0, id],
      );
    }
    await assignRole(connection, id, input.roleId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
