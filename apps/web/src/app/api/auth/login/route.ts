import { z } from "zod";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { database } from "@/server/db";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/server/auth";
import { verifyPassword } from "@/server/password";

const loginSchema = z.object({ usuario: z.string().trim().min(1), clave: z.string().min(1) });
type LoginRow = RowDataPacket & { id: number; nombre: string; usuario: string; clave_hash: string; activo: number; codigos_roles: string | null };

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ingresá usuario y clave." }, { status: 400 });
  const [rows] = await database.query<LoginRow[]>(`
    SELECT u.id, u.nombre, u.usuario, u.clave_hash, u.activo,
           GROUP_CONCAT(DISTINCT r.codigo ORDER BY r.codigo SEPARATOR ',') AS codigos_roles
    FROM usuarios u
    LEFT JOIN usuarios_roles ur ON ur.id_usuario = u.id AND ur.activo = TRUE
    LEFT JOIN roles r ON r.id = ur.id_rol AND r.activo = TRUE
    WHERE u.usuario = ?
    GROUP BY u.id, u.nombre, u.usuario, u.clave_hash, u.activo
    LIMIT 1
  `, [parsed.data.usuario.toLowerCase()]);
  const user = rows[0];
  if (!user || !user.activo || !(await verifyPassword(parsed.data.clave, user.clave_hash))) return NextResponse.json({ error: "Usuario o clave incorrectos." }, { status: 401 });
  const token = await createSession(user.id);
  await database.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [user.id]);
  const response = NextResponse.json({ usuario: { id: user.id, nombre: user.nombre, usuario: user.usuario, roles: user.codigos_roles?.split(",") ?? [] } });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
