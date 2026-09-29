import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
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
