import { z } from "zod";
import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { canManageCatalog, getCurrentSessionUser } from "@/server/auth";
import { database } from "@/server/db";

const rubroSchema = z.object({
  codigo: z.string().trim().min(1).max(40),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(5000).nullable().optional(),
  imagen: z.string().trim().max(500).nullable().optional(),
  orden: z.number().int().min(0).max(32767).default(0),
  idRubroPadre: z.number().int().positive().nullable().default(null),
});

async function authorized() {
  const user = await getCurrentSessionUser();
  return canManageCatalog(user);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const [rows] = await database.query(`
    SELECT id, id_rubro_padre AS idRubroPadre, codigo, slug, nombre, descripcion, imagen, orden, activo
    FROM rubros
    ORDER BY activo DESC, id_rubro_padre IS NOT NULL, orden ASC, nombre ASC
  `);
  return NextResponse.json({ rubros: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = rubroSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Los datos del rubro no son válidos." }, { status: 400 });
  const data = parsed.data;
  const [result] = await database.query<ResultSetHeader>(
    `INSERT INTO rubros (codigo, slug, nombre, descripcion, imagen, orden, id_rubro_padre)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.codigo, data.slug, data.nombre, data.descripcion ?? null, data.imagen ?? null, data.orden, data.idRubroPadre],
  );
  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
