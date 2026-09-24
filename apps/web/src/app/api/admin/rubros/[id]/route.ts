import { z } from "zod";
import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { canManageCatalog, getCurrentSessionUser } from "@/server/auth";
import { database } from "@/server/db";

const idSchema = z.coerce.number().int().positive();
const updateSchema = z.object({
  codigo: z.string().trim().min(1).max(40),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(5000).nullable().optional(),
  imagen: z.string().trim().max(500).nullable().optional(),
  orden: z.number().int().min(0).max(32767),
  idRubroPadre: z.number().int().positive().nullable(),
  activo: z.boolean(),
});

async function authorized() {
  const user = await getCurrentSessionUser();
  return canManageCatalog(user);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const id = idSchema.safeParse((await context.params).id);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !parsed.success) return NextResponse.json({ error: "Los datos del rubro no son válidos." }, { status: 400 });
  const data = parsed.data;
  const [result] = await database.query<ResultSetHeader>(
    `UPDATE rubros SET codigo = ?, slug = ?, nombre = ?, descripcion = ?, imagen = ?, orden = ?, id_rubro_padre = ?, activo = ? WHERE id = ?`,
    [data.codigo, data.slug, data.nombre, data.descripcion ?? null, data.imagen ?? null, data.orden, data.idRubroPadre, data.activo, id.data],
  );
  if (!result.affectedRows) return NextResponse.json({ error: "Rubro no encontrado." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  const [result] = await database.query<ResultSetHeader>("UPDATE rubros SET activo = FALSE WHERE id = ?", [id.data]);
  if (!result.affectedRows) return NextResponse.json({ error: "Rubro no encontrado." }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
