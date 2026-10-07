import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/authorization";
import { saveAdminCategory } from "@/lib/admin-categories-repository";
import { CATALOG_TAG } from "@/lib/products-repository";

const categorySchema = z.object({
  id: z.string().optional(),
  parentId: z.string().nullable(),
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe usar minúsculas, números y guiones"),
  imageUrl: z.string().max(500),
  coverUrl: z.string().max(500),
  order: z.number().int().min(0).max(99999),
  active: z.boolean(),
});

async function requireAdministrator() {
  const user = await getCurrentUser();
  return user && hasRole(user, "admin", "administrador") ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdministrator())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const input = categorySchema.parse(await request.json());
    await saveAdminCategory(input.id, input);
    revalidateTag(CATALOG_TAG);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la categoría";
    const duplicate = message.includes("Duplicate") || message.includes("duplicate");
    return NextResponse.json({ error: duplicate ? "Ese slug ya existe en esta categoría padre" : message }, { status: 400 });
  }
}
