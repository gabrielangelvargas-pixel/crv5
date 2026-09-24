import { z } from "zod";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@/server/auth";
import { database } from "@/server/db";
import { hashPassword } from "@/server/password";

const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  usuario: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,80}$/),
  clave: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Completá los datos con un usuario válido y una clave de al menos 8 caracteres." }, { status: 400 });

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const [roleRows] = await connection.query<Array<RowDataPacket & { id: number }>>(
      "SELECT id FROM roles WHERE codigo = 'cliente' AND activo = TRUE LIMIT 1",
    );
    const role = roleRows[0];
    if (!role) throw new Error("ROLE_CLIENTE_NOT_FOUND");

    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, TRUE)",
      [parsed.data.nombre, parsed.data.usuario, await hashPassword(parsed.data.clave)],
    );
    await connection.query(
      "INSERT INTO usuarios_roles (id_usuario, id_rol, activo) VALUES (?, ?, TRUE)",
      [result.insertId, role.id],
    );
    await connection.commit();

    const token = await createSession(result.insertId);
    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    await connection.rollback();
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "Ese nombre de usuario ya está registrado." }, { status: 409 });
    console.error("No se pudo registrar el usuario", error);
    return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 500 });
  } finally {
    connection.release();
  }
}
