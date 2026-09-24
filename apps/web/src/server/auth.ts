import crypto from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { database } from "@/server/db";

export const SESSION_COOKIE = process.env.NODE_ENV === "production"
  ? "__Host-crv5_session"
  : "crv5_v2_session";
const SESSION_MAX_AGE = 10 * 365 * 24 * 60 * 60;
const PERSISTENT_SESSION_EXPIRATION = "9999-12-31 23:59:59";

export type SessionUser = {
  id: number;
  nombre: string;
  usuario: string;
  roles: string[];
};

type UserRow = RowDataPacket & {
  id: number;
  nombre: string;
  usuario: string;
  codigos_roles: string | null;
};

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const [rows] = await database.query<UserRow[]>(`
    SELECT u.id, u.nombre, u.usuario,
           GROUP_CONCAT(DISTINCT r.codigo ORDER BY r.codigo SEPARATOR ',') AS codigos_roles
    FROM sesiones s
    JOIN usuarios u ON u.id = s.id_usuario AND u.activo = TRUE
    LEFT JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = TRUE
    LEFT JOIN roles r ON r.id = ur.id_rol AND r.activo = TRUE
    WHERE s.token_hash = ?
      AND s.revocada_en IS NULL
      AND (s.expira_en IS NULL OR s.expira_en > NOW())
    GROUP BY u.id, u.nombre, u.usuario
    LIMIT 1
  `, [hashSessionToken(token)]);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, nombre: row.nombre, usuario: row.usuario, roles: row.codigos_roles?.split(",") ?? [] } satisfies SessionUser;
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  await database.query(
    "INSERT INTO sesiones (id, id_usuario, token_hash, expira_en) VALUES (?, ?, ?, ?)",
    [crypto.randomUUID(), userId, hashSessionToken(token), PERSISTENT_SESSION_EXPIRATION],
  );
  return token;
}
