import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { AuthUser } from "@/data/auth";
import { getDatabasePool } from "@/lib/db";

export const SESSION_COOKIE = "crv4_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type UserCredentialRow = RowDataPacket & {
  id: number | string | bigint;
  clave_hash: string;
};

type UserAccessRow = RowDataPacket & {
  id: number | string | bigint;
  nombre: string;
  usuario: string;
  rol_codigo: string | null;
  permiso_codigo: string | null;
};

type SessionRow = RowDataPacket & {
  id_usuario: number | string | bigint;
};

export type RegistrationAddress = {
  label: "casa" | "trabajo" | "deposito" | "otro";
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  postalCode: string;
  reference: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildAuthUser(rows: UserAccessRow[]): AuthUser | null {
  const firstRow = rows[0];

  if (!firstRow) {
    return null;
  }

  return {
    id: String(firstRow.id),
    name: firstRow.nombre,
    username: firstRow.usuario,
    roles: [...new Set(rows.flatMap((row) => row.rol_codigo ? [row.rol_codigo] : []))],
    permissions: [...new Set(rows.flatMap((row) => row.permiso_codigo ? [row.permiso_codigo] : []))],
  };
}

async function loadUserAccess(id: string): Promise<AuthUser | null> {
  const [rows] = await getDatabasePool().query<UserAccessRow[]>(
    `
      SELECT
        u.id,
        u.nombre,
        u.usuario,
        r.codigo AS rol_codigo,
        p.codigo AS permiso_codigo
      FROM usuarios u
      LEFT JOIN usuarios_roles ur
        ON ur.id_usuario = u.id AND ur.activo = 1
      LEFT JOIN roles r
        ON r.id = ur.id_rol AND r.activo = 1
      LEFT JOIN roles_permisos rp
        ON rp.id_rol = r.id AND rp.activo = 1
      LEFT JOIN permisos p
        ON p.id = rp.id_permiso AND p.activo = 1
      WHERE u.id = ? AND u.activo = 1
    `,
    [id],
  );

  return buildAuthUser(rows);
}

export async function authenticateUser(username: string, password: string) {
  const [rows] = await getDatabasePool().query<UserCredentialRow[]>(
    `
      SELECT id, clave_hash
      FROM usuarios
      WHERE LOWER(usuario) = LOWER(?) AND activo = 1
      LIMIT 1
    `,
    [username.trim()],
  );
  const credentials = rows[0];

  if (!credentials || !(await bcrypt.compare(password, credentials.clave_hash))) {
    return null;
  }

  const userId = String(credentials.id);
  const user = await loadUserAccess(userId);

  if (!user) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  await getDatabasePool().query(
    `
      INSERT INTO sesiones (id, id_usuario, token_hash, expira_en)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
    `,
    [randomUUID(), userId, hashToken(token)],
  );
  await getDatabasePool().query(
    "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?",
    [userId],
  );

  return { token, user };
}

export async function registerCustomer(name: string, username: string, password: string, address: RegistrationAddress) {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [roleRows] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM roles WHERE codigo = 'cliente' AND activo = 1 LIMIT 1",
    );
    const role = roleRows[0] as { id?: number | string | bigint } | undefined;

    if (!role?.id) {
      throw new Error("No existe el rol cliente");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [userResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO usuarios (nombre, usuario, clave_hash, activo)
        VALUES (?, ?, ?, 1)
      `,
      [name.trim(), username.trim(), passwordHash],
    );
    const userId = String(userResult.insertId);

    await connection.query(
      `
        INSERT INTO usuarios_roles (id_usuario, id_rol, activo)
        VALUES (?, ?, 1)
      `,
      [userId, role.id],
    );

    await connection.query(
      `
        INSERT INTO usuarios_direcciones
          (id_usuario, etiqueta, telefono, direccion, barrio, localidad, provincia, codigo_postal, referencia, predeterminada, activa)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
      `,
      [
        userId,
        address.label,
        address.phone.trim(),
        address.address.trim(),
        address.neighborhood.trim() || null,
        address.city.trim(),
        address.province.trim(),
        address.postalCode.trim() || null,
        address.reference.trim() || null,
      ],
    );

    await connection.commit();

    const user = await loadUserAccess(userId);

    if (!user) {
      throw new Error("No se pudo cargar el usuario registrado");
    }

    const token = randomBytes(32).toString("hex");
    await pool.query(
      `
        INSERT INTO sesiones (id, id_usuario, token_hash, expira_en)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `,
      [randomUUID(), userId, hashToken(token)],
    );

    return { token, user };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [rows] = await getDatabasePool().query<SessionRow[]>(
    `
      SELECT id_usuario
      FROM sesiones
      WHERE token_hash = ?
        AND revocada_en IS NULL
        AND expira_en > NOW()
      LIMIT 1
    `,
    [hashToken(token)],
  );
  const session = rows[0];

  return session ? loadUserAccess(String(session.id_usuario)) : null;
}

export async function revokeSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await getDatabasePool().query(
    "UPDATE sesiones SET revocada_en = NOW() WHERE token_hash = ? AND revocada_en IS NULL",
    [hashToken(token)],
  );
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
